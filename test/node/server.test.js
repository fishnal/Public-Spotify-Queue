const request = require('request-promise-native').defaults({
  json: true,
  // if in debug mode, turn off timeout, otherwise keep it to 2 seconds
  timeout: process.env.TEST ? null : 2000
});
const should = require('should');
const hostServer = require('../../src/node/server.js');
const mockServer = require('./mockserver.js');
const { isString } = require('../../src/node/utils.js');
const data = require('./server.test.data.js');

const hostAddress = 'http://localhost';
const hostPort = process.env.PORT || 3000;
const hostURL = `${hostAddress}:${hostPort}`;
const mockAddress = process.env.TEST_SERVER.endsWith('/')
  ? process.env.TEST_SERVER.substring(0, process.env.TEST_SERVER.length - 1)
  : process.env.TEST_SERVER;
const mockURL = `${mockAddress}:${process.env.TEST_PORT}`;
const mainScopes = [
  "streaming",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-read-birthdate",
  "user-read-email",
  "user-read-private"
].sort(); // sorting list for comparisons

// sorting scope query parameters
Object.keys(data).forEach((testKey) => {
  function testLooper(_test) {
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
  }

  // some keys aren't arrays, but instead include more test sets
  if (data[testKey] instanceof Array) {
    data[testKey].forEach(testLooper);
  } else {
    Object.keys(data[testKey]).forEach((subKey) => {
      data[testKey][subKey].forEach(testLooper);
    });
  }
});

