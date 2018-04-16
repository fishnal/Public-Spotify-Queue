import request from 'request'
import opn from 'opn'
import { SpotifyWebApi } from '../spotify-web-api-node/spotify-web-api'
import http from 'http'
import { startServer } from './server'
import { auth } from './authorize'

/* make sure json server is running */
const songURL: string = 'http://localhost:3000/song_uris';
const hostURL: string = 'http://localhost:3000/host_access_token';
const clientId: string = 'acd0f18a3e124101af31f9b3582130c6';
const clientSecret: string = '276a4580f7e94dd1a20f5d797b95dbba';
const redirectURI: string = 'http://127.0.0.1:8080/'

let song_uris;
let hostToken: string;
let hostApi: SpotifyWebApi = new SpotifyWebApi();

request(songURL, (err: any, res: request.Response, body: any): void => {
	if (err) throw err;

	song_uris = JSON.parse(body);

	request(hostURL, hostURLCallback);
});

function hostURLCallback(err: any, res: request.Response, body: any): void {
	if (err) throw err;

	hostToken = JSON.parse(body)[0];
	hostApi.setAccessToken(hostToken);

	syncClient();
}

function syncClient(): void {
	let api: SpotifyWebApi = auth(clientId, clientSecret, redirectURI, 
		['user-read-private', 'playlist-read-private', 'playlist-read-collaborative',
			'user-read-currently-playing', 'user-modify-playback-state', 
			'user-read-playback-state'],
		true);
	startServer((url: string) => {
		/* get auth code */
		
		/* get auth code in order to get tokens;
		* first group will be the match basically,
		* second group is the code
		* third group is the state
		*/
		let match: RegExpMatchArray = url.match('\\/\\?code=(.*)&state=(.*)');
		
		/* issue occurred if we didn't match properly */
		if (!match) {
			/* same idea as before, but code is now error */
			match = url.match('\\/\\?error=(.*)&state(.*)');
			console.log('There was an issue authorizing');
			throw new Error(match[1]);
		}

		/* get access and refresh tokens */
		api.authorizationCodeGrant(match[1], accessTokenCallback);
	});

	function accessTokenCallback(err: any, data): void {
		if (err) throw err;

		api.setAccessToken(data.body['access_token']);
		api.setRefreshToken(data.body['refresh_token']);
		
		console.log(`token: ${data.body['access_token']}`);

		hostApi.getMyCurrentPlayingTrack(null, (err: any, data) => {
			if (err) throw err;

			/* retrieve song that's currently playing */
			// data.item -> track object
			// data.item.uri is used to offset
			api.play({ 
				uris: song_uris,
				offset: {
					uri: data.body.item.uri
				}
			}, (err2: any, data2) => {
				if (err2) throw err2;

				let seekOptions = {
					uri: 'https://api.spotify.com/v1/me/player/seek?position_ms=' + data.body.progress_ms,
					method: 'PUT',
					headers: {
						'Authorization': 'Bearer ' + api.getAccessToken()
					}
				};

				request(seekOptions, (err: any, res, body) => {
					if (err) throw err;

					let sc: number = res.statusCode;

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

	function playCallback(err: any, data) {
		if (err) throw err;

		let sc: number = data.statusCode;

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

		let seekOptions = {
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