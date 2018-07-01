var express = require('express');
var request = require('request');
var fs = require('fs');

const PORT = 3000;
const HOST = `http://127.0.0.1:${PORT}`
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const SEND_FILE_OPTS = {
	root: `${process.cwd()}`
};

let server = express();

// start server
server.listen(PORT, () => {
	console.log(`Server hosted on ${HOST}`);
});

// GET request for /
// Gets home page
server.get('/', (serverRequest, serverResponse) => {
	console.log('Requested root (/)');
	serverResponse.status(200);
	serverResponse.sendFile('index.html', SEND_FILE_OPTS);
});

// GET request for /favicon.ico
// Gets favicon
server.get('/favicon.ico', (serverRequest, serverResponse) => {
	console.log('Requested favicon (/favicon.ico)');
	serverResponse.status(200).sendFile('favicon.ico', SEND_FILE_OPTS);
});

// GET request for /control.js
// Gets scripts for front-end control
server.get('/control.js', (serverRequest, serverResponse) => {
	console.log('Requested control.js (/control.js)');
	serverResponse.status(200).sendFile('control.js', SEND_FILE_OPTS);
});

// GET request for /spotify-web-api.js
// Gets Spotify Web API JS (frontend) library
server.get("/spotify-web-api.js", (serverRequest, serverResponse) => {
	console.log('Requested Spotify Web API (/deps/spotify-web-api.js)');
	serverResponse.status(200).sendFile('deps/spotify-web-api.js', SEND_FILE_OPTS);
});

// GET request for /token
// Gets access and refresh tokens
// code query parameter is code returned from authorization request
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
// Gets a new access token via an existing and valid refresh token
// refresh_token query parameter is the refresh token to use
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
