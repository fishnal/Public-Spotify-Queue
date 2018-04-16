import { SpotifyWebApi } from '../spotify-web-api-node/spotify-web-api'
import opn from 'opn'
const request = require('sync-request')

/**
 * Authorizes the Spotify application with a client id, client secret, redirect URI,
 * and an option to have user approve of the application every time or not (showDialog).
 * @param {string} clientId the client id.
 * @param {string} clientSecret the client secret.
 * @param {string} redirectURI  the redirect URI.
 * @param {array} scopes authorization scopes.
 * @param {boolean} showDialog whether or not to approve application every time.
 * @return {SpotifyWebApi} the spotify web api that is currently being authenticated
 * (user will have to login an approve of this application before using the api object).
 */
export function auth(clientId: string, clientSecret: string, redirectURI: string, scopes: Array<any>, showDialog: boolean=false): SpotifyWebApi {
	let state: string = '';
	let res = request('GET', 'http://www.sethcardoza.com/api/rest/tools/random_password_generator/length:20');
	
	if (res.statusCode < 200 || res.statusCode >= 300) {
		console.log("Couldn't retrieve a random state, using some standard state");
		state = 'some-dumb-state';
	} else {
		console.log("Retrieved a random state");
		state = res.getBody();
	}
	
	/* init wrapper api with id, secret, uri, and response type */
	let api: SpotifyWebApi = new SpotifyWebApi({
		'clientId' : clientId,
		'clientSecret' : clientSecret,
		'redirectUri' : redirectURI,
		response_type : 'code'
	});


	/* get auth url */
	let authURL: string = api.createAuthorizeURL(scopes, state, showDialog);

	/* log url and open it in default browser */
	console.log('Open the link below in your browser if it doesn\'t automatically do so');
	console.log(authURL);
	opn(authURL, {app: ['chrome', '--incognito']});

	return api;
}