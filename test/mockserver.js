const debug = require('debug')('psq:mockserver');
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
	'http://127.0.0.1:3000/',
	'http://127.0.0.1:3000',
	'http://localhost:3000/',
	'http://localhost:3000'
];
const GRANT_TYPES = [
	'client_credentials',
	'authorization_code',
	'refresh_token'
];

// generates auth codes
const codeGen = generator();
// how long an authorization code is valid for (default is 300000ms or 5 minutes)
let codeExpiration = DEFAULTS.accessTokenExpiration;

// generates access tokens
const accessGen = generator();
// how long an access token is valid for (default is 300000ms or 5 minutes)
let accessTokenExpiration = DEFAULTS.codeExpiration;

// generates refresh tokens
const refreshGen = generator();
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
 * @callback VoidCallback a callback that sends 0 arguments and returns undefined.
 * @returns {void}
 */

/**
 * Starts the mock server.
 *
 * @param {VoidCallback} callback callback function executed after server has started and performed
 * other internal operations, if any.
 * @returns {void}
 */
module.exports.start = (callback) => {
	exportServer = mockApp.listen(process.env.TEST_PORT, function() {
		debug(`started on port ${process.env.TEST_PORT}`);

		if (callback) {
			debug(`calling back`);
			callback();
		} else {
			debug(`no callback provided`);
		}
	});
};

/**
 * Stops the mock server, restoring default settings, clearing any timers, and deleting authorization
 * and token information.
 *
 * @param {VoidCallback} callback callback function executed after server has closed and performed
 * other internal operations, if any.
 * @returns {void}
 */
module.exports.close = (callback) => {
	if (!exportServer) {
		debug(`server isn't up`);
		throw new Error("server hasn't started");
	} else {
		debug(`closing`);
		exportServer.close(function() {
			debug(`closed`);
			// restore defaults
			debug(`restoring defaults`);
			restoreDefaults();

			// clear timers
			debug(`clearing timers`);
			Object.getOwnPropertySymbols(timers).forEach((symbol) => {
				clearTimeout(timers[symbol]);
			});

			debug(`deleting authorization token data`);
			authCodes = accessTokens = refreshTokens = timers = {};

			if (callback) {
				debug(`calling back`);
				callback();
			} else {
				debug(`no callback provided`);
			}
		});
	}
}

/**
 * Sets the code expiration time in seconds.
 *
 * @param {number} newTime the new code expiration time (in seconds)
 * @returns {void}
 */
module.exports.setCodeExpiration = (newTime) => {
	if (!isNumber(newTime)) {
		debug('#setCodeExpiration was passed a non-number');
		throw new TypeError('newTime must be a number');
	}

	debug(`#setCodeExpiration setting new time to ${newTime}`);
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
		debug('#setAccessTokenExpiration was passed a non-number');
		throw new TypeError('newTime must be a number');
	}

	debug(`#setAccessTokenExpiration setting new time to ${newTime}`);
	accessTokenExpiration = newTime;
}

/**
 * Restores the default settings for the server. The defaults can be viewed via the
 * `DEFAULTS` export.
 *
 * @returns {void}
 */
module.exports.restoreDefaults = restoreDefaults;

// TODO access tokens should be formatted like "[user][genCode]" ?

// user can have multiple auth codes, each one associated with different instances of tokens
// auth codes have an expiration time, but do not invalidate each other
// access tokens have an expiration time, but do not invalidate each other
// an access token is deleted if it is refreshed
// both auth codes and access tokens are invalid if and only if an instance of the code/token
//		is not found in the user's data
mockApp.get('/authorize', (mockRequest, mockResponse) => {
	let queries = mockRequest.query;

	if (!queries || queries.client_id !== process.env.CLIENT_ID) {
		// not the client id we were expecting
		debug(`bad client: ${queries}`);
		mockResponse.status(400).send('INVALID_CLIENT: Invalid client');
	} else if (!RESPONSE_TYPES.includes(queries.response_type)) {
		// incorrect response type
		debug(`bad response type: ${queries}`);
		mockResponse.status(400).send('response_type must be code or token');
	} else if (!REDIRECT_URIS.includes(queries.redirect_uri)) {
		// not the redirect uri we were expecting
		debug(`bad redirect uri: ${queries}`);
		mockResponse.status(400).send('INVALID_CLIENT: Invalid redirect URI');
	} else if (!queries.user) {
		// this spotify endpoint doesn't actually need a 'user' query, but we need it for testing
		// purposes; so it makes it easier to check we actually have this query
		debug(`no user: ${queries}`);
		mockResponse.status(400).send('INVALID_USER: user must be supplied');
	} else {
		// get redirect uri
		let redirectLink = queries.redirect_uri;
		// encode the state query if we have one
		let state = queries.state ? encodeURIComponent(queries.state) : null;

		// get rid of the slash at the end of the redirect link if present
		if (redirectLink.endsWith('/')) {
			debug('removing end slash in redirect uri');
			redirectLink = redirectLink.substring(0, redirectLink.length - 1);
		}

		if (queries.response_type === 'token') {
			// generate token data
			debug('generating access token data');
			let accessToken = accessGen.next().value;
			debug(`access token generated "${accessToken}" with scopes "${queries.scope || ''}"`);
			// store this data onto mock server
			accessTokens[accessToken] = {
				expired: false,
				scope: queries.scope || ""
			};

			// set expiration timer on access token
			debug(`setting ${accessTokenExpiration}ms timer for "${accessToken}"`);
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
			debug('generating auth code');
			let authCode = codeGen.next().value;
			debug(`generated auth code "${authCode} with redirect uri "${queries.redirect_uri}" `
				+ `and scopes "${queries.scope || ''}"`);
			// init data for the auth code object
			let authCodeData = authCodes[authCode] = {
				redirect_uri: queries.redirect_uri,
				scope: queries.scope ? queries.scope : "",
				expired: false
			};

			debug(`setting ${codeExpiration}ms timer for "${authCode}"`);
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
			debug('appending state to redirect link');
			redirectLink += `&state=${state}`;
		}

		// finally redirect
		debug(`redirect to "${redirectLink}"`);
		mockResponse.status(200).redirect(redirectLink);
	}
});

