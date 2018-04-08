const SpotifyWebApi = require('spotify-web-api-node');
const opn = require('opn');

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
	// scope array holds possible scope parameters
	const state = 'our_secret_state'; /* TODO generate from the random generator api */
	
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
	opn(authURL, {app: ['chrome', '--incognito']});

	return spotifyApi;
}

module.exports = auth;