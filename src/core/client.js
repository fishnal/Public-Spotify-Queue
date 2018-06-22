const request = require('request');
const opn = require('opn');
const SpotifyWebApi = require('spotify-web-api-node');
const startServer = require('./server.js');
const auth = require('./authorize.js');

/* make sure json server is running */
const songURL = 'http://localhost:3000/song_uris';
const hostURL = 'http://localhost:3000/host_access_token';
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectURI = 'http://127.0.0.1:3000/'

var song_uris;
var hostToken;
var hostApi = new SpotifyWebApi();

request(songURL, (err, res, body) => {
	if (err) throw err;

	song_uris = JSON.parse(body);

	request(hostURL, hostURLCallback);
});

function hostURLCallback(err, res, body) {
	if (err) throw err;

	hostToken = JSON.parse(body)[0];
	hostApi.setAccessToken(hostToken);

	syncClient();
}

function syncClient() {
	var api = auth(clientId, clientSecret, redirectURI,
		['user-read-private', 'playlist-read-private', 'playlist-read-collaborative',
			'user-read-currently-playing', 'user-modify-playback-state',
			'user-read-playback-state'],
		true);
	startServer(url => {
		/* get auth code */

		/* get auth code in order to get tokens;
		* first group will be the match basically,
		* second group is the code
		* third group is the state
		*/
		var match = url.match('\\/\\?code=(.*)&state=(.*)');

		/* issue occurred if we didn't match properly */
		if (match == null) {
			/* same idea as before, but code is now error */
			match = url.match('\\/\\?error=(.*)&state(.*)');
			console.log('There was an issue authorizing');
			throw new Error(match[1]);
		}

		/* get access and refresh tokens */
		api.authorizationCodeGrant(match[1], accessTokenCallback);
	});

	function accessTokenCallback(err, data) {
		if (err) throw err;

		api.setAccessToken(data.body['access_token']);
		api.setRefreshToken(data.body['refresh_token']);

		console.log(`token: ${data.body['access_token']}`);

		hostApi.getMyCurrentPlayingTrack(null, (err, data) => {
			if (err) throw err;

			/* retrieve song that's currently playing */
			// data.item -> track object
			// data.item.uri is used to offset
			api.play({
				uris: song_uris,
				offset: {
					uri: data.body.item.uri
				}
			}, (err, data2) => {
				if (err) throw err;

				var seekOptions = {
					uri: 'https://api.spotify.com/v1/me/player/seek?position_ms=' + data.body.progress_ms,
					method: 'PUT',
					headers: {
						'Authorization': 'Bearer ' + api.getAccessToken()
					}
				};

				request(seekOptions, (err, res, body) => {
					if (err) throw err;

					let sc = res.statusCode;

					if (sc == 204) {
						console.log("OK");
					} else if (sc == 202) {
						console.log("Device is unavailable");
					} else if (sc == 404) {
						console.log("Device not found");
					} else if (sc == 403) {
						console.log("You're not a premium user");
					}
				});
			});
		})
	}

	function playCallback(err, data) {
		if (err) throw err;

		let sc = data.statusCode;

		if (sc >= 400) {
			if (sc == 404) {
				console.log("Couldn't find the device");
			} else if (sc == 403) {
				console.log("You're not a premium user");
			}
		} else if (sc >= 200 || sc < 300) {
			if (sc == 202) {
				console.log("Device was unavailable");
			} else if (sc == 204) {
				console.log("Device should be playing host's song");
			}
		}

		var seekOptions = {
			uri: 'https://api.spotify.com/v1/me/player/seek?position_ms=',
			method: 'PUT',
			headers: {
				'Authorization': 'Bearer ' + api.getAccessToken()
			}
		};

		hostApi.getMyCurrentPlayingTrack(null, (err, data) => {
			if (err) throw err;

			seekOptions.uri += data.body.progress_ms;

			request(seekOptions, (err, res, body) => {
				let sc = res.statusCode;

				if (sc == 204) {
					console.log("OK");
				} else if (sc == 202) {
					console.log("Device is unavailable");
				} else if (sc == 404) {
					console.log("Device not found");
				} else if (sc == 403) {
					console.log("You're not a premium user");
				}
			});
		});
	}
}
