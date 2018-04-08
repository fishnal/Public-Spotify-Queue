/* responsible for generating a queue from a playlist a user selects */

/* import SpotifyWebApi */
const SpotifyWebApi = require('spotify-web-api-node');

/**
 * Constructs a Generator given an authenticated SpotifyWebApi wrapper
 * 
 * @param {SpotifyWebApi} spotifyWrapper the authenticated SpotifyWebApi wrapper. 
 */
function Generator(spotifyWrapper) {
	if (!(spotifyWrapper instanceof SpotifyWebApi)) {
		/* must be a SpotifyWebApi object */
		throw new TypeError('invalid spotify wrapper');
	}

	var userPlaylists = [];

	function getMyPlaylists0(limit, offset) {
		/* using callbacks over promises */
		spotifyWrapper.getUserPlaylists(null, { 'limit': limit, 'offset': offset }, (err, data) => {
			if (err) {
				throw err;
			} else {
				/* successful call */
				for (let i in data.body.items) {
					userPlaylists.push(data.body.items[i]);
				}

				if (data.body.total == limit) {
					getMyPlaylists0(limit, offset + limit);
				}
			}
		});
	}

	this.getMyPlaylists = function(limit=20) {
		getMyPlaylists0(limit, 0);
	}
}

module.exports = Generator;