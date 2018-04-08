/* responsible for generating a queue from a playlist a user selects */

/* import SpotifyWebApi */
const SpotifyWebApi = require('spotify-web-api-node');
const SpotifyObj = require('./spotify_objs.js');
const Utils = require('./utils.js');

/**
 * Constructs a Generator given an authenticated SpotifyWebApi wrapper
 * 
 * @param {SpotifyWebApi} api the authenticated SpotifyWebApi wrapper. 
 */
function Generator(api) {
	if (!(api instanceof SpotifyWebApi)) {
		/* must be a SpotifyWebApi object */
		throw new TypeError('invalid spotify wrapper');
	}

	var userPlaylists = null;
	var selectedPlaylist = null;

	/**
	 * Gets this user's playlists recursively
	 * @param {Number} limit the max amount of playlists to get per request 
	 * @param {Number} offset offset of the playlists for the request
	 * @param {Function} callback called after all playlists have been retrieved
	 */
	function getMyPlaylists0(limit, offset, callback) {
		/* using callbacks over promises */
		api.getUserPlaylists(null, { 'limit': limit, 'offset': offset }, (err, data) => {
			if (err) {
				throw err;
			} else {
				/* successful call */

				/* save all of these playlists (with a couple pieces of info though) */
				for (let i in data.body.items) {
					let playlist = data.body.items[i];

					/* only need name, id, and images (thumbnail) of the playlist */
					userPlaylists.push(new SpotifyObj.Playlist(
						playlist.name,
						playlist.id,
						playlist.images	
					));
				}

				/* base case */
				if (data.body.total == limit) {
					/* since the amount of playlists we got was limited by 'limit',
					 * we need to recurse and get th rest of the playlists */
					getMyPlaylists0(limit, offset + limit);
				} else {
					/* execute callback */
					callback(new Utils.SafeList(userPlaylists));
				}
			}
		});
	}

	this.getMyPlaylists = function(limit=20, callback) {
		if (limit < 0) {
			console.log("Invalid limit");
		} else if (limit > 50) {
			limit = 50;
		} else if (limit instanceof Function) {
			callback = limit;
			limit = 20;
		}

		userPlaylists = [];
		getMyPlaylists0(limit, 0, callback);
	}

	this.selectPlaylist = function(index) {
		if (!userPlaylists) {
			/* user playlists not defined yet */
			console.log("Load user's playlists first");
		} else if (index < 0 || index >= userPlaylists.length) {
			console.log("Out of bounds index");
		} else {
			/* update selected playlist, get tracks, generate queue */
			selectedPlaylist = userPlaylists[index];
			/* get shuffle state */
			api.getMyCurrentPlaybackState(null, (err, data) => {
				if (err) throw err;

				generateQueue(data['shuffle_state']);
			});
		}
	}

	function generateQueue() {

	}
}

module.exports = Generator;