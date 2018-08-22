const express = require('express');
const request = require('request-promise-native');
const sjcl = require('sjcl');
const csprng = require('csprng');
const SpotifyWebApi = require('spotify-web-api-node');
const { isString } = require('./utils.js');
const { SkipList } = require('./skiplist');

// gather port, host, and client credentials
const PORT = process.env.PORT || 3000;
const HOST = `http://localhost:${PORT}`
// spotify web api base url
const CLIENT_ID = process.env.CLIENT_ID || process.argv[2];
const CLIENT_SECRET = process.env.CLIENT_SECRET || process.argv[3];
let SPOTIFY_API_URL = process.env.TEST_SERVER || process.argv[4]
	|| 'https://accounts.spotify.com/api';
// for verifying track ids
const spotifyApi = new SpotifyWebApi({});

/**
 * Gets a client credentials access token for the Spotify Web Api.
 *
 * @returns {void}
 */
function getClientCredentialsToken() {
	request.post(`${SPOTIFY_API_URL}/token`, {
		qs: {
			'grant_type': 'client_credentials'
		},
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization':
				`Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
		}
	}).then((tokenResponse) => {
		tokenResponse = JSON.parse(tokenResponse);
		spotifyApi.setAccessToken(tokenResponse.access_token);
		// set a timer to get another client credentials token based on expiration date of current
		// token
		// make it get another token 2 minutes before actual expiration date
		setTimeout(getClientCredentialsToken, (tokenResponse.expires_in - 120) * 1000);
	}).catch((tokenError) => {
		// try again in 60 seconds
		setTimeout(getClientCredentialsToken, 60000);
	});
}

const SEND_FILE_OPTS = {
	root: `${process.cwd()}`
};

const app = express();
let server = null;

// start server
module.exports.start = () => {
	server = app.listen(PORT, () => {
		getClientCredentialsToken();
	});
}

// close the server
module.exports.close = (callback) => {
	if (!server) {
		throw new Error("server hasn't started");
	} else {
		server.close(callback);
	}
}

// static files for the server
app.use(express.static('src/web'));

// ==================================================================
//                         CLIENT ENDPOINTS
// ==================================================================

/**
 * @api {get} / Requests the home page.
 * @apiName GetHome
 * @apiGroup Client
 *
 * @apiExample {curl} Example usage:
 * 		curl -i http://localhost:3000/
 *
 * @apiVersion 1.0.0
 */
app.get('/', (serverRequest, serverResponse) => {
	serverResponse.status(200);
	serverResponse.sendFile('public/index.html', SEND_FILE_OPTS);
});

/**
 * @api {get} /index.html Redirects to /
 * @apiDescription Redirects to the home page
 * @apiName GetIndex
 * @apiGroup Client
 *
 *
 * @apiExample {curl} Example usage:
 * 		curl -i http://localhost:3000/index.html
 *
 * @apiVersion 1.0.0
 */
app.get('/index.html', (serverRequest, serverResponse) => {
	serverResponse.status(200).redirect('/');
});

// ==================================================================
// 					SPOTIFY AUTHENTICATION ENDPOINTS
// ==================================================================

// TODO more status codes in api docs for spotify auth endpoints

/**
 * @api {get} /token Requests access and refresh tokens
 * @apiDescription Request access and refresh tokens for Spotify's Web API given an authorization
 * code provided from the client authorizing this application through Spotify.
 * @apiName GetTokens
 * @apiGroup SpotifyAuth
 *
 * @apiParam {string} code the code returned from authorization request
 *
 * @apiSuccess (200) {string} access_token a token used for Spotify Web API services
 * @apiSuccess (200) {string} token_type how the token is used (always "Bearer")
 * @apiSuccess (200) {string} scope the scopes granted for this `access_token`
 * @apiSuccess (200) {number} expires_in how long the access token is valid for (in seconds)
 * @apiSuccess (200) {string} refresh_token a token used for retrieving another access token with
 * same scopes granted as this `access_token`
 * @apiSuccessExample {json} 200 Success-Response:
 * 		HTTP/1.1 200 OK
 * 		{
 *		    "access_token": "BQCKsz5Dv...eSNUbbI6w",
		    "token_type": "Bearer",
		    "scope": "user-library-read user-library-modify",
		    "expires_in": 3600,
		    "refresh_token": "AQBYahCgx...Xa8msLnyA"
 * 		}
 * @apiError (400) no_code missing `code` parameter
 * @apiErrorExample {json} 400 Error-Response:
 * 		HTTP/1.1 400 Bad Request
 * 		{
 * 		    "error": "no_code",
 * 		    "error_description": "a code parameter was not provided"
 * 		}
 *
 * @apiExample {curl} Example usage:
 * curl -i http://localhost:3000/token
 *      -d code=AQDk2ztJ3...qiNp9WCTI
 *
 * @apiVersion 1.0.0
 */
// TODO add @apiError for when spotify/api/token fails
app.get('/token', (serverRequest, serverResponse, next) => {
	let code = serverRequest.query['code'];

	if (!code) {
		// no code given, can't get token
		serverResponse.status(400).json({
			error: "no_code",
			error_description: "a code parameter was not provided"
		}).end();
	} else {
		// make POST request to get access token
		let tokenRequestQuery = {
			grant_type: 'authorization_code',
			code: code,
			redirect_uri: `${HOST}/`,
			client_id: CLIENT_ID,
			client_secret: CLIENT_SECRET
		};

		if (typeof next === 'function') {
			tokenRequestQuery.user = serverRequest.query['user'];
		}

		request.post(`${SPOTIFY_API_URL}/token`, {
			qs: tokenRequestQuery,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		}).then((tokenResponse) => {
			tokenResponse = JSON.parse(tokenResponse)
			serverResponse.status(200).json(tokenResponse).end();
		}).catch((tokenError) => {
			serverResponse.status(tokenError.statusCode).send(tokenError).end();
		});
		// TODO handle error from POST request
	}
});

/**
 * @api {post} /refresh Requests a new access token
 * @apiDescription Requests a new access token via an existing and valid refresh token
 * @apiName RefreshToken
 * @apiGroup SpotifyAuth
 *
 * @apiParam {string} refresh_token the refresh token to use
 *
 * @apiSuccess (200) {string} access_token the new access token
 * @apiSuccess (200) {string} token_type how the token is used (always "Bearer")
 * @apiSuccess (200) {string} scope the scopes granted for this `access_token`
 * @apiSuccess (200) {number} expires_in how long the access token is valid for (in seconds)
 * @apiSuccess (200) {string} refresh_token a token used for retrieving another access token with
 * (can be undefined, indicating refresh token was not changed)
 * @apiSuccessExample {json} 200 Success-Response:
 * 		HTTP/1.1 200 OK
 * 		{
 * 		    "access_token": "CRDLt06Ew...fTOccJ7x",
 * 		    "token_type": "Bearer",
 * 		    "scope": "user-library-read user-library-modify",
 * 		    "expires_in": 3600,
 * 		    "refresh_token": <new refresh token string, otherwise undefined>
 * 		}
 *
 * @apiError (400) no_refresh_token missing `refresh_token` parameter
 * @apiErrorExample {json} 400 Error-Response:
 * 		HTTP/1.1 400 Bad Request
 * 		{
 * 		    "error": "no_refresh_token",
 * 		    "error_description": "a refresh token parameter was not provided"
 * 		}
 *
 * @apiExample {curl} Example usage:
 * curl -X POST http://localhost:3000/refresh
 *      -d refresh_token=AQBYahCgx...Xa8msLnyA
 *
 *
 * @apiVersion 1.0.0
 */
app.post('/refresh', (serverRequest, serverResponse) => {
	let refreshToken = serverRequest.query['refresh_token'];

	if (!refreshToken) {
		// no refresh token given, can't get another access token
		serverResponse.status(400).send({
			error: "no_refresh_token",
			error_description: "a refresh token parameter was not provided"
		}).end();
	} else {
		// make POST request to get a new access token
		request.post(`${SPOTIFY_API_URL}/token`, {
			qs: {
				grant_type: 'refresh_token',
				refresh_token: refreshToken,
				client_id: CLIENT_ID,
				client_secret: CLIENT_SECRET
			},
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		}).then((tokenResponse) => {
			// just send data back, let client handle it
			tokenResponse = JSON.parse(tokenResponse);
			serverResponse.status(200).json(tokenBody).end();
		});

		/*
		(tokenError, tokenResponse, tokenBody) => {
			// just send data back, let client handle it
			timeLog('Sent access token request data back');
			tokenBody = JSON.parse(tokenBody);
			// put status code in JSON body so we can handle it in jQuery
			tokenBody.status_code = tokenResponse.statusCode;
			serverResponse.status(tokenResponse.statusCode).json(tokenBody).end();
		});
		*/
	}
});

// ==================================================================
//                          QUEUE ENDPOINTS
// ==================================================================

/**
 * Gets a new salt encoded in base 36 with 256 bits.
 *
 * @returns {string} the new salt.
 */
function newSalt() {
	return csprng(256, 36);
}

/**
 * Generates a hex key given a token/password and a salt.
 *
 * @param {string} token the token
 * @param {string} salt the salt
 * @returns {string}
 */
function generateHexKey(token, salt) {
	return sjcl.codec.hex.fromBits(sjcl.misc.pbkdf2(token, salt));
}

/**
 * A Spotify Queue object, holding information about the user's authentication properties
 * as well as the queue data itself.
 */
class SpotifyQueue {
	/**
	 * Constructs a new SpotifyQueue given the owner's id and their current access token.
	 *
	 * @param {string} ownerId the queue owner's Spotify id.
	 * @param {string} token the queue owner's current Spotify access token
	 */
	constructor(ownerId, token) {
		if (!isString(ownerId)) {
			throw new TypeError('ownerId is not a string');
		} else if (!isString(token)) {
			throw new TypeError('token is not a string');
		}

		let salt = newSalt();
		let hexKey = generateHexKey(token, salt);
		let data = new SkipList();

		/**
		 * Gets the owner's id.
		 *
		 * @returns {string} the owner's id.
		 */
		this.getOwnerId = () => ownerId;

		/**
		 * Gets the current access token.
		 *
		 * @returns {string} the current access token.
		 */
		this.getToken = () => token;

		/**
		 * Sets the current access token, updating the salt and the hex key if the new token is
		 * different than the previous one.
		 *
		 * @param {string} newToken the new access token.
		 * @returns {void}
		 */
		this.setToken = (newToken) => {
			if (newToken !== token) {
				token = newToken;
				salt = newSalt();
				hexKey = generateHexKey(token, salt);
			}
		}

		/**
		 * Gets the salt for this queue. Changes if the token changes.
		 *
		 * @returns {string} the current salt.
		 */
		this.getSalt = () => salt;

		/**
		 * Gets the hex key for this queue. Changes if the salt changes.
		 *
		 * @returns {string} the current hex key.
		 */
		this.getHexKey = () => hexKey;

		/**
		 * Gets the internal queue data.
		 *
		 * @returns {SkipList} the internal queue data.
		 */
		this.getData = () => data;
	}
}

/**
 * A map of active queues. Each queue is composed of it's internal data, as well as a web socket
 * that is used to communicate to other clients using that queue's data. If the web socket is closed
 * for a certain duration, then the queue is removed (no longer stored on the server).
 *
 * Each queue is mapped by a user's Spotify id. The queues can internally be accessed without
 * authentication, but if an external request is made to access the queue, then proper credentials
 * should be provided.
 *
 * @type {Object.<string, SpotifyQueue>}
 */
let queues = {};

/**
 * Authenticates a request to access a user's queue given their id and current access token.
 *
 * @param {string} userId the user's Spotify id
 * @param {string} token the user's current Spotify API access token
 * @returns {SpotifyQueue} null if the request was denied; otherwise the user's queue.
 */
function authQueueAccess(userId, token) {
	let queue = queues[userId];

	if (!queue) {
		return null;
	}

	let salt = queue.getSalt();
	let thisHex = generateHexKey(token, salt);

	if (thisHex === queue.hexKey) {
		return queue;
	}

	return null;
}

/**
 * Parameters for /queue/add_after endpoint
 * @typedef {Object} QueueAddAfterParams
 * @property {string} user_id the provided Spotify user id.
 * @property {string} token the provided access token.
 * @property {number} relative_key the key of the song to add after
 * @property {string} new_song_id the Spotify track id of the new song to add.
 */

// TODO add success and error to api docs

/**
 * @api {post} /queue/add_after Adds a song after another one
 * @apiDescription Adds a song after another song in the queue indicated by it's queue id
 * @apiName AddAfter
 * @apiGroup Queue
 *
 * @apiParam {string} user_id the user's Spotify id (for authentication)
 * @apiParam {string} token the provided access token (for authentication)
 * @apiParam {number} relative_key the key of the song to add after
 * @apiParam {string} new_song_id the Spotify track id of the new song to add (null to add it before
 * the first song in the queue)
 *
 * @apiSuccess (200) {number} new_key the key of the newly added song
 * @apiSuccessExample {json} Success-Response:
 * 		HTTP/1.1 200 OK
 * 		{
 * 		    "new_key": <key of added song>
 * 		}
 *
 * @apiError (404) key_not_found the relative key could not be found in the queue
 * @apiErrorExample {json} Error-Response:
 * 		HTTP/1.1 404 Not Found
 * 		{
 * 		    "error": "key_not_found",
 * 		    "error_description": "the relative key <relative_key> could not be found in the queue"
 * 		}
 *
 * @apiExample {curl} Example usage:
 * curl -X POST http://localhost:3000/queue/add_after
 *      -d user_id=fishnal
 *      -d token=BQCKsz5Dv...eSNUbbI6w
 *      -d relative_key=0
 *      -d new_song_id=3L3bIKIYIvzIsR6Obv2WB3
 *
 * @apiVersion 1.0.0
 */
app.post('/queue/add_after', (serverRequest, serverResponse) => {
	/**
	 * @type {QueueAddAfterParams}
	 */
	let params = serverRequest.query;

	// TODO handle parameter checking

	let queue = authQueueAccess(params.user_id, params.token);

	if (!queue) {
		// TODO deny request
	}

	/**
	 * Finishes up this request.
	 *
	 * @returns {void}
	 */
	function finish() {
		let newKey = queue.getData().addAfter(params.relative_key, params.new_song_id);
		// send the key of the newly added song back, client should appropriately add this
		// song to the display
		serverResponse.status(200).json({ new_key: newKey }).end();
	}

	// verify the track exists
	spotifyApi.getTrack(params.new_song_id).then((trackData) => {
		// safe to add this track
		finish();
	}).catch((trackErr) => {
		if (trackErr.statusCode === 404) {
			// track id was not found
			timeLog(`${params.new_song_id} was not found`);
			serverResponse.status(404).json({
				error: "key_not_found",
				error_description: "the relative key <relative_key> could not be found in the queue"
			}).end();
		} else {
			// for now, add the track id anyways, the client will regardless check to see if the
			// playback change was successful when playing this song
			finish();
		}
	});
});

// TODO remove song from queue
/**
 * @api {delete} /queue/song Removes a song from the queue
 * @apiDescription Removes a song from the queue given it's key
 * @apiName RemoveSong
 * @apiGroup Queue
 *
 * @apiParam {string} user_id the user's Spotify id (for authentication)
 * @apiParam {string} token the provided access token (for authentication)
 * @apiParam {number} key the song's key
 *
 * @apiError (404) key_not_found the key was not found in the queue
 * @apiErrorExample {json} Error-Response:
 * 		HTTP/1.1 404 Not Found
 * 		{
 * 		    "error": "key_not_found",
 * 		    "error_description": "the key was not found in the queue"
 * 		}
 *
 * @apiUsage {curl} Example usage:
 * curl -X DELETE http://localhost:3000/queue/song
 *      -d user_id=fishnal
 *      -d token=BQCKsz5Dv...eSNUbbI6w
 *      -d key=0
 *
 * @apiVersion 1.0.0
 */
app.delete('/queue/song', (serverRequest, serverResponse) => {
	let params = serverRequest.query;

	// TODO handle parameter checking

	let queue = authQueueAccess(params.user_id, params.token);

	if (!queue) {
		// TODO deny request
	}

	let removed = queue.getData().remove(params.key);

	if (!removed) {
		serverResponse.status(404).json({
			error: "key_not_found",
			error_description: "the key was not found in the queue"
		}).end();
	} else {
		serverResponse.sendStatus(200).end();
	}
});
