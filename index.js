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
  executeHook,
} = require('./lib/helpers')
const { INTERNAL_ERROR, } = require('./lib/error-codes')

const VERSION = '2.0'

/**
 *
 * @param {object} userConfig Custom user router configuration
 * @return {function} Express middleware
 */
module.exports = (userConfig) => {
  const config = {
    methods: {},
    beforeMethods: {},
    afterMethods: {},
    onError: null,
  }

  /**
   * JSON RPC request handler
   * @param {object} body
   * @return {Promise}
   */
  async function handleSingleReq(body, raw) {
    const {
      id, method, jsonrpc, params = {},
    } = body
    try {
      validateJsonRpcVersion(jsonrpc, VERSION)

      validateJsonRpcMethod(method, config.methods)

      const beforeMethod = config.beforeMethods[method]
      if (beforeMethod) {
        await executeHook(beforeMethod, params, null, raw)
      }

      const result = await config.methods[method](params, raw)

      const afterMethod = config.afterMethods[method]
      if (afterMethod) {
        await executeHook(afterMethod, params, result, raw)
      }

      if (!isNil(id)) return { jsonrpc, result, id, }
    } catch (err) {
      if (isFunction(config.onError)) config.onError(err, body)
      const error = {
        code: Number(err.code || err.status || INTERNAL_ERROR.code),
        message: err.message || INTERNAL_ERROR.message,
      }
      if (err && err.data) error.data = err.data
      return { jsonrpc, error, id: id || null, }
    }
    return null
  }

  /**
   * Batch rpc request handler
   * @param {Array} bachBody
   * @return {Promise}
   */
  function handleBatchReq(bachBody, raw) {
    return Promise.all(
      bachBody.reduce((memo, body) => {
        const result = handleSingleReq(body, raw)
        if (!isNil(body.id)) memo.push(result)
        return memo
      }, [])
    )
  }

  validateConfig(userConfig)

  setConfig(config, userConfig)

  return async (req, res, next) => {
    const rpcData = req.body
    if (Array.isArray(rpcData)) {
      res.send(await handleBatchReq(rpcData, { req, res, }))
    } else if (typeof rpcData === 'object') {
      res.send(await handleSingleReq(rpcData, { req, res, }))
    } else {
      next(new Error('JSON-RPC router error: req.body is required. Ensure that you install body-parser and apply it before json-router.'))
    }
  }
}
