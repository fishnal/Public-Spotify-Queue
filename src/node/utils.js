/**
 * Checks if an object is a string.
 *
 * @param {any} o the object to check
 * @returns {boolean} true if the object is a string.
 */
function isString(o) {
  return typeof o === 'string' || o instanceof String;
}

/**
 * Checks if an object is a number.
 *
 * @param {any} o the object to check
 * @returns {boolean} true if the object is a number
 */
function isNumber(o) {
  return typeof o === 'number' || o instanceof Number;
}

/**
 * Checks if an object is a function.
 *
 * @param {object} o the object to check
 * @returns {boolean} true if the object is a function
 */
function isFunction(o) {
  return typeof o === 'function' || o instanceof Function;
}

module.exports = {
  isString,
  isNumber,
  isFunction
};
