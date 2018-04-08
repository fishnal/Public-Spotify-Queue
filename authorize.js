const SpotifyWebApi = require('spotify-web-api-node');
const opn = require('opn');
const request = require('request')

/**
 * Authorizes the Spotify application with a client id, client secret, redirect URI,
 * and an option to have user approve of the application every time or not (showDialog).
 * @param {string} clientId the client id.
 * @param {string} clientSecret the client secret.
 * @param {string} redirectURI  the redirect URI.
 * @param {boolean} showDialog whether or not to approve application every time.
 */
function auth(clientId, clientSecret, redirectURI, showDialog=false) {
	// scope array holds possible scope parameters
	//'our_secret_state'; /* TODO generate from the random generator api */

	const scopes = ['user-read-private', 'playlist-read-private', 'playlist-read-collaborative',
		'user-read-currently-playing', 'user-modify-playback-state', 'user-read-playback-state'];
	
	/* init wrapper api with id, secret, uri, and response type */
	var spotifyApi = new SpotifyWebApi({
		'clientId' : clientId,
		'clientSecret' : clientSecret,
		'redirectUri' : redirectURI,
		response_type : 'code'
	});


	/* get auth url */
	var authURL = spotifyApi.createAuthorizeURL(scopes, state, showDialog);

	/* log url and open it in default browser */
	console.log('Open the link below in your browser if it doesn\'t automatically do so');
	console.log(authURL);
	opn(authURL);

	return spotifyApi;
}


request('http://www.sethcardoza.com/api/rest/tools/random_password_generator/length:20', { json: false}, (err, res, body) => {
	if (err) { return console.log(err); }
	console.log(body)
});

module.exports = auth;