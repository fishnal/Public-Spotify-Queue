/* responsible for generating a queue from a playlist a user selects */

/* import SpotifyWebApi */
const SpotifyWebApi = require('spotify-web-api-node');
const SpotifyObj = require('./spotify_objs.js');


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

	var _currCallback;
	var userPlaylists = null;
	var selectedPlaylist = null;

	/**
	 * Gets this user's playlists recursively
	 * @param {Number} limit the max amount of playlists to get per request 
	 * @param {Number} offset offset of the playlists for the request
	 */
	function getMyPlaylists0(limit, offset) {
		/* using callbacks over promises */
		spotifyWrapper.getUserPlaylists(null, { 'limit': limit, 'offset': offset }, (err, data) => {
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
				}
			}
		});
	}

	this.getMyPlaylists = function(limit=20) {
		/* reset list of user playlists */
		userPlaylists = [];
		getMyPlaylists0(limit, 0);

		/* return copy of user playlists (so ours remains untouched) */
		return userPlaylists.slice(0);
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
			/* account for states of shuffle and repeat */
			generateQueue(true, [1,2,3,4]);
		}
	}
	generateQueue(true, [1,2,3,4]);
	
	function generateQueue(isShuffled, plist) {
		var original = [1,2,3,4,5,6,7,8,9,10]
		var yatesShuffle = []

		if(isShuffled){
			for(let i = original.length-1; i >=0; i--){
				let j = Math.random(i)
				yatesShuffle[j] = temp
				yatesShuffle[j] = yatesShuffle[i]
				yatesShuffle[i] = temp
			}
			return yatesShuffle
		} else {
			return plist
		}
	}
}

generateQueue(true, [1,2,3,4]);
	
function generateQueue(isShuffled, plist) {
	var original = [1,2,3,4,5,6,7,8,9,10]
	var yatesShuffle = original.slice(0)

	if(isShuffled){
		for(let i = original.length-1; i >=0; i--){
			let j = Math.floor(Math.random()*(i+1))
			let temp = ''
			temp = yatesShuffle[j]
			yatesShuffle[j] = yatesShuffle[i]
			yatesShuffle[i] = temp
		}
		console.log(yatesShuffle)
	} else {
		console.log(original)
	}
}

module.exports = Generator;