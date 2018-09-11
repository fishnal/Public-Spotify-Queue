const SkipList = require('./skiplist.js');
const { isString } = require('./utils.js');

/**
 * A Spotify Queue object, holding information about the user's authentication properties
 * as well as the queue data itself.
 */
class SpotifyQueue {
	/**
	 * Constructs a new SpotifyQueue given the owner's id.
	 *
	 * @param {string} ownerId the queue owner's Spotify id.
	 */
	constructor(ownerId) {
		if (!isString(ownerId)) {
			throw new TypeError('ownerId is not a string');
		}

		let data = new SkipList();

		/**
		 * Gets the owner's id.
		 *
		 * @returns {string} the owner's id.
		 */
		this.getOwnerId = () => ownerId;

		/**
		 * Gets the internal queue data.
		 *
		 * @returns {SkipList} the internal queue data.
		 */
		this.getData = () => data;
	}
}

module.exports = SpotifyQueue;
