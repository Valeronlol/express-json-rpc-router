const { INVALID_REQUEST, METHOD_NOT_FOUND, } = require('./error-codes')

/**
 * Just throw an error
 * @param {string} message
 * @param {number} code
 */
exports.throwRpcErr = (message = 'JSON-RPC error', code = 500) => {
  const err = new Error(message)
  err.code = code
  throw err
}

/**
 * Validation for JSON-RPC version
 * @param {string} version
 * @param {string} requiredVersion
 */
exports.validateJsonRpcVersion = (version, requiredVersion) => {
  if (version !== requiredVersion) {
    this.throwRpcErr(`${INVALID_REQUEST.message}, wrong version - ${version}`, INVALID_REQUEST.code)
  }
}

/**
 * Validation for JSON-RPC method passed from browser
 * @param {string} method
 * @param {array} controller, list of existing methods
 */
exports.validateJsonRpcMethod = (method, controller) => {
  if (!method || typeof method !== 'string') {
    this.throwRpcErr(`${INVALID_REQUEST.message}, wrong method - ${method}`, INVALID_REQUEST.code)
  } else if (!(method in controller)) {
    this.throwRpcErr(`${METHOD_NOT_FOUND.message} - ${method}`, METHOD_NOT_FOUND.code)
  }
}

/**
 * Check is value nullable.
 * @param {any} val
 * @return {boolean}
 */
exports.isNil = (val) => val == null

/**
 * Check is value function.
 * @param {any} fn
 * @return {boolean}
 */
exports.isFunction = (fn) => typeof fn === 'function'

/**
 * Validate passed user config
 * @param config
 */
exports.validateConfig = (config) => {
  if (typeof config !== 'object') {
    this.throwRpcErr('JSON-RPC error: userConfig should be an object.')
  }
  if (typeof config.methods !== 'object' || Array.isArray(config.methods)) {
    this.throwRpcErr('JSON-RPC error: methods should be an object')
  }
  if ('beforeMethods' in config) {
    if (typeof config.beforeMethods !== 'object' || Array.isArray(config.beforeMethods)) {
      this.throwRpcErr('JSON-RPC error: beforeMethods should be an object')
    }

    Object.keys(config.beforeMethods).forEach((before) => {
      if (!(before in config.methods)) {
        this.throwRpcErr(`JSON-RPC error: beforeMethod should have the same name as method, passed: ${before}`)
      }
    })
  }
  if ('afterMethods' in config) {
    if (typeof config.afterMethods !== 'object' || Array.isArray(config.afterMethods)) {
      this.throwRpcErr('JSON-RPC error: afterMethods should be an object')
    }

    Object.keys(config.afterMethods).forEach((after) => {
      if (!(after in config.methods)) {
        this.throwRpcErr(`JSON-RPC error: afterMethods should have the same name as method, passed: ${after}`)
      }
    })
  }
  if ('onError' in config && typeof config.onError !== 'function') {
    this.throwRpcErr('JSON-RPC error: onError should be a function')
  }
}

/**
 * Merge custom config with default
 * @param {Object} config
 * @param {Object} userConfig
 */
exports.setConfig = (config, userConfig) => {
  Object.assign(config, userConfig)
}

/**
 * Execute passed user hooks
 * @param {function|Array<function>} hook
 * @param {Object} params
 * @param {any} result - method execution result
 * @return {void}
 */
exports.executeHook = (hook, params, result, raw) => {
  if (this.isFunction(hook)) {
    return hook(params, result, raw)
  }
  if (Array.isArray(hook)) {
    return Promise.all(
      hook.map((h) => h(params, result, raw))
    )
  }
  return this.throwRpcErr('JSON-RPC error: wrong hook type passed')
}