describe('Host Server', async function() {
  // used for faking the current date in ms
  let dateNowImpl = null;
  let fakeDateNow = 1;

  // before we start any tests, have mock server generate an auth code
  this.beforeAll(async() => {
    // save proper implementation of Date.now()
    dateNowImpl = Date.now;
    // override it now so we make it more stable and predictable for testing
    Date.now = () => fakeDateNow++;

    // start up the host and mock servers
    await hostServer.start({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      port: hostPort,
      address: hostAddress
    });
    await mockServer.start();

    // after servers start, generate a 1ms auth code on the mock server
    mockServer.setCodeExpiration(1);
    await request({
      uri: `${mockURL}/authorize`,
      qs: {
        client_id: process.env.CLIENT_ID,
        redirect_uri: hostServer.getRedirectURI(),
        response_type: 'code',
        scope: ''
      }
    });

    // then generate a 300000ms (5m) auth code
    mockServer.restoreDefaults();
    await request({
      uri: `${mockURL}/authorize`,
      qs: {
        client_id: process.env.CLIENT_ID,
        redirect_uri: hostServer.getRedirectURI(),
        response_type: 'code',
        scope: mainScopes.join(' ')
      }
    });
  });

  describe('/{root}', () => {
    data['{root}'].forEach((_test) => {
      it(_test.title, async() => {
        let resp = await request(`${hostURL}/`);
        resp.should.equal(_test.expected.data);
      });
    });
  });

  describe('/index.html', () => {
    data['index.html'].forEach((_test) => {
      it(_test.title, async() => {
        let resp = await request(`${hostURL}/index.html`);
        resp.should.equal(_test.expected.data);
      });
    });
  });

  function handleRequest(_test, resp) {
    if (!resp) {
      // resp may be undefined if the server chooses not to send any data, in which case,
      // the test's expected data should be null as well
      should.equal(_test.expected.data, resp);
    } else {
      // should only get a status code if it's not 200
      if (resp.statusCode) {
        resp.statusCode.should.equal(_test.expected.code);
      }

      (resp.error || resp).should.deepEqual(_test.expected.data);
    }
  }

  describe('/api/token', () => {
    data['token'].forEach((_test) => {
      it(_test.title, async() => {
        try {
          handleRequest(_test, await request({
            uri: `${hostURL}/api/token`,
            qs: _test.args.queries || {}
          }));
        } catch (err) {
          handleRequest(_test, err);
        }
      });
    });
  });

  describe('/api/refresh', () => {
    data['refresh'].forEach((_test) => {
      it(_test.title, async() => {
        try {
          handleRequest(_test, await request.post({
            uri: `${hostURL}/api/refresh`,
            qs: _test.args.queries || {}
          }));
        } catch (err) {
          handleRequest(_test, err);
        }
      });
    });
  });

  describe('/api/client_credentials', () => {
    data['client_credentials'].forEach((_test) => {
      it(_test.title, async() => {
        try {
          handleRequest(_test, await request(`${hostURL}/api/client_credentials`));
        } catch (err) {
          handleRequest(_test, err);
        }
      });
    });
  });

  describe('/api/queue', () => {
    let queueTests = data['queue'];
    let specialTests = {};

    async function avgError(_test) {
      function testLocalRequest() {
        return request.post({
          uri: `${hostURL}/api/queue/add_after`,
          headers: _test.args.headers || {},
          qs: { relative_key: 2, new_song_id: 'foobar' }
        });
      }

      let randomImpl = Math.random;

      // prevent promotions
      Math.random = () => 0;

      // insert between key 2 and it's next element
      try {
        for (let i = 0; i < 52; i++) {
          await testLocalRequest();
        }

        should.fail(true, false, "didn't throw an error");
      } catch (respErr) {
        // check error
        respErr.constructor.name.should.equal('StatusCodeError');
        respErr.statusCode.should.equal(_test.expected.code);
        respErr.error.should.deepEqual(_test.expected.data);
      } finally {
        // restore random
        Math.random = randomImpl;
      }
    }

    async function unsafeIntError(_test) {
      let isSafeIntegerImpl = Number.isSafeInteger;
      let randomImpl = Math.random;

      function testLocalRequest() {
        return request.post({
          uri: `${hostURL}/api/queue/add_after`,
          headers: _test.args.headers || {},
          qs: { relative_key: "null", new_song_id: 'foobar' }
        });
      }

      // need to be careful modifying Number.isSafeInteger because node request uses it
      Number.isSafeInteger = (number, fromTest) => {
        if (fromTest) {
          return Math.abs(number) <= 10;
        }

        return isSafeIntegerImpl(number);
      };
      Math.random = () => 0;

      try {
        for (let i = 0; i < 11; i++) {
          await testLocalRequest();
        }

        should.fail(true, false, "didn't throw an error");
      } catch (respErr) {
        respErr.constructor.name.should.equal('StatusCodeError');
        respErr.statusCode.should.equal(_test.expected.code);
        respErr.error.should.deepEqual(_test.expected.data);
      } finally {
        // restore implementations
        Math.random = randomImpl;
        Number.isSafeInteger = isSafeIntegerImpl;
      }
    }

    specialTests['/api/queue/add_after/average_error'] = avgError;
    specialTests['/api/queue/add_after/unsafe_integer_error'] = unsafeIntError;

    function promisify(fn, ...args) {
      return new Promise((resolve, reject) => {
        try {
          resolve(fn(...args));
        } catch (err) {
          reject(err);
        }
      });
    }

    describe('/api/add_after', () => {
      queueTests['add_after'].forEach((_test) => {
        it(_test.title, async() => {
          if (_test.test_id) {
            await promisify(specialTests[_test.test_id], _test);
            return;
          }

          async function queueAddAfterRequest(_test) {
            try {
              handleRequest(_test, await request.post({
                uri: `${hostURL}/api/queue/add_after`,
                headers: _test.args.headers || {},
                qs: _test.args.queries || {}
              }));
            } catch (err) {
              handleRequest(_test, err);
            }
          }

          if (_test.args.queries instanceof Array) {
            let tmp_test = {
              title: _test.title,
              args: {
                headers: _test.args.headers
              },
              expected: {
                code: _test.expected.code
              }
            };

            for (let i in _test.args.queries) {
              tmp_test.args.queries = _test.args.queries[i];
              tmp_test.expected.data = _test.expected.data[i];

              await promisify(queueAddAfterRequest, tmp_test);
            }
          } else {
            await promisify(queueAddAfterRequest, _test);
          }
        });
      });
    });

    describe('/api/remove', () => {
      queueTests['remove'].forEach((_test) => {
        it(_test.title, async() => {
          try {
            handleRequest(_test, await request.delete({
              uri: `${hostURL}/api/queue/remove`,
              headers: _test.args.headers || {},
              qs: _test.args.queries || {}
            }));
          } catch (err) {
            handleRequest(_test, err);
          }
        });
      });
    });
  });

  this.afterAll(async() => {
    Date.now = dateNowImpl;

    await mockServer.close();
    await hostServer.close();
  });
});
