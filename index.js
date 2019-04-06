/*!
 * JSON-RPC express middleware
 * Copyright(c) 2019 Valerii Kuzivanov.
 * MIT Licensed
 */
const {
  validateJsonRpcMethod,
  validateJsonRpcVersion,
  isNil,
  isFunction,
  validateConfig,
  setConfig,
  executeHook
} = require('./lib/helpers')
const { INTERNAL_ERROR } = require('./lib/error-codes')

const VERSION = '2.0'

const config = {
  methods: {},
  beforeMethods: {},
  afterMethods: {},
  onError: null
}

/**
 *
 * @param {object} userConfig Custom user router configuration
 * @return {function} Express middleware
 */
module.exports = function(userConfig) {
  validateConfig(userConfig)
  setConfig(config, userConfig)
  return async function(req, res, next) {
    if (Array.isArray(req.body)) {
      res.send(await handleBatchReq(req, res, next))
    } else if (typeof req.body === 'object') {
      res.send(await handleSingleReq(req, res, next))
    } else {
      next(new Error('JSON-RPC router error: req.body is required. Ensure that you install body-parser and apply it before json-router.'))
    }
  }
}

/**
 * JSON RPC request handler
 * @param {object} req
 * @param {object} res
 * @param {function} next
 * @return {Promise}
 */
async function handleSingleReq(req, res, next) {
  const { id, method, jsonrpc } = req.body
  try {
    validateJsonRpcVersion(jsonrpc, VERSION)

    validateJsonRpcMethod(method, config.methods)

    if (beforeMethod = (config.beforeMethods[method])) await executeHook(beforeMethod, req, res)

    const result = await config.methods[method](req, res, next)

    if (afterMethod = (config.afterMethods[method])) await executeHook(afterMethod, req, res)

    if (!isNil(id) ) return { jsonrpc, result, id }
  } catch (err) {
    if (isFunction(config.onError)) config.onError(err, req, res, next)

    return {
      jsonrpc: VERSION,
      error: {
        code: err.code || INTERNAL_ERROR.code,
        message: err.message || INTERNAL_ERROR.message
      },
      id: id || null
    }
  }
}

/**
 * Batch rpc request handler
 * @param {array} batchRpcData
 * @return {Promise}
 */
function handleBatchReq(batchRpcData) {
  return Promise.all(
    batchRpcData.reduce((memo, rpcData) => {
      const result = handleSingleReq(rpcData)
      if (!isNil(rpcData.id)) memo.push(result)
      return memo
    }, [])
  )
}
