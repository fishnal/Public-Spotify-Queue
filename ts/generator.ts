/* responsible for generating a queue from a playlist a user selects */

/* import SpotifyWebApi */
import { SpotifyWebApi } from "../spotify-web-api-node/spotify-web-api";
import { Playlist, Track } from "./spotify_objs.js";
import { ReadOnlyArray } from "./utils.js";

/**
 * Constructs a Generator given an authenticated SpotifyWebApi wrapper
 * 
 * @param {SpotifyWebApi} api the authenticated SpotifyWebApi wrapper. 
 */
export class Generator {
	api: SpotifyWebApi;
	playlists = null;
	selectedPlaylist = null;
	orderedSongs = null;
	shuffledSongs = null;
	isShuffled;

	constructor(api: SpotifyWebApi) {
		this.api = api;
	}

	/**
	 * Gets this user's playlists recursively
	 * @param {Number} limit the max amount of playlists to get per request 
	 * @param {Number} offset offset of the playlists for the request
	 * @param {Function} callback called after all playlists have been retrieved
	 */
	private getMyPlaylists0(limit: number, offset: number, callback: Function) {
		/* using callbacks over promises */
		this.api.getUserPlaylists(null, { 'limit': limit, 'offset': offset }, (err, data) => {
			if (err) throw err;

			/* save all of these playlists (with a couple pieces of info though) */
			for (let i in data.body.items) {
				let playlist = data.body.items[i];

				/* only need name, id, and images (thumbnail) of the playlist */
				this.playlists.push(new Playlist(
					playlist.name,
					playlist.id,
					playlist.owner.id,
					playlist.images	
				));
			}

			/* base case */
			if (data.body.total == limit) {
				/* since the amount of playlists we got was limited by 'limit',
				 * we need to recurse and get th rest of the playlists
				 */
				this.getMyPlaylists0(limit, offset + limit, callback);
			} else {
				/* execute callback */
				callback(new ReadOnlyArray(this.playlists));
			}
		});
	}

	getMyPlaylists = function(callback: Function, limit: number = 20) {
		if (limit < 0) {
			console.log("Invalid limit");
		} else if (limit > 50) {
			limit = 50;
		}

		this.playlists = [];
		this.getMyPlaylists0(limit, 0, callback);
	}

	private getSongs0(ownerId, playlistId, limit, offset, callback) {
		this.api.getPlaylistTracks(ownerId, playlistId, { 'limit': limit, 'offset': offset }, (err, data) => {
			if (err) throw err;

			/* add songs */
			for (let i in data.body.items) {
				let track = data.body.items[i].track;

				this.orderedSongs.push(new Track(
					track.name,
					track.id,
					track.uri,
					track.artists,
					track.album.name,
					track.album.images,
					track['duration_ms']
				));
			}

			/* base case recursion */
			if (data.body.total == limit) {
				this.getSongs0(ownerId, playlistId, limit, offset + limit, callback);
			} else {
				this.orderedSongs.sort((a, b) => a.name.localeCompare(b.name));
				callback();
			}
		});
	}

	/**
	 * Select a playlist.
	 * @param {Function} callback the callback function.
	 * @param {Number} index index of the playlist.
	 * @param {Number} limit (optional) the maximum number of playlists to load.
	 */
	selectPlaylist = function(callback: Function, index: number, limit?: number) {
		if (!this.playlists) {
			/* user playlists not defined yet */
			console.log("Load user's playlists first");
		} else if (index < 0 || index >= this.playlists.length) {
			console.log("Out of bounds index");
		} else if (limit < 0) {
			console.log("Invalid limit");
		} else if (limit > 100) {
			limit = 100;
		}
		
		/* update selected playlist */
		this.selectedPlaylist = this.playlists[index];
		/* get songs from this playlist, order by name */
		this.orderedSongs = [];
		this.getSongs0(this.selectedPlaylist.ownerId, this.selectedPlaylist.id, limit, 0, callback);
	}
	
	/**
	 * Generate the queue to be used by host and listeners from the selected playlist.
	 */
	generateQueue = function(callback, cmdShuffle) {
		/* get shuffle state */
		this.api.getMyCurrentPlaybackState(null, (err, data) => {
			if (err) throw err;

			if (cmdShuffle != null) {
				this.isShuffled = cmdShuffle == 'true' ? true : false
			} else {
				this.isShuffled = data.body['shuffle_state'];
			}

			if (this.isShuffled) {
				this.shuffledSongs = this.orderedSongs.slice(0);

				for (let i = this.shuffledSongs.length - 1; i > -1; i--) {
					let j = Math.floor(Math.random() * (i + 1));
					let temp = this.shuffledSongs[j];
					this.shuffledSongs[j] = this.shuffledSongs[i];
					this.shuffledSongs[i] = temp;
				}

				callback(new ReadOnlyArray(this.shuffledSongs));
			} else {
				callback(new ReadOnlyArray(this.orderedSongs));
			}
		}); 
	}

	/**
	 * Starts playing songs from this queue.
	 */
	start = function(callback) {
		var uris = [];

		/* get uris depending on what shuffled state is */
		if (this.isShuffled) {
			this.shuffledSongs.forEach(song => {
				uris.push(song.uri);
			});
		} else {
			this.orderedSongs.forEach(song => {
				uris.push(song.uri);
			});
		}

		this.api.setShuffle({state: false}, playCallback);

		function playCallback(err, data) {
			if (err) throw err;

			/* play this set of songs, then deal with callback */
			this.api.play({
				uris: uris,
				offset: {
					position: 0
				}
			}, transferUserData);
		}

		function transferUserData(err, data) {
			if (err) throw err;
			else if (data.body.statusCode >= 400) {
				if (data.body.statusCode == 404) {
					console.log("Couldn't find the device");
				} else if (data.body.statusCode == 403) {
					console.log("You're not a premium user");
				}
			}

			require('fs').writeFileSync('db.json', 
				JSON.stringify(
					{
						song_uris: uris, 
						host_access_token: [ this.api.getAccessToken() ]
					})
			);
			callback();
		}
	}
}

export default Generator;