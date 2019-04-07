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
 * JSON RPC request handler
 * @param {object} body
 * @return {Promise}
 */
async function handleSingleReq(body) {
  const { id, method, jsonrpc } = body
  try {
    validateJsonRpcVersion(jsonrpc, VERSION)

    validateJsonRpcMethod(method, config.methods)

    if (beforeMethod = (config.beforeMethods[method])) await executeHook(beforeMethod, body.params)

    const result = await config.methods[method](body)

    if (afterMethod = (config.afterMethods[method])) await executeHook(afterMethod, body.params)

    if (!isNil(id) ) return { jsonrpc, result, id }
  } catch (err) {
    if (isFunction(config.onError)) config.onError(err, body)
    return {
      jsonrpc: VERSION,
      error: {
        code: Number(err.code || err.status || INTERNAL_ERROR.code),
        message: err.message || INTERNAL_ERROR.message
      },
      id: id || null
    }
  }
}

/**
 * Batch rpc request handler
 * @param {Array} bachBody
 * @return {Promise}
 */
function handleBatchReq(bachBody) {
  return Promise.all(
    bachBody.reduce((memo, body) => {
      const result = handleSingleReq(body)
      if (!isNil(body.id)) memo.push(result)
      return memo
    }, [])
  )
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
    const rpcData = req.body
    if (Array.isArray(rpcData)) {
      res.send(await handleBatchReq(rpcData))
    } else if (typeof rpcData === 'object') {
      res.send(await handleSingleReq(rpcData))
    } else {
      next(new Error('JSON-RPC router error: req.body is required. Ensure that you install body-parser and apply it before json-router.'))
    }
  }
}
