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

	this.wrapper = spotifyWrapper;
}

/**
* Gets all of user's playlists (public, private, collaborative)
*/
Generator.prototype.getMyPlaylists = function() {
	/* want to retrieve all playlists, not just a couple (it caps at 50) */
	
	/* using callbacks over promises */
	this.wrapper.getUserPlaylists(null, null, (err, data) => {
		if (err) {
			/* TODO handle error */
			console.log(err);
		} else {
			/* successful call */
			/* TODO understand how data is returned, pretty sure its JSON */
			console.log(data);
		}
	});
}

module.exports = Generator;