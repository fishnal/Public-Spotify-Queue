var express = require('express');
var request = require('request');
var sprintfjs = require('sprintf-js');

// logs a message to the console with the time and date
function timeLog(msg) {
	let d = new Date();
	let args = [
		d.toDateString(),
		d.getHours(),
		d.getMinutes(),
		d.getSeconds()
	];

	console.log(sprintfjs.vsprintf('[%s %02d:%02d:%02d]', args), msg);
}

const PORT = process.env.PORT || 3000;
const HOST = `http://127.0.0.1:${PORT}`
const CLIENT_ID = process.env.CLIENT_ID || process.argv[2];
const CLIENT_SECRET = process.env.CLIENT_SECRET || process.argv[3];

// log client id and secret to console
timeLog(`id=${CLIENT_ID}`);
timeLog(`secret=${CLIENT_SECRET}`);

const SEND_FILE_OPTS = {
	root: `${process.cwd()}`
};

let server = express();

// start server
server.listen(PORT, () => {
	timeLog(`Server hosted on ${HOST}`);
});

// static files for the server
server.use(express.static('public'));

// GET /
// Gets home page
server.get('/', (serverRequest, serverResponse) => {
	timeLog('Requested root (/)');
	serverResponse.status(200);
	serverResponse.sendFile('public/index.html', SEND_FILE_OPTS);
});

// GET /index.html
// Redirects to home page (see `GET /`)
server.get('/index.html', (serverRequest, serverResponse) => {
	timeLog('Requested direct homepage file, redirecting (/index.html)');
	serverResponse.status(200).redirect('/');
});

// GET /token
// Gets access and refresh tokens
// code query parameter is code returned from authorization request
server.get('/token', (serverRequest, serverResponse) => {
	timeLog('Requested access token (/token)');

	let code = serverRequest.query['code'];

	if (!code) {
		// no code given, can't get token
		timeLog('No code');
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
			timeLog('Sent access token request data back');
			tokenBody = JSON.parse(tokenBody);
			// put status code in JSON body so we can handle it in jQuery
			tokenBody.status_code = tokenResponse.statusCode;
			serverResponse.status(tokenResponse.statusCode).json(tokenBody).end();
		});
	}
});

// GET /refresh
// Gets a new access token via an existing and valid refresh token
// refresh_token query parameter is the refresh token to use
server.get('/refresh', (serverRequest, serverResponse) => {
	timeLog('Requested to refresh access token (/refresh)');

	let refreshToken = serverRequest.query['refresh_token'];

	if (!refreshToken) {
		// no refresh token given, can't get another access token
		timeLog('No refresh token');
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
			timeLog('Sent access token request data back');
			tokenBody = JSON.parse(tokenBody);
			// put status code in JSON body so we can handle it in jQuery
			tokenBody.status_code = tokenResponse.statusCode;
			serverResponse.status(tokenResponse.statusCode).json(tokenBody).end();
		});
	}
});
