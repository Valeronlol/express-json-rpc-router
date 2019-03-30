/*!
 * JSON-RPC express middleware
 * Copyright(c) 2019 Valerii Kuzivanov.
 * MIT Licensed
 */

const {
  validateJsonRpcMethod,
  validateJsonRpcVersion,
  throwRpcErr,
  isNil,
  isFunction
} = require('./lib/helpers')
const { INTERNAL_ERROR } = require('./lib/error-codes')

const VERSION = '2.0'

const config = {
  methods: {},
  beforeMethods: {},
  onError: null
}

/**
 *
 * @param {object} userConfig Custom user router configuration
 * @return {function} Express middleware
 */
module.exports = function(userConfig) {
  setConfig(userConfig)
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

/**
 * Validate and merge custom config with default
 * @param userConfig
 */
function setConfig(userConfig) {
  if ('methods' in userConfig && (typeof userConfig.methods !== 'object' || Array.isArray(userConfig.methods))) {
    throwRpcErr('JSON-RPC error: methods should be an object')
  }
  if ('beforeMethods' in userConfig && (typeof userConfig.beforeMethods !== 'object' || Array.isArray(userConfig.beforeMethods))) {
    throwRpcErr('JSON-RPC error: beforeMethods should be an object')
  }
  if ('onError' in userConfig && typeof userConfig.onError !== 'function') {
    throwRpcErr('JSON-RPC error: onError should be a function')
  }
  Object.assign(config, userConfig)
}

async function handleSingleReq({ id, method, params, jsonrpc } = {}) {
  try {
    validateJsonRpcVersion(jsonrpc, VERSION)
    validateJsonRpcMethod(method, config.methods)

    if (isFunction(config.beforeMethods[method])) {
      await config.beforeMethods[method](params)
    }

    const result = await config.methods[method](params)

    if (!isNil(id) ) {
      return { jsonrpc, result, id }
    }
  } catch (err) {
    if (isFunction(config.onError)) {
      config.onError(err)
    }

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

function handleBatchReq(batchRpcData) {
  return Promise.all(
    batchRpcData.reduce((memo, rpcData) => {
      if (!isNil(rpcData.id)) memo.push(handleSingleReq(rpcData))
      return memo
    }, [])
  )
}
