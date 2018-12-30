const express = require('express');
const bodyParser = require('body-parser');
const { isNumber } = require('./../src/utils.js');

/**
 * Returns a generator for mocking auth codes or tokens.
 *
 * @param {number} start the starting value (default is 1)
 * @returns {IterableIterator<string>}
 */
function* generator(start = 1) {
    while (start < start + 1) {
        yield String(start++);
    }
}

const DEFAULTS = module.exports.DEFAULTS = Object.freeze({
    /**
     * Default access token expiration time.
     */
    accessTokenExpiration: 300000,
    /**
     * Default code expiration time.
     */
    codeExpiration: 300000
});

const RESPONSE_TYPES = [
    'code',
    'token'
];
const REDIRECT_URIS = [
    'http://localhost:3000',
    'http://testingurl:3000' // not an actual redict url, used to verify that mock server doesn't
                             // pass out a token when a code doesn't match it's redirect url passed in
];
const GRANT_TYPES = [
    'client_credentials',
    'authorization_code',
    'refresh_token'
];

// generates auth codes
let codeGen = generator();
// how long an authorization code is valid for (default is 300000ms or 5 minutes)
let codeExpiration = DEFAULTS.accessTokenExpiration;

// generates access tokens
let accessGen = generator();
// how long an access token is valid for (default is 300000ms or 5 minutes)
let accessTokenExpiration = DEFAULTS.codeExpiration;

// generates refresh tokens
let refreshGen = generator();
// refresh tokens don't need to be linked to a particular access token, instead they just create a
// new access token with the same scopes

/**
 * @typedef {Object} AuthCode holds a user's authentication data
 * @property {string} code the authorization code
 * @property {string} redirect_uri the redirect uri that was associated with the authorization
 * request
 * @property {string} scope the scopes associated with the authorization request
 * @property {boolean} expired whether or not the auth code has expired
 * @typedef {Object.<string, AuthCode>} AuthCodeMap a map of AuthCode objects
 *
 * @typedef {Object} AccessToken holds a user's access token data
 * @property {string} scope the scopes for this access token
 * @property {boolean} expired whether or not this access token has expired
 * @typedef {Object.<string, AccessToken>} AccessTokenMap a map of AccessToken objects
 *
 * @typedef {Object} RefreshToken holds a user's refresh token data
 * @property {string} scope the scopes for this refresh token
 * @typedef {Object.<string, RefreshToken>} RefreshTokenMap a map of RefreshToken objects
 */
/**
 * @type {AuthCodeMap}
 */
let authCodes = {};
/**
 * Map of access tokens present in this server
 * @type {AccessTokenMap}
 */
let accessTokens = {};
/**
 * Map of refresh tokens present in this server
 * @type {RefreshTokenMap}
 */
let refreshTokens = {};

/**
 * Map of timers, keyed by their symbol. Timers remove themselves from this map if they are
 * executed.
 */
let timers = {};

const AUTH_HEADER_BASIC = Buffer.from(`Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`)
    .toString('base64');
const mockApp = express();
let exportServer = null;

mockApp.use(bodyParser.urlencoded({ extended: true }));

/**
 * Restores the default settings of this server. Automatically called when server is closed.
 *
 * @returns {void}
 */
function restoreDefaults() {
    accessTokenExpiration = DEFAULTS.accessTokenExpiration;
    codeExpiration = DEFAULTS.codeExpiration
}

/**
 * Starts the mock server.
 *
 * @returns {Promise<void>} resolves after starting and performing startup post-startup operations,
 * rejects if an error is thrown.
 */
