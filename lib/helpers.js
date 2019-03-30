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
