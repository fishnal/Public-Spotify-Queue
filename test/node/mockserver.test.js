const URL = require('url').URL;
const express = require('express');
const request = require('request-promise-native').defaults({
  json: true,
  // if in debug mode, turn off timeout
  timeout: process.env.TEST ? null : 1000
});
require('should');
const mockServer = require('./mockserver.js');
const { isString } = require('../../src/node/utils.js');
const data = require('./mockserver.test.data.js');

const mockIp = process.env.TEST_SERVER.endsWith('/')
  ? process.env.TEST_SERVER.substring(0, process.env.TEST_SERVER.length - 1)
  : process.env.TEST_SERVER;
const mockAddress = `${mockIp}:${process.env.TEST_PORT}`;

// sort the "scope" query parameter, if present, in all tests
Object.keys(data).forEach((testKey) => {
  data[testKey].forEach((_test) => {
    /**
     * Sorts the scope property for the given object.
     * @param {Object} obj object to modify.
     * @returns {void}
     */
    function sortScope(obj) {
      let scope = obj.scope;
      scope = scope.split(' ').sort().join(' ');
      obj.scope = scope;
    }

    if (_test.args.queries && isString(_test.args.queries.scope)) {
      sortScope(_test.args.queries);
    }

    if (_test.expected && _test.expected.data && isString(_test.expected.data.scope)) {
      sortScope(_test.expected.data);
    }
  });
});

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

  this.beforeAll(async() => {
    await mockServer.start();
    tempHost = await express().listen(3000);
  });

  describe('/authorize', function() {
    let testSet = data['authorize'];

    /**
     * Handles assertions for the /authorize endpoint
     * @param {Object} _test Test object to act and assert.
     * @param {Object} resp actual response from server.
     * @returns {void}
     */
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

    testSet.forEach((_test) => {
      it(_test.title, async() => {
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

    this.afterAll(() => {
      mockServer.restoreDefaults();
    });
  });

  describe('/token', function() {
    /**
     * Handles assertions for the /token endpoint
     * @param {Object} _test Test object to act and assert.
     * @param {Object} resp actual response from server.
     * @returns {void}
     */
    function tokenHandler(_test, resp) {
      // should only get a status code if it wasn't 200
      if (resp.statusCode) {
        resp.statusCode.should.equal(_test.expected.code);
      }

      // prioritize the error message, otherwise the response object, for comparison
      (resp.error || resp).should.deepEqual(_test.expected.data);
    }

    let testSet = data['token'];

    testSet.forEach((_test) => {
      it(_test.title, async() => {
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

    this.afterAll(() => {
      mockServer.restoreDefaults();
    });
  });

  this.afterAll(async() => {
    await tempHost.close();
    await mockServer.close();
  });
});
