const SpotifyWebApi = require('spotify-web-api-node');
const opn = require('opn');
const request = require('sync-request')

/**
 * Authorizes the Spotify application with a client id, client secret, redirect URI,
 * and an option to have user approve of the application every time or not (showDialog).
 * @param {string} clientId the client id.
 * @param {string} clientSecret the client secret.
 * @param {string} redirectURI  the redirect URI.
 * @param {array} scopes authorization scopes.
 * @param {boolean} showDialog whether or not to approve application every time.
 */
function auth(clientId, clientSecret, redirectURI, scopes, showDialog=false) {
	var state = '';
	var res = request('GET', 'http://www.sethcardoza.com/api/rest/tools/random_password_generator/length:20');

	if (res.statusCode < 200 || res.statusCode >= 300) {
		console.log("Couldn't retrieve a random state, generating one...");
		for (var i = 0; i < 20; i++) {
			state += Math.floor(Math.random(10));
		}
	} else {
		console.log("Retrieved a random state");
		state = res.getBody();
	}

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

module.exports = auth;
