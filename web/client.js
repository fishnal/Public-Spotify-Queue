var express = require('express');
var request = require('request');
var fs = require('fs');
var SpotifyApi = require('spotify-web-api-node');

const PORT = 3000;
const HOST = `http://127.0.0.1:${PORT}`
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const BASIC_AUTH = 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64');
const SCOPES = [
	'streaming',
	'user-modify-playback-state',
	'user-read-currently-playing',
	'user-read-playback-state'
];

let server = express();
let spotifyApi = new SpotifyApi({
	clientId: CLIENT_ID,
	clientSecret: CLIENT_SECRET,
});
let refresher = null;

server.listen(PORT, () => {
	console.log(`Server hosted on ${HOST}`);
});

server.get('/', (serverRequest, serverResponse) => {
	console.log('Requested root (/)');
	serverResponse.status(200).send(fs.readFileSync('web/index.html').toString()).end();
});

// GET request for /token
// Used to get an access token. Requires a "code" query parameter,
// which is retrieved via post-authorization in the redirected URL.
server.get('/token', (serverRequest, serverResponse) => {
	console.log('Requested access token (/token)');

	let code = serverRequest.query['code'];

	if (!code) {
		// no code given, can't get token
		console.log('No code');
		serverResponse.status(400).send('No code').end();
	} else {
		// make POST request to get access token
		request.post('https://accounts.spotify.com/api/token', {
			qs: {
				grant_type: 'authorization_code',
				code: code,
				redirect_uri: `${HOST}/`,
				client_id: CLIENT_ID,
				client_secret: CLIENT_SECRET
			},
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		}, (tokenError, tokenResponse, tokenBody) => {
			// just send data back, let client handle it
			console.log('Sent access token request data back');
			tokenBody = JSON.parse(tokenBody);
			// put status code in JSON body so we can handle it in jQuery
			tokenBody.status_code = tokenResponse.statusCode;
			serverResponse.status(tokenResponse.statusCode).json(tokenBody).end();
		});
	}
});

// GET request for /refresh
// Refreshes an access token. Requires a "refresh_token" query
// parameter.
server.get('/refresh', (serverRequest, serverResponse) => {
	console.log('Requested to refresh access token (/refresh)');

	let refreshToken = serverRequest.query['refresh_token'];

	if (!refreshToken) {
		// no refresh token given, can't get another access token
		console.log('No refresh token');
		serverResponse.status(400).send('No refresh token').end();
	} else {
		// make POST request to get a new access token
		request.post('https://accounts.spotify.com/api/token', {
			qs: {
				grant_type: 'refresh_token',
				refresh_token: refreshToken,
				client_id: CLIENT_ID,
				client_secret: CLIENT_SECRET
			},
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		}, (tokenError, tokenResponse, tokenBody) => {
			// just send data back, let client handle it
			console.log('Sent access token request data back');
			tokenBody = JSON.parse(tokenBody);
			// put status code in JSON body so we can handle it in jQuery
			tokenBody.status_code = tokenResponse.statusCode;
			serverResponse.status(tokenResponse.statusCode).json(tokenBody).end();
		});
	}
});
