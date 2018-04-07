var SpotifyWebApi = require ('spotify-web-api-node');
var opn = require ('opn')

function auth() {
	//scope array holds possible scope parameters
	const state = 'YXJyyvYXlzc3RhcnRhdDA='
		_scope = ['user-read-private', 'playlist-read-private', 'playlist-read-collaborative', 'user-read-currently-playing', 'streaming', 'user-read-playback-state']
		
	var spotifyApi = new SpotifyWebApi({
		clientId :  'acd0f18a3e124101af31f9b3582130c6',
		clientSecret : '276a4580f7e94dd1a20f5d797b95dbba',
		redirectUri : 'https://www.google.com/',
		response_type : 'code'
	})

	var authURL = spotifyApi.createAuthorizeURL(_scope, state, true)

	console.log(authURL)
	opn(authURL)

	return spotifyApi;
}

module.exports = auth;