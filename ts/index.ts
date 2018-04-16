/* handles main executions and statements */

import { SpotifyWebApi } from '../spotify-web-api-node/spotify-web-api'
import { auth } from './authorize'
import { Generator } from './generator'
import { startServer } from './server'
import prompt_sync from 'prompt-sync';
import superagent from 'superagent'

const clientId: string = 'acd0f18a3e124101af31f9b3582130c6';
const clientSecret: string = '276a4580f7e94dd1a20f5d797b95dbba';
const redirectURI : string = 'http://127.0.0.1:8080/';
let api: SpotifyWebApi = auth(clientId, clientSecret, redirectURI, 
	['user-read-private', 'playlist-read-private', 'playlist-read-collaborative',
		'user-read-currently-playing', 'user-modify-playback-state', 
		'user-read-playback-state'],
	true);
/* refreshInterval serves to refresh our access token based on when the most recent access token expires */
let refreshTimer = null;
/* used to generate queue */
let generator: Generator;

/* start our local server, after having opened up our authorization url; 
 * the local server will basically start up as soon sa the auth url is opened
 */
startServer((url: string) => {
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

function refresher(timeout: number) {
	refreshTimer = setTimeout(() => {
		/* refresh access token every X seconds, where X is determined by spotify's api;
		 * convert X into ms (so multiply by 1000)
		 */
		api.refreshAccessToken((err, data) => {
			if (err) throw err;

			/* setting new access token and expiration time */
			api.setAccessToken(data.body['access_token']);
			clearTimeout(refreshTimer);
			refresher(data.body['expires_in'] * 1000);
		});
	}, timeout);
}

function accessTokenCallback(err: any, data) {
	if (err) throw err;

	/* setting access and refresh tokens */
	api.setAccessToken(data.body['access_token']);
	api.setRefreshToken(data.body['refresh_token']);
	/* setting up refresher */
	refresher(data.body['expires_in'] * 1000);

	/* now we can do what we want with the spotify api */
	generator = new Generator(api);

	/* get user playlists */
	generator.getMyPlaylists(afterPlaylists);
}

function afterPlaylists(playlists) {
	if (!playlists || playlists.size() == 0) {
		console.log("You have no playlists...");
		process.exit(0);
	}

	console.log('Select a playlist');
	/* print all playlists */
	for (var i = 0; i < playlists.size(); i++) {
		console.log(`${i+1}. ${playlists.get(i).name}`);
	}

	let input: number | string = prompt();

	while ((input = Number(input)) == null || input < 0 || input > playlists.size()) {
		input = prompt('Enter a number between 1 and ' + playlists.size());
	}
	
	/* select a playlist, then generate queue based off of it */
	generator.selectPlaylist(() => {
		generator.generateQueue(afterGeneration, process.argv.length >= 3 ? process.argv[2] : null);
	}, input - 1);
}

function afterGeneration(songs) {
	if (!songs || songs.size() == 0) {
		console.log("There are no songs in this playlist...");
		process.exit(0);
	}

	console.log("Here are the songs that are going to be played");
	/* print all songs */
	songs.forEach(song => {
		console.log(`${song.name} - ${song.artists}`);
	});

	/* start playing songs, then get rid of refresh interval (effectively terminates program) */
	generator.start(() => {
		clearInterval(refreshTimer);
	});
}