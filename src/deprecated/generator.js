/* responsible for generating a queue from a playlist a user selects */

/* import SpotifyWebApi */
const SpotifyWebApi = require('spotify-web-api-node');
const SpotifyObj = require('./spotify_objs.js');
const Utils = require('./utils.js');

/**
 * Constructs a Generator given an authenticated SpotifyWebApi wrapper
 *
 * @param {SpotifyWebApi} api the authenticated SpotifyWebApi wrapper.
 */
function Generator(api) {
    if (!(api instanceof SpotifyWebApi)) {
        /* must be a SpotifyWebApi object */
        throw new TypeError('invalid spotify wrapper');
    }

    var playlists = null;
    var selectedPlaylist = null;
    var orderedSongs = null;
    var shuffledSongs = null;
    var isShuffled;

    /**
     * Gets this user's playlists recursively
     * @param {Number} limit the max amount of playlists to get per request
     * @param {Number} offset offset of the playlists for the request
     * @param {Function} callback called after all playlists have been retrieved
     */
    function getMyPlaylists0(limit, offset, callback) {
        /* using callbacks over promises */
        api.getUserPlaylists(null, { 'limit': limit, 'offset': offset }, (err, data) => {
            if (err) throw err;

            /* save all of these playlists (with a couple pieces of info though) */
            for (let i in data.body.items) {
                let playlist = data.body.items[i];

                /* only need name, id, and images (thumbnail) of the playlist */
                playlists.push(new SpotifyObj.Playlist(
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
                getMyPlaylists0(limit, offset + limit);
            } else {
                /* execute callback */
                callback(new Utils.SafeList(playlists));
            }
        });
    }

    this.getMyPlaylists = function(limit=20, callback) {
        if (limit < 0) {
            console.log("Invalid limit");
        } else if (limit > 50) {
            limit = 50;
        } else if (limit instanceof Function) {
            callback = limit;
            limit = 20;
        }

        playlists = [];
        getMyPlaylists0(limit, 0, callback);
    }

    function getSongs0(ownerId, playlistId, limit, offset, callback) {
        api.getPlaylistTracks(ownerId, playlistId, { 'limit': limit, 'offset': offset }, (err, data) => {
            if (err) throw err;

            /* add songs */
            for (let i in data.body.items) {
                let track = data.body.items[i].track;

                orderedSongs.push(new SpotifyObj.Track(
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
                getSongs0(ownerId, playlistId, limit, offset + limit, callback);
            } else {
                orderedSongs.sort((a, b) => a.name.localeCompare(b.name));
                callback();
            }
        });
    }

    /**
     * Select a playlist.
     * @param {Number} index index of the playlist
     */
    this.selectPlaylist = function(index, limit=20, callback) {
        if (!playlists) {
            /* user playlists not defined yet */
            console.log("Load user's playlists first");
        } else if (index < 0 || index >= playlists.length) {
            console.log("Out of bounds index");
        } else if (limit < 0) {
            console.log("Invalid limit");
        } else if (limit > 100) {
            limit = 100;
        } else if (limit instanceof Function) {
            callback = limit;
            limit = 100;
        }

        /* update selected playlist */
        selectedPlaylist = playlists[index];
        /* get songs from this playlist, order by name */
        orderedSongs = [];
        getSongs0(selectedPlaylist.ownerId, selectedPlaylist.id, limit, 0, callback);
    }

    /**
     * Generate the queue to be used by host and listeners from the selected playlist.
     */
    this.generateQueue = function(callback, cmdShuffle) {
        /* get shuffle state */
        api.getMyCurrentPlaybackState(null, (err, data) => {
            if (err) throw err;

            if (cmdShuffle != null) {
                isShuffled = cmdShuffle == 'true' ? true : false
            } else {
                isShuffled = data.body['shuffle_state'];
            }

            if (isShuffled) {
                shuffledSongs = orderedSongs.slice(0);

                for (let i = shuffledSongs.length - 1; i > -1; i--) {
                    let j = Math.floor(Math.random() * (i + 1));
                    let temp = shuffledSongs[j];
                    shuffledSongs[j] = shuffledSongs[i];
                    shuffledSongs[i] = temp;
                }

                callback(new Utils.SafeList(shuffledSongs));
            } else {
                callback(new Utils.SafeList(orderedSongs));
            }
        });
    }

    /**
     * Starts playing songs from this queue.
     */
    this.start = function(callback) {
        var uris = [];

        /* get uris depending on what shuffled state is */
        if (isShuffled) {
            shuffledSongs.forEach(song => {
                uris.push(song.uri);
            });
        } else {
            orderedSongs.forEach(song => {
                uris.push(song.uri);
            });
        }

        api.setShuffle({state: false}, playCallback);

        function playCallback(err, data) {
            if (err) throw err;

            /* play this set of songs, then deal with callback */
            api.play({
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
                        host_access_token: [ api.getAccessToken() ]
                    })
            );
            callback();
        }
    }
}

module.exports = Generator;
