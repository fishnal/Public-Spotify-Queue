/**
 * Checks if an object is a string.
 *
 * @param {any} o the object to check
 * @returns {boolean} true if the object is a string.
 */
function isString(o) {
	return typeof o === 'string' || o instanceof String;
}

const DEFAULT_PREFIXES = [ '#', '//' ];

/**
 * Removes "comments" from an object.
 *
 * @param {object} obj the object to remove the comments from.
 * @param {string[]} prefixes the comment prefixes to look for.
 * @param {function} dynamicStartswith used for finding a string that starts with a comment prefix
 * @returns {void}
 */
function removeJsonComments0(obj, prefixes, dynamicStartswith) {
	if (!(obj instanceof Object)) {
		// not an object, bubble up
		return;
	} else if (obj instanceof Array) {
		// list of arrays (length of 2) to be passed into Array.prototype.splice.apply
		// the tricky part about the first element of the argsArray passed in (the index that splice
		// starts removing from) is that the indices change as elements are removed from the array
		// so the indices may appear off in the argsArray, but they will reflect the actual index
		// we wanted to originally start removing from
		/**
		 * @type {[][]}
		 */
		let spliceArgs = [];

		// instead of removing each comment when it's found, we can just store it's index into
		// spliceArgs (as the first element in the array), and remove them all at once later
		// if we find comments occuring next to each other, we can limit the number of times we
		// call splice by increasing the second element in one of the splice args arrays (by default
		// it's 1)
		obj.reduce((indData, elem, ind) => {
			if (isString(elem) && prefixes.find(dynamicStartswith, elem)) {
				if (indData.lastInd === ind - 1) {
					// this comment is next to the previously found comment
					spliceArgs[spliceArgs.length - 1][1]++;
				} else {
					spliceArgs[spliceArgs.length] = [ ind - indData.commentsFound, 1 ];
				}

				indData.commentsFound++;
				indData.lastInd = ind;
			} else {
				indData.lastInd = null;
			}

			return indData;
		}, { lastInd: null, commentsFound: 0 });

		// start removing the comments
		spliceArgs.forEach((args) => {
			Array.prototype.splice.apply(obj, args);
		});

		// iterate through the rest of the non-comment elements
		obj.forEach((elem) => {
			removeJsonComments0(elem, prefixes, dynamicStartswith);
		});
	} else {
		// just a normal object, iterate over keys
		for (let key in obj) {
			if (obj.hasOwnProperty(key)) {
				removeJsonComments0(obj[key], prefixes, dynamicStartswith);
			}
		}
	}
}

/**
 * Removes "comments" from an object (one that is usually JSON parsed). Since JSON doesn't
 * actually support comments, this function removes strings that start with a prefix. By
 * default, it looks for strings starting with `#` or `//`.
 *
 * An additional `prefixes` rest parameter is provided, which will look for strings starting with
 * the ones specified in the rest parameter. The default `#` and `//` prefixes are no longer checked
 * for, unless they are explicitly supplied in the rest parameter.
 *
 * Prefixes are ***NOT*** supported by escape sequences, so if a string starts with a comment prefix
 * but is not intended to be a comment, then it ***will*** be removed.
 *
 * @param {object} obj the object to remove comments from.
 * @param {string[]} [prefixes] optional prefixes to check for instead of the defaults
 * @returns {void}
 */
function removeJsonComments(obj, ...prefixes) {
	// use provided prefixes if prefixes.length length isn't 0
	removeJsonComments0(obj, prefixes.length
		? prefixes
		: DEFAULT_PREFIXES,
	function dynamicStartswith(prefix) {
		// `this` should be a string value or element from an object or array in `obj`
		if (this instanceof String || typeof this === 'string') {
			return this.startsWith(prefix);
		}

		return null;
	});
}

module.exports = {
	removeJsonComments
};