module.exports.start = () => {
    // TODO util.promsifiy?
    return new Promise((resolve, reject) => {
        try {
            exportServer = mockApp.listen(process.env.TEST_PORT, resolve);
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Stops the mock server, restoring default settings, clearing any timers, and deleting
 * authorization and token information.
 *
 * @returns {Promise<void>} resolves after closing and performing cleanup operations, rejects if an
 * error is thrown
 */
module.exports.close = () => {
    // TODO util.promsifiy?
    return new Promise((resolve, reject) => {
        try {
            exportServer.close(() => {
                // restore defaults
                restoreDefaults();

                // clear timers
                Object.getOwnPropertySymbols(timers).forEach((symbol) => {
                    clearTimeout(timers[symbol]);
                });

                // reset auth, token, and timer data
                authCodes = {};
                accessTokens = {};
                refreshTokens = {};
                timers = {};

                // reset generators
                codeGen = generator();
                accessGen = generator();
                refreshGen = generator();

                resolve();
            });
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Sets the code expiration time in seconds.
 *
 * @param {number} newTime the new code expiration time (in seconds)
 * @returns {void}
 */
module.exports.setCodeExpiration = (newTime) => {
    if (!isNumber(newTime)) {
        throw new TypeError('newTime must be a number');
    }

    codeExpiration = newTime;
}

/**
 * Sets the access token expiration time in seconds.
 *
 * @param {number} newTime the new access token expiration time (in seconds)
 * @returns {void}
 */
module.exports.setAccessTokenExpiration = (newTime) => {
    if (!isNumber(newTime)) {
        throw new TypeError('newTime must be a number');
    }

    accessTokenExpiration = newTime;
}

/**
 * Restores the default settings for the server. The defaults can be viewed via the
 * `DEFAULTS` export.
 *
 * @returns {void}
 */
module.exports.restoreDefaults = restoreDefaults;

// auth codes have an expiration time, but do not invalidate each other
// access tokens have an expiration time, but do not invalidate each other
// an access token is deleted if it is refreshed
mockApp.get('/authorize', (mockRequest, mockResponse) => {
    let queries = mockRequest.query || {};

    if (queries.client_id !== process.env.CLIENT_ID) {
        // not the client id we were expecting
        mockResponse.status(400).send('INVALID_CLIENT: Invalid client');
    } else if (!RESPONSE_TYPES.includes(queries.response_type)) {
        // incorrect response type
        mockResponse.status(400).send('response_type must be code or token');
    } else if (!REDIRECT_URIS.includes(queries.redirect_uri)) {
        // not the redirect uri we were expecting
        mockResponse.status(400).send('INVALID_CLIENT: Invalid redirect URI');
    }

    if (mockResponse.finished) {
        return;
    }

    // get redirect uri
    let redirectLink = queries.redirect_uri;
    // encode the state query if we have one
    let state = queries.state ? encodeURIComponent(queries.state) : null;

    // get rid of the slash at the end of the redirect link if present
    if (redirectLink.endsWith('/')) {
        redirectLink = redirectLink.substring(0, redirectLink.length - 1);
    }

    if (queries.scope) {
        queries.scope = queries.scope.split(' ').sort().join(' ');
    }

    if (queries.response_type === 'token') {
        // generate token data
        let accessToken = accessGen.next().value;
        // store this data onto mock server
        accessTokens[accessToken] = {
            expired: false,
            scope: queries.scope || ""
        };

        // set expiration timer on access token
        let timer = setTimeout(() => {
            accessTokens[accessToken].expired = true
        }, accessTokenExpiration);
        // put timer into map
        timers[Symbol(timer)] = timer;

        // encode access token
        accessToken = encodeURIComponent(accessToken);
        // append data hash frags to redirect link
        redirectLink += `/#access_token=${accessToken}&token_type=Bearer` +
            `&expires_in=${accessTokenExpiration / 1000}`;
    } else {
        // response type is code, generate next code
        let authCode = codeGen.next().value;
        // init data for the auth code object
        let authCodeData = authCodes[authCode] = {
            redirect_uri: queries.redirect_uri,
            scope: queries.scope || "",
            expired: false
        };

        // make sure the auth code expires after some time
        let timer = setTimeout(() => {
            authCodeData.expired = true;
        }, codeExpiration);
        // put timer into map
        timers[Symbol(timer)] = timer;

        // encode the code field properly
        authCode = encodeURIComponent(authCode);
        // add code query parameter
        redirectLink += `/?code=${authCode}`;
    }

    // only add the state to query parameter if we were passed one
    if (state) {
        redirectLink += `&state=${state}`;
    }

    // finally redirect
    mockResponse.status(200).redirect(redirectLink);
});

mockApp.post('/token', (mockRequest, mockResponse) => {
    let queries = mockRequest.query || {};
    let headers = mockRequest.headers || {};
    // if body.code is null/undefined, authCodes[body.code] may return a non-null object (i guess
    // the user's name could be 'null' or 'undefined'); in this case, before checking if the auth
    // code is valid, we check if body.code is null and raise errors respectively; in doing this,
    // we eliminate the possibility of treating the auth data of a user whose name is
    // null'/'undefined' as an actual null/undefined object
    let authData = authCodes[queries.code];
    // get refresh data, in case grant is refresh token (not a problem if that's not the grant type
    // though)
    let refreshData = refreshTokens[queries.refresh_token];

    // verify headers, then body query
    if (headers['authorization'] !== AUTH_HEADER_BASIC
            && Buffer.from(`Basic ${queries.client_id}:${queries.client_secret}`)
                .toString('base64') !== AUTH_HEADER_BASIC) {
        // invalid client if headers don't exist or the Authorization header isn't correct
        mockResponse.status(400).json({
            error: 'invalid_client'
        });
    } else if (headers['content-type'] !== 'application/x-www-form-urlencoded') {
        // incorrect Content-Type header
        mockResponse.status(415).json({
            error: 'invalid_content_type',
            error_description: 'Content-Type must be application/x-www-form-urlencoded'
        });
    } else if (!GRANT_TYPES.includes(queries.grant_type)) {
        // no body parameters or invalid grant_type
        mockResponse.status(400).json({
            error: 'unsupported_grant_type',
            error_description: 'grant_type must be client_credentials, authorization_code or ' +
                'refresh_token'
        });
    } else if (queries.grant_type === 'authorization_code') {
        // error checking authorization code grant type
        if (queries.code == null) {
            // need a 'code' query
            mockResponse.status(400).json({
                error: 'invalid_request',
                error_description: 'code must be supplied'
            });
        } else if (!authData) {
            // this code wasn't generated
            mockResponse.status(400).json({
                error: 'invalid_grant',
                error_description: 'Invalid authorization code'
            });
        } else if (authData.expired) {
            // the code has expired
            mockResponse.status(400).json({
                error: 'invalid_grant',
                error_description: 'Authorization code expired'
            });
        } else if (authData.redirect_uri !== queries.redirect_uri) {
            // mismatching redirect uris
            mockResponse.status(400).json({
                error: 'invalid_grant',
                error_description: 'Invalid redirect URI'
            });
        }
    } else if (queries.grant_type === 'refresh_token') {
        // error checking refresh token grant type
        if (!queries.refresh_token) {
            // no refresh token
            mockResponse.status(400).json({
                error: 'invalid_request',
                error_description: 'refresh_token must be supplied'
            });
        } else if (!refreshData) {
            // refresh token doesn't exist yet
            mockResponse.status(400).json({
                error: 'invalid_grant',
                error_description: 'Invalid refresh token'
            });
        }
    }

    if (mockResponse.finished) {
        return;
    }

    // passed error checks
    let tokenData = {};

    // store in general token information
    tokenData.access_token = accessGen.next().value;
    tokenData.token_type = 'Bearer';
    tokenData.expires_in = accessTokenExpiration / 1000;
    // scope property can be overridden below to fit other grant types
    tokenData.scope = "";

    if (queries.grant_type === 'authorization_code') {
        // generate refresh token
        tokenData.refresh_token = refreshGen.next().value;
        // scope is same from auth data
        tokenData.scope = authData.scope;
    } else if (queries.grant_type === 'refresh_token') {
        // scope is the same from this refresh token
        tokenData.scope = refreshData.scope;

        // generate new refresh token if the number of access tokens is divisible by 10
        // (don't care if they are expired)
        if ((Object.keys(accessTokens).length + 1) % 10 === 0) {
            // the plus 1 is to account for the new access token generated, which hasn't been
            // stored into the map yet

            // delete current refresh token, send new one back
            delete refreshTokens[queries.refresh_token];
            // adding this to refresh token map later
            tokenData.refresh_token = refreshGen.next().value;
        }
    }

    // store access token data
    accessTokens[tokenData.access_token] = { expired: false, scope: tokenData.scope }

    // set up expiration timer for access token
    let timer = setTimeout(() => {
        accessTokens[tokenData.access_token].expired = true
    }, accessTokenExpiration);
    // put timer into map
    timers[Symbol(timer)] = timer;

    // if we added a refresh token from one of those conditional branches, then store it onto
    // the refresh token map
    if (tokenData.refresh_token) {
        refreshTokens[tokenData.refresh_token] = { scope: tokenData.scope };
    }

    // send token data back
    mockResponse.status(200).json(tokenData);
});

mockApp.get('/api/me', (mockRequest, mockResponse) => {
    let queries = mockRequest.query || {};
    let headers = mockRequest.headers || {};

    let authHeaderMatch = /^Bearer (?<access_token>\S+)$/.exec(headers['authorization']);

    if (!authHeaderMatch) {
        mockResponse.status(400).json({
            error: {
                status: 400,
                message: 'Only valid bearer authentication supported'
            }
        });
    } else if (!accessTokens[authHeaderMatch.groups['access_token']]) {
        mockResponse.status(401).json({
            error: {
                status: 401,
                message: 'Invalid access token'
            }
        });
    }

    if (mockResponse.finished) {
        return;
    }

    mockResponse.status(200).json({ id: 'fishnal' });
});

mockApp.get('/api/tracks', (mockRequest, mockResponse) => {
    let queries = mockRequest.query || {};
    let headers = mockRequest.headers || {};

    let authHeaderMatch = /^Bearer (?<access_token>\S+)$/.exec(headers['authorization']);

    if (!authHeaderMatch) {
        mockResponse.status(400).json({
            error: {
                status: 400,
                message: 'Only valid bearer authentication supported'
            }
        });
    } else if (!accessTokens[authHeaderMatch.groups['access_token']]) {
        mockResponse.status(401).json({
            error: {
                status: 401,
                message: 'Invalid access token'
            }
        });
    } else if (!queries['ids']) {
        mockResponse.status(400).json({
            error: {
                status: 400,
                message: 'invalid id'
            }
        });
    }

    if (mockResponse.finished) {
        return;
    }

    let ids = queries['ids'].split(',');
    let resp = { tracks: [] };

    ids.forEach((id) => {
        if (/^song_id_\d+$/.exec(id)) {
            // matched the id, so let's say this has some data
            resp.tracks.push({ id });
        } else {
            resp.tracks.push(null);
        }
    });

    mockResponse.status(200).json(resp);
});