mockApp.get('/token', (mockRequest, mockResponse) => {
	let queries = mockRequest.query;
	let headers = mockRequest.headers;
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
	if (!headers || headers['authorization'] !== Buffer.from(`Basic ${process.env.CLIENT_ID}` +
		`:${process.env.CLIENT_SECRET}`).toString('base64')) {
		// invalid client if headers don't exist or the Authorization header isn't correct
		debug(`bad authorization header: ${headers}`);
		mockResponse.status(400).json({
			error: 'invalid_client'
		});
	} else if (headers['content-type'] !== 'application/x-www-form-urlencoded') {
		// incorrect Content-Type header
		debug(`bad content-type header: ${headers}`);
		mockResponse.status(415).json({
			error: 'invalid_content_type',
			error_description: 'Content-Type must be application/x-www-form-urlencoded'
		});
	} else if (!queries || !GRANT_TYPES.includes(queries.grant_type)) {
		// no body parameters or invalid grant_type
		debug(`bad grant type: ${queries}`);
		mockResponse.status(400).json({
			error: 'unsupported_grant_type',
			error_description: 'grant_type must be client_credentials, authorization_code or ' +
				'refresh_token'
		});
	} else if (queries.grant_type === 'authorization_code') {
		// error checking authorization code grant type
		if (queries.code == null) {
			// need a 'code' query
			debug(`no auth code: ${queries}`);
			mockResponse.status(400).json({
				error: 'invalid_request',
				error_description: 'code must be supplied'
			});
		} else if (!authData) {
			// this code wasn't generated
			debug(`bad auth code: ${queries}`);
			mockResponse.status(400).json({
				error: 'invalid_grant',
				error_description: 'Invalid authorization code'
			});
		} else if (authData.expired) {
			// the code has expired
			debug(`expired auth code: ${queries}`);
			mockResponse.status(400).json({
				error: 'invalid_grant',
				error_description: 'Authorization code expired'
			});
		} else if (authData.redirect_uri !== queries.redirect_uri) {
			// mismatching redirect uris
			debug(`bad redirect uri: ${queries}`);
			mockResponse.status(400).json({
				error: 'invalid_grant',
				error_description: 'Invalid redirect URI'
			});
		}
	} else if (queries.grant_type === 'refresh_token') {
		// error checking refresh token grant type
		if (!queries.refresh_token) {
			// no refresh token
			debug(`no refresh token: ${queries}`);
			mockResponse.status(400).json({
				error: 'invalid_request',
				error_description: 'refresh_token must be supplied'
			});
		} else if (!refreshData) {
			// refresh token doesn't exist yet
			debug(`bad refresh token: ${queries}`);
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
	debug('generating general token data');
	tokenData.access_token = accessGen.next().value;
	tokenData.token_type = 'Bearer';
	tokenData.expires_in = accessTokenExpiration / 1000;
	debug(`generated access token "${tokenData.access_token}", expiring in `
		+ `${tokenData.expires_in}secs`);
	// scope property can be overridden below to fit other grant types
	tokenData.scope = "";

	if (queries.grant_type === 'authorization_code') {
		// generate refresh token
		debug(`generate refresh token`);
		tokenData.refresh_token = refreshGen.next().value;
		debug(`generated refresh token "${tokenData.refresh_token}" with scopes `
			+ `"${authData.scope}"`);
		// scope is same from auth data
		tokenData.scope = authData.scope;
	} else if (queries.grant_type === 'refresh_token') {
		debug(`refreshing a token`);
		// scope is the same from this refresh token
		tokenData.scope = refreshData.scope;

		// generate new refresh token if the number of access tokens is divisible by 10
		// (don't care if they are expired)
		if ((Object.keys(accessTokens).length + 1) % 10 === 0) {
			// the plus 1 is to account for the new access token generated, which hasn't been
			// stored into the map yet

			debug(`generating new refresh token to replace "${queries.refresh_token}"`);
			// delete current refresh token, send new one back
			delete refreshTokens[queries.refresh_token];
			// adding this to refresh token map later
			tokenData.refresh_token = refreshGen.next().value;
			debug(`new refresh token "${tokenData.refresh_token}"`);
		}
	}

	// store access token data
	accessTokens[tokenData.access_token] = { expired: false, scope: tokenData.scope }

	// set up expiration timer for access token
	debug(`setting ${accessTokenExpiration}ms timer for "${tokenData.access_token}"`);
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

	debug(`sending ${tokenData} back`);
	// send token data back
	mockResponse.status(200).json(tokenData).end();
});
