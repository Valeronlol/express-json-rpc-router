const { INVALID_REQUEST, METHOD_NOT_FOUND } = require('./error-codes')

/**
 * Just throw an error
 * @param {string} message
 * @param {number} code
 * @param {Object=} payload - additional error data
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
        this.throwRpcErr( `${INVALID_REQUEST.message}, wrong version - ${version}`, INVALID_REQUEST.code)
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

exports.isNil = val => val == null

exports.isFunction = fn => typeof fn === 'function'

/**
 * Validate passed user config
 * @param config
 */
exports.validateConfig = config => {
    if (typeof config !== 'object') {
        this.throwRpcErr('JSON-RPC error: userConfig should be an object.')
    }
    if ('methods' in config && (typeof config.methods !== 'object' || Array.isArray(config.methods))) {
        this.throwRpcErr('JSON-RPC error: methods should be an object')
    }
    if ('beforeMethods' in config && (typeof config.beforeMethods !== 'object' || Array.isArray(config.beforeMethods))) {
        this.throwRpcErr('JSON-RPC error: beforeMethods should be an object')
    }
    if ('afterMethods' in config && (typeof config.afterMethods !== 'object' || Array.isArray(config.afterMethods))) {
        this.throwRpcErr('JSON-RPC error: afterMethods should be an object')
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
 * @param {function|Array<function>} method
 * @param {Object} req
 * @param {Object} res
 * @return {void}
 */
exports.executeHook = (method, req, res) => {
    if (this.isFunction(method)) return method(req, res)
    else if (Array.isArray(method)) return Promise.all(method.map(method => method(req, res)))
    this.throwRpcErr('JSON-RPC error: wrong hook type passed')
}
