/**
 * Generates a random string, converts a random decimal to base 36, and discards the "0." from the
 * beginning amt represents how many times this is done (results concatenated).
 *
 * @param {number} amt the number of times to repeat the process.
 * @returns {string} the random string.
 */
export function randString(amt) {
  let str = "";

  for (let i = 0; i < amt; i++) {
    str += Math.random().toString(36).substring(2);
  }

  return str;
}

/**
 * Gets a URL's query parameter's value by it's key/name.
 *
 * @param {string} name the parameter name
 * @param {string} url the url to parse
 * @returns {string} the value of the parameter's value; null if not found
 */
export function getParameterByName(name, url) {
  // https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
  if (!url) {
    url = window.location.href;
  }

  name = name.replace(/[[\]]/g, "\\$&");
  let regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  let results = regex.exec(url);

  if (!results) {
    return null;
  } else if (!results[2]) {
    return '';
  }

  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * Returns true if the argument is a literal boolean, the string "true",
 * or the number 1
 *
 * @param {boolean|string|number} arg the argument to check
 * @returns {boolean} true if arg satisfies any of the above conditions
 */
export function toBoolean(arg) {
  return arg === true || arg === "true" || arg === 1;
}

export function getServerURL() {
  return window.location.origin;
}
