const URL = require('url').URL;
const fs = require('fs');
const express = require('express');
const request = require('request-promise-native').defaults({
	json: true,
	// if in debug mode, turn off timeout
	timeout: process.env.TEST ? null : 1000
});
require('should');
const mockServer = require('./mockserver.js');
const { isString } = require('../src/utils.js');

const data = JSON.parse(fs.readFileSync('test/mockserver.test.json'), (key, value) => {
	// evaluate environment client id and client secret strings
	if (isString(value)) {
		value = value.replace('process.env.CLIENT_ID', process.env.CLIENT_ID);
		value = value.replace('process.env.CLIENT_SECRET', process.env.CLIENT_SECRET);
	}

	if (key === 'Authorization' && isString(value)) {
		// parse authorization header into base64
		value = Buffer.from(value).toString('base64');
	} else if (key === 'scope' && isString(value)) {
		// sort scope fields (either from parameters or an expected data set) by splitting them into
		// an array, sorting them, and then joining them (delimited by spaces)
		// this lets us declare our scope fields in any valid proper, but when used in comparisons,
		// their alphabetical order is used
		value = value.split(' ').sort().join(' ');
	}

	return value;
});
const mockIp = process.env.TEST_SERVER.endsWith('/')
	? process.env.TEST_SERVER.substring(0, process.env.TEST_SERVER.length - 1)
	: process.env.TEST_SERVER;
const mockAddress = `${mockIp}:${process.env.TEST_PORT}`;

/**
 * Parses the hash fragments of a URL object.
 *
 * @param {URL} urlObj the url object
 * @returns {object} the hash fragments and their values
 */
function getHashParams(urlObj) {
	// https://code.i-harness.com/en/q/400cd7
	let hashParams = {};
	let e = null,
		a = /\+/g,  // Regex for replacing addition symbol with a space
		r = /([^&;=]+)=?([^&;]*)/g,
		d = (s) => decodeURIComponent(s.replace(a, " ")),
		q = urlObj.hash.substring(1);

	while ((e = r.exec(q)) != null) hashParams[d(e[1])] = d(e[2]);

	return hashParams;
}

/**
 * Gets the search parameters of a URL object and puts them into an object
 *
 * @param {URL} urlObj the url object
 * @returns {object} the search parameters and their values
 */
function getSearchParams(urlObj) {
	let searchParams = {};

	urlObj.searchParams.forEach((value, param) => {
		searchParams[param] = value;
	});

	return searchParams;
}

describe('Mock Server', function() {
	let tempHost = null;

	this.beforeAll(async function() {
		await mockServer.start();
		tempHost = await express().listen(3000);
	});

	describe('/authorize', function() {
		let testSet = data['authorize'];

		function authHandler(_test, resp) {
			resp.statusCode.should.equal(_test.expected.code);

			if (resp.statusCode >= 300 && resp.statusCode < 400) {
				// successful redirect

				let url = new URL(resp.response.headers.location);

				url.origin.should.equal(_test.expected.redirect_base);

				if (_test.expected.queries) {
					// expecting search parameters
					getSearchParams(url).should.deepEqual(_test.expected.queries);
				} else {
					// expecting hash fragments
					getHashParams(url).should.deepEqual(_test.expected.hashes);
				}
			} else {
				resp.error.should.equal(_test.expected.error);
			}
		}

		testSet.forEach(function(_test) {
			it(_test.title, async function() {
				if (_test.func && mockServer[_test.func.name]) {
					mockServer[_test.func.name](..._test.func.args);
				}

				try {
					authHandler(_test, await request({
						uri: `${mockAddress}/authorize`,
						qs: _test.args.queries,
						followRedirect: false
					}));
				} catch (requestErr) {
					authHandler(_test, requestErr);
				}
			});
		});

		this.afterAll(function() {
			mockServer.restoreDefaults();
		});
	});

	describe('/token', function() {
		function tokenHandler(_test, resp) {
			// should only get a status code if it wasn't 200
			if (resp.statusCode) {
				resp.statusCode.should.equal(_test.expected.code);
			}

			// prioritize the error message, otherwise the response object, for comparison
			(resp.error || resp).should.deepEqual(_test.expected.data);
		}

		let testSet = data['token'];

		testSet.forEach(function(_test) {
			it(_test.title, async function() {
				if (_test.func && mockServer[_test.func.name]) {
					mockServer[_test.func.name](..._test.func.args);
				}

				try {
					tokenHandler(_test, await request.post({
						uri: `${mockAddress}/token`,
						headers: _test.args.headers || {},
						qs: _test.args.queries || {}
					}));
				} catch (err) {
					tokenHandler(_test, err);
				}
			});
		});

		this.afterAll(function() {
			mockServer.restoreDefaults();
		});
	});

	this.afterAll(async function() {
		await tempHost.close();
		await mockServer.close();
	});
});
