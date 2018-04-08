/* handles main executions and statements */

const superagent = require('superagent');
const startServer = require('./server.js');
const auth = require('./authorize.js');
const Generator = require('./generator.js');

const clientId = 'acd0f18a3e124101af31f9b3582130c6';
const clientSecret = '276a4580f7e94dd1a20f5d797b95dbba';
const redirectURI = 'http://127.0.0.1:8080/'
/* our spotify wrapper */
var spotifyApiWrapper = auth(clientId, clientSecret, redirectURI, false);
/* refreshInterval serves to refresh our access token based on when the most recent access token expires */
var refreshInterval = null;
/* used to generate queue */
var generator;

/* start our local server, after having opened up our authorization url; 
 * the local server will basically start up as soon sa the auth url is opened
 */
startServer((url) => {
	/* get auth code in order to get tokens;
	 * first group will be the match basically,
	 * second group is the code
	 * third group is the state
	 */
	var match = url.match('\\/\\?code=(.*)&state=(.*)');
	
	/* issue occurred if we didn't match properly */
	if (match == null) {
		/* same idea as before, but code is now error */
		match = url.match('\\/\\?error=(.*)&state(.*)');
		console.log('There was an issue authorizing');
		throw new Error(match[1]);
	}

	/* get access and refresh tokens */
	spotifyApiWrapper.authorizationCodeGrant(match[1], accessTokenCallback);
});

function accessTokenCallback(err, data) {
	if (err) throw err;

	/* setting access and refresh tokens */
	spotifyApiWrapper.setAccessToken(data.body['access_token']);
	spotifyApiWrapper.setRefreshToken(data.body['refresh_token']);

	refreshInterval = setInterval(() => {
		/* refresh access token every X seconds, where X is determined by spotify's api;
		 * convert X into ms (so multiply by 1000)
		 */

		spotifyApiWrapper.refreshToken((err, data) => {
			if (err) throw err;

			/* setting new access token and expiration time */
			spotifyApiWrapper.setAccessToken(data.body['access_token']);
			refreshInterval._repeat = data.body['expires_in'] * 1000;
		});
	}, data.body['expires_in'] * 1000);

	/* now we can do what we want to hear with the spotify api */
	generator = new Generator(spotifyApiWrapper);

	/* get user playlists */
	generator.getMyPlaylists(afterPlaylists);
}

function afterPlaylists(playlists) {
	/* print all playlissts */
	playlists.forEach(playlist => {
		console.log(playlist.name);
	});

	console.log("================================");
	
	/* select a playlist, then generate queue based off of it */
	generator.selectPlaylist(1, () => {
		generator.generateQueue(afterGeneration);
	});
}

function afterGeneration(songs) {
	/* print all songs */
	songs.forEach(song => {
		console.log(song.name);
	});

	/* stop refresh interval */
	clearInterval(refreshInterval);
}