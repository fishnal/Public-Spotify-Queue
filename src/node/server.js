const humps = require('humps');
const express = require('express');
const request = require('request-promise-native');
const SpotifyWebApi = require('spotify-web-api-node');
const { isString } = require('./utils.js');
const SpotifyQueue = require('./spotify_queue.js');

// port, domain, redirect URI, and application credentials; these are initialized when you start
// the server by passing in an options argument
let PORT = null;
let DOMAIN = null;
let SERVER_URL = null;
let CLIENT_ID = null;
let CLIENT_SECRET = null;

// These URLs are dynamic for testing purposxes. A mock test server is used in place of the actual
// Spotify web servers so we can have predictable outputs.
let SPOTIFY_ACCOUNTS_URL = process.env.TEST
    ? `${process.env.TEST_SERVER}:${process.env.TEST_PORT}`
    : 'https://accounts.spotify.com/api';
let SPOTIFY_API_URL = process.env.TEST
    ? `${process.env.TEST_SERVER}:${process.env.TEST_PORT}/api`
    : 'https://api.spotify.com/v1';

// for verifying track ids
const spotifyApi = new SpotifyWebApi({});

// if we're testing, modify SpotifyWebApi prototype functions to match testing environment
if (process.env.TEST) {
    spotifyApi.getTrack = (trackId) => {
        return request.get({
            uri: `${SPOTIFY_API_URL}/track`,
            qs: {
                id: trackId
            },
            headers: {
                "Authorization": `Bearer ${spotifyApi.getAccessToken()}`
            }
        });
    }
}

// a timer for getting a client credentials access token
let clientCredentialsRefresher = null;

/**
 * Gets a client credentials access token for the Spotify Web Api. Used in verifying track ids.
 *
 * @returns {Promise<any>}
 */
function getClientCredentialsToken() {
    return request.post(`${SPOTIFY_ACCOUNTS_URL}/token`, {
        qs: {
            grant_type: 'client_credentials',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
}

// options for serving static content
const SEND_FILE_OPTS = {
    root: `${process.cwd()}`
};

// express.js variables
const app = express();
let server = null;

// spotify queues
let queues = {};

/**
 * Starts the mock server.
 *
 * @param opts options for the server, must include Spotify application client id and
 * secret.
 * @param {String} opts.clientId <required> Spotify application client id
 * @param {String} opts.clientSecret <required> Spotify application client secret
 * @param {Number|String} opts.port [optional] port for server to run on, defaults to 3000
 * @param {String} opts.domain [optional] domain of the server, defaults to http://localhost
 * @returns {Promise<void>} resolves after starting and performing startup post-startup operations,
 * rejects if an error is thrown.
 */
module.exports.start = function({clientId, clientSecret, port, domain}) {
    if (!clientId) throw new Error('no client id');
    else if (!clientSecret) throw new Error('no client secret');

    CLIENT_ID = clientId;
    CLIENT_SECRET = clientSecret;
    PORT = port || 3000;
    DOMAIN = domain || 'http://localhost';
    SERVER_URL = `${DOMAIN}:${PORT}`;

    return new Promise((resolve, reject) => {
        try {
            server = app.listen(PORT, () => {
                // only retrieve client credentials token if we're not testing
                if (!process.env.TEST) {
                    getClientCredentialsToken().then((tokenResponse) => {
                        tokenResponse = JSON.parse(tokenResponse);

                        // set server-side spotify api wrapper's access token so we can verify track
                        // ids later on
                        spotifyApi.setAccessToken(tokenResponse.access_token);

                        // make psq token without user id and refresh token
                        tokenResponse.psq_token = Buffer
                            .from(`;${tokenResponse.access_token};;${Date.now()}`)
                            .toString('base64');

                        // set a timer to get another client credentials token based on expiration
                        // date of current token (make it get another token 2 minutes before actual
                        // expiration date)
                        clientCredentialsRefresher = setTimeout(getClientCredentialsToken,
                            (tokenResponse.expires_in - 120) * 1000);

                        console.log(`Server started on ${SERVER_URL}`);
                        resolve();
                    }).catch((tokenError) => {
                        console.error('Failed to retrieve client credentials token');
                        reject(tokenError);
                    });
                } else {
                    resolve();
                }
            });
        } catch (err) {
            console.error('Failed to start server');
            reject(err);
        }
    });
}

/**
 * Stops the mock server, restoring default settings, clearing any timers, and deleting
 * authorization and token information.
 *
 * @returns {Promise<void>} resolves after closing and performing cleanup operations, rejects if an
 * error is thrown
 */
module.exports.close = function() {
    // TODO util.promsifiy?
    return new Promise((resolve, reject) => {
        try {
            server.close(() => {
                clearTimeout(clientCredentialsRefresher);
                console.log('Server closed');
                resolve();
            });
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Gets the redirect URI that this server uses in it's spotify application.
 *
 * @returns {string} the redirect uri used
 */
module.exports.getRedirectURI = function() { return SERVER_URL; };

// static files for the server
app.use('/public', express.static('./public'));
app.use('/build', express.static('./build'));

// for testing purposes only, ensures that #getClientCredentialsToken(callback) works
app.get('/client_credentials', (serverRequest, serverResponse) => {
    if (!process.env.TEST) {
        serverResponse.status(403).end();
    }

    if (serverResponse.finished) {
        return;
    }

    getClientCredentialsToken().then((tokenResponse) => {
        tokenResponse = JSON.parse(tokenResponse);
        tokenResponse.psq_token = Buffer
            .from(`;${tokenResponse.access_token};;${Date.now()}`)
            .toString('base64');
        serverResponse.status(200).send(tokenResponse);
        // update spotify api wrapper's token
        spotifyApi.setAccessToken(tokenResponse.access_token);
    }).catch((tokenErr) => {
        serverResponse.status(400).send(tokenErr);
    });
});

// ==================================================================
//                          CLIENT ENDPOINTS
// ==================================================================

/**
 * @api {get} / Requests the home page.
 * @apiName GetHome
 * @apiGroup Client
 *
 * @apiExample {shell} cURL
 * curl http://localhost:3000/
 * @apiExample {javascript} Axios
 * axios.get('http://localhost:3000/');
 *
 * @apiVersion 0.1.1
 */
app.get('/', (serverRequest, serverResponse) => {
    serverResponse.status(200);
    serverResponse.sendFile('public/html/index.html', SEND_FILE_OPTS);
});

/**
 * @api {get} /index.html Redirects to /
 * @apiDescription Redirects to the home page
 * @apiName GetIndex
 * @apiGroup Client
 *
 * @apiExample {shell} cURL
 * curl http://localhost:3000/index.html
 * @apiExample {javascript} Axios
 * axios.get('http://localhost:3000/index.html');
 *
 * @apiVersion 0.1.1
 */
app.get('/index.html', (serverRequest, serverResponse) => {
    serverResponse.redirect('/');
});

// ==================================================================
//                  SPOTIFY AUTHENTICATION ENDPOINTS
// ==================================================================

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
 * @apiSuccess (200) {string} psq_token a token used for making queue-based requests through this
 * server
 *
 * @apiSuccessExample {json} 200 Success-Response
 *   HTTP/1.1 200 OK
 *   {
 *    "access_token": "BQCKsz5Dv...eSNUbbI6w",
 *    "token_type": "Bearer",
 *    "scope": "user-library-read user-library-modify",
 *    "expires_in": 3600,
 *    "refresh_token": "AQBYahCgx...Xa8msLnyA",
 *    "psq_token": "Yy3bxKIYIqzIsy6Oxv2W21"
 *   }
 *
 * @apiError (400) invalid_request `code` isn't supplied for grant type `authorization_code`
 * @apiError (400) invalid_grant `code` doesn't exist or has expired
 *
 * @apiErrorExample {json} 400 No Code
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "error": "invalid_request",
 *     "error_description": "code must be supplied"
 *   }
 * @apiErrorExample {json} 400 Invalid Code
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "error": "invalid_grant",
 *     "error_description": "Invalid authorization code"
 *   }
 * @apiErrorExample {json} 400 Expired Code
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "error": "invalid_grant",
 *     "error_description": "Authorization code expired"
 *   }
 *
 * @apiExample {shell} cURL
 * curl http://localhost:3000/token
 *   -d code=AQDk2ztJ3...qiNp9WCTI
 * @apiExample {javascript} Axios
 * axios({
 *   url: 'http://localhost:3000/token',
 *   method: 'get',
 *   params: {
 *     code: 'AQDk2ztJ3...qiNp9WCTI'
 *   }
 * });
 *
 * @apiVersion 0.1.1
 */
app.get('/token', (serverRequest, serverResponse) => {
    let queries = serverRequest.query;

    // make POST request to get access token
    let tokenRequestQuery = {
        grant_type: 'authorization_code',
        code: queries.code,
        redirect_uri: `${SERVER_URL}`,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
    };

    request.post(`${SPOTIFY_ACCOUNTS_URL}/token`, {
        qs: tokenRequestQuery,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(async(tokenResponse) => {
        // parse response
        tokenResponse = JSON.parse(tokenResponse);

        // get user's id
        let profile = JSON.parse(await request(
            `${SPOTIFY_API_URL}/me`,
            { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        ));

        // add psq token to the response
        tokenResponse.psq_token = Buffer
            .from(`${profile.id};`
                + `${tokenResponse.access_token};`
                + `${tokenResponse.refresh_token || ''};`
                + `${Date.now()}`)
            .toString('base64');

        // make the queue
        queues[profile.id] = queues[profile.id] || new SpotifyQueue(profile.id);

        serverResponse.status(200).json(tokenResponse);
    }).catch((tokenError) => {
        serverResponse.status(tokenError.statusCode).send(tokenError.error);
    });
});

/**
 * @api {post} /refresh Requests a new access token
 * @apiDescription Requests a new access token via an existing and valid access token provided by
 * this server
 * @apiName RefreshToken
 * @apiGroup SpotifyAuth
 *
 * @apiParam {string} psq_token the access token provided by this server
 *
 * @apiSuccess (200) {string} access_token the new access token
 * @apiSuccess (200) {string} token_type how the token is used (always "Bearer")
 * @apiSuccess (200) {string} scope the scopes granted for this `access_token`
 * @apiSuccess (200) {number} expires_in how long the access token is valid for (in seconds)
 * @apiSuccess (200) {string} refresh_token a token used for retrieving another access token with
 * (can be undefined/null, indicating refresh token was not changed)
 * @apiSuccess (200) {string} psq_token a token used for making queue-based requests through this
 * server
 *
 * @apiSuccessExample {json} 200 Success-Response:
 *   HTTP/1.1 200 OK
 *   {
 *     "access_token": "CRDLt06Ew...fTOccJ7x",
 *     "token_type": "Bearer",
 *     "scope": "user-library-read user-library-modify",
 *     "expires_in": 3600,
 *     "refresh_token": <new refresh token string, otherwise undefined>,
 *     "psq_token": "611lfexq082lfmex934"
 *   }
 *
 * @apiError (400) invalid_request `psq_token` isn't supplied
 * @apiError (400) invalid_grant `psq_token` doesn't exist
 *
 * @apiErrorExample {json} 400 No PSQ Token
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "error": "invalid_request",
 *     "error_description": "psq_token must be supplied"
 *   }
 * @apiErrorExample {json} 400 Invalid PSQ Token
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "error": "invalid_grant",
 *     "error_description": "Invalid PSQ token"
 *   }
 *
 * @apiExample {shell} cURL
 * curl -X POST http://localhost:3000/refresh
 *      -d psq_token=Yy3bxKIYIqzIsy6Oxv2W21
 * @apiExample {javascript} Axios
 * axios({
 *   url: 'http://localhost:3000/refresh',
 *   method: 'post',
 *   params: {
 *     psq_token: 'Yy3bxKIYIqzIsy6Oxv2W21'
 *   }
 * });
 *
 * @apiVersion 0.1.1
 */
app.post('/refresh', (serverRequest, serverResponse) => {
    let psqToken = serverRequest.query['psq_token'];
    let parsedToken = Buffer.from(psqToken || '', 'base64').toString().split(';');

    if (!psqToken) {
        serverResponse.status(400).json({
            error: 'invalid_request',
            error_description: 'psq_token must be supplied'
        });
    } else if (parsedToken.length !== 4 || !parsedToken[2].length) {
        serverResponse.status(400).json({
            error: 'invalid_grant',
            error_description: 'Invalid PSQ token'
        });
    }

    if (serverResponse.finished) {
        return;
    }

    // make POST request to get a new access token
    request.post(`${SPOTIFY_ACCOUNTS_URL}/token`, {
        qs: {
            grant_type: 'refresh_token',
            refresh_token: parsedToken[2],
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then((tokenResponse) => {
        // parse response
        tokenResponse = JSON.parse(tokenResponse);
        // store psq token into response
        tokenResponse.psq_token = Buffer
            .from(`${parsedToken[0]};`
                + `${tokenResponse.access_token};`
                + `${tokenResponse.refresh_token || parsedToken[2]};`
                + `${Date.now()}`)
            .toString('base64');

        serverResponse.status(200).json(tokenResponse);
    }).catch((tokenError) => {
        serverResponse.status(400).json({
            error: 'invalid_grant',
            error_description: 'Invalid PSQ token'
        });
    });
});

// ==================================================================
//                          QUEUE ENDPOINTS
// ==================================================================

/**
 * Authenticates a request to access an access token granted from this server.
 *
 * @param {string} token the accesss token
 * @returns {SpotifyQueue} null if the request was denied; otherwise the user's queue.
 */
function authQueueAccess(token) {
    if (!isString(token) || !token.startsWith('Bearer ')) {
        return null;
    }

    // user_id;spotify_access_token;spotify_refresh_token;time_granted
    let parsedToken = Buffer.from(token.split(' ')[1], 'base64').toString().split(';');

    if (parsedToken.length !== 4) {
        return null;
    }

    return queues[parsedToken[0]];
}

/**
 * @api {post} /queue/add_after Adds a song after another one
 * @apiDescription Adds a song after another song in the queue indicated by it's queue id
 * @apiName AddAfter
 * @apiGroup Queue
 *
 * @apiHeader {string} authorization prefixed with `Bearer ` (space-sensitive), contains the user's
 * access token provided by this server.
 * @apiHeaderExample {json} Authorization Header Example
 *   {
 *     "Authorization": "Bearer <access_token>"
 *   }
 * @apiParam {number} relative_key the key of the song to add after (null to add it before
 * the first song in the queue)
 * @apiParam {string} new_song_id the Spotify track id of the new song to add
 *
 * @apiSuccess (200) {number} new_key the key of the newly added song
 *
 * @apiSuccessExample {json} 200 Success-Response:
 *   HTTP/1.1 200 OK
 *   {
 *     "new_key": 1
 *   }
 *
 * @apiError (400) invalid_request
 * + `relative_key` is not provided
 * + `new_song_id` is not provided
 * + `relative_key` is positive infinity
 * + there's no room to add the song after the desired `relative_key` (this was done too many times)
 * + the new song key is an unsafe integer
 * @apiError (400) invalid_type
 * + `relative_key` is not a number
 * + `new_song_id` is not a string
 * @apiError (401) invalid_credentials provided user id and/or access token is wrong
 * @apiError (404) song_not_found the song (identified by `new_song_id` could not be found)
 * @apiError (404) key_not_found `relative_key` could not be found in the queue
 *
 * @apiErrorExample {json} 400 No Relative Key
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "error": "invalid_request",
 *     "error_description": "relative_key must be supplied"
 *   }
 * @apiErrorExample {json} 400 Bad Relative Key Type
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "error": "invalid_type",
 *     "error_description": "relative_key must be a number"
 *   }
 * @apiErrorExample {json} 400 No New Song Id
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "error": "invalid_request",
 *     "error_description": "new_song_id must be supplied"
 *   }
 * @apiErrorExample {json} 401 Invalid Access Token
 *   HTTP/1.1 401 Unauthorized
 *   {
 *     "error": "invalid_credentials",
 *     "error_description": "authorization header or access token is invalid"
 *   }
 * @apiErrorExample {json} 404 Song Not Found
 *   HTTP/1.1 404 Not Found
 *   {
 *     "error": "song_not_found",
 *     "error_description": "song <new_song_id> not found"
 *   }
 * @apiErrorExample {json} 400 Positive Infinity Relative Key
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "error": "invalid_request",
 *    "error_description": "relative_key must be less than positive infinity"
 *   }
 * @apiErrorExample {json} 400 Too Much Averaging
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "error": "invalid_request",
 *     "error_description": "too much averaging"
 *   }
 * @apiErrorExample {json} 400 Unsafe Integer
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "error": "invalid_request",
 *     "error_description": "unsafe integer"
 *   }
 * @apiErrorExample {json} 404 Key Not Found
 *   HTTP/1.1 404 Not Found
 *   {
 *     "error": "key_not_found",
 *     "error_description": "relative key <relative_key> not found"
 *   }
 *
 * @apiExample {shell} cURL
 * curl -X POST http://localhost:3000/queue/add_after
 *      -H "Authorization: Bearer Yy3bxKIYIqzIsy6Oxv2W21"
 *      -d relative_key=0
 *      -d new_song_id=3L3bIKIYIvzIsR6Obv2WB3
 * @apiExample {javascript} Axios
 * axios({
 *   url: 'http://localhost:3000/queue/add_after',
 *   method: 'post',
 *   headers: {
 *     'Authorization': 'Bearer Yy3bxKIYIqzIsy6Oxv2W21'
 *   }
 *   params: {
 *     relative_key: 0,
 *     new_song_id: '3L3bIKIYIvzIsR6Obv2WB3'
 *   }
 * });
 *
 * @apiVersion 0.1.1
 */
app.post('/queue/add_after', async(serverRequest, serverResponse) => {
    let headers = serverRequest.headers;
    let params = serverRequest.query;

    let queue = authQueueAccess(headers['authorization']);

    if (!queue) {
        // bad credentials
        serverResponse.status(401).json({
            error: 'invalid_credentials',
            error_description: "authorization header or access token is invalid"
        });
    } else if (!params.relative_key) {
        // no relative key
        serverResponse.status(400).json({
            error: 'invalid_request',
            error_description: 'relative_key must be supplied'
        });
    } else if (params.relative_key !== 'null'
            && Number.isNaN(params.relative_key = Number(params.relative_key))) {
        // bad type relative key (not "null" or a number)
        serverResponse.status(400).json({
            error: 'invalid_type',
            error_description: 'relative_key must be a number or "null"'
        });
    } else if (!params.new_song_id) {
        // no new song id
        serverResponse.status(400).json({
            error: 'invalid_request',
            error_description: 'new_song_id must be supplied'
        });
    }

    if (serverResponse.finished) {
        return;
    }

    if (params.relative_key === 'null') {
        // convert to null
        params.relative_key = null;
    }

    try {
        // if the id is a Spotify track URI, then extract it's track id
        let uriExtractor = /^spotify:track:(?<uriTrackId>[A-Za-z0-9]+)$/.exec(params.new_song_id);

        if (uriExtractor) {
            // it matched the spotify track uri regex, so extract the track id from the uri and use that
            // as the new song id
            params.new_song_id = uriExtractor.groups['uriTrackId'];
        }

        let trackData = await spotifyApi.getTrack(params.new_song_id);
        trackData = trackData.body; // this is here in case we ever need to use this data

        try {
            let newKey = queue.getData().addAfter(params.relative_key, params.new_song_id);

            // send the key of the newly added song back, client should appropriately add this
            // song to the display
            serverResponse.status(200).json({ new_key: newKey });
        } catch (err) {
            // check errors
            let statusCode = err instanceof RangeError ? 400 : 404;

            serverResponse.status(statusCode).json({
                error: statusCode === 400 ? 'invalid_request' : 'key_not_found',
                error_description: humps.decamelize(err.message)
            });
        }
    } catch (err) {
        serverResponse.status(404).json({
            error: 'song_not_found',
            error_description: `song ${params.new_song_id} not found`
        });
    }
});

/**
 * @api {delete} /queue/remove Removes a song from the queue
 * @apiDescription Removes a song from the queue given it's key
 * @apiName RemoveSong
 * @apiGroup Queue
 *
 * @apiHeader {string} authorization prefixed with `Bearer ` (space-sensitive), contains the user's
 * access token provided by this server.
 * @apiHeaderExample {json} Authorization Header Example
 *   {
 *     "Authorization": "Bearer <access_token>"
 *   }
 * @apiParam {number} key the song's key
 *
 * @apiError (400) invalid_request
 * + `key` is not provided
 * + `key` is not finite
 * @apiError (400) invalid_type `key` is not a number
 * @apiError (401) invalid_credentials the provided user id and/or access token is wrong
 * @apiError (404) key_not_found `key` was not found in the queue
 *
 * @apiErrorExample {json} 400 No Key
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "error": "invalid_request",
 *     "error_description": "key must be supplied"
 *   }
 * @apiErrorExample {json} 400 Bad Key Type
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "error": "invalid_type",
 *     "error_description": "key must be a number"
 *   }
 * @apiErrorExample {json} 401 Invalid Access Token
 *   HTTP/1.1 401 Unauthorized
 *   {
 *     "error": "invalid_credentials",
 *     "error_description": "authorization header or access token is invalid"
 *   }
 * @apiErrorExample {json} 400 Infinite Key
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "error": "invalid_request",
 *     "error_description": "key must be finite"
 *   }
 * @apiErrorExample {json} 404 Key Not Found
 *   HTTP/1.1 404 Not Found
 *   {
 *     "error": "key_not_found",
 *     "error_description": "key <key> not found"
 *   }
 *
 * @apiExample {shell} cURL
 * curl -X DELETE http://localhost:3000/queue/remove
 *      -H "Authorization: Bearer Yy3bxKIYIqzIsy6Oxv2W21"
 *      -d key=0
 * @apiExample {javascript} Axios
 * axios({
 *   url: 'http://localhost:3000/queue/remove',
 *   method: 'delete',
 *   headers: {
 *     'Authorization': 'Bearer Yy3bxKIYIqzIsy6Oxv2W21'
 *   },
 *   params: {
 *     key: 0
 *   }
 * });
 *
 * @apiVersion 0.1.1
 */
app.delete('/queue/remove', (serverRequest, serverResponse) => {
    let headers = serverRequest.headers;
    let params = serverRequest.query;
    let queue = authQueueAccess(headers['authorization']);

    if (!queue) {
        // bad credentials
        serverResponse.status(401).json({
            error: 'invalid_credentials',
            error_description: "authorization header or access token is invalid"
        });
    } else if (!params.key) {
        serverResponse.status(400).json({
            error: 'invalid_request',
            error_description: 'key must be supplied'
        });
    } else if (Number.isNaN(params.key = Number(params.key))) {
        serverResponse.status(400).json({
            error: 'invalid_type',
            error_description: 'key must be a number'
        });
    }

    if (serverResponse.finished) {
        return;
    }

    try {
        let removed = queue.getData().remove(params.key);

        if (!removed) {
            serverResponse.status(404).json({
                error: "key_not_found",
                error_description: `key ${params.key} not found`
            });
        } else {
            serverResponse.status(200).end();
        }
    } catch (queueErr) {
        if (queueErr instanceof RangeError) {
            serverResponse.status(400).json({
                error: 'invalid_request',
                error_description: humps.decamelize(queueErr.message)
            });
        }
    }
});
