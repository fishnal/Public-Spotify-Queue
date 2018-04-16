'use strict';

import * as authentication_request from './authentication-request'
import * as web_api_request from './webapi-request'
import { HttpManager, RequestOptions } from './http-manager'

export class SpotifyWebApi {
	private _credentials;

	constructor(credentials?) {
		this._credentials = credentials || {};
	}

	setCredentials(credentials) {
		for (var key in credentials) {
			if (credentials.hasOwnProperty(key)) {
				this._credentials[key] = credentials[key];
			}
		}
	}

	getCredentials() {
		return this._credentials;
	}

	resetCredentials() {
		this._credentials = null;
	}

	setClientId(clientId) {
		this._setCredential('clientId', clientId);
	}

	setClientSecret(clientSecret) {
		this._setCredential('clientSecret', clientSecret);
	}

	setAccessToken(accessToken) {
		this._setCredential('accessToken', accessToken);
	}

	setRefreshToken(refreshToken) {
		this._setCredential('refreshToken', refreshToken);
	}

	setRedirectURI(redirectUri) {
		this._setCredential('redirectUri', redirectUri);
	}

	getRedirectURI() {
		return this._getCredential('redirectUri');
	}

	getClientId() {
		return this._getCredential('clientId');
	}

	getClientSecret() {
		return this._getCredential('clientSecret');
	}

	getAccessToken() {
		return this._getCredential('accessToken');
	}

	getRefreshToken() {
		return this._getCredential('refreshToken');
	}

	resetClientId() {
		this._resetCredential('clientId');
	}

	resetClientSecret() {
		this._resetCredential('clientSecret');
	}

	resetAccessToken() {
		this._resetCredential('accessToken');
	}

	resetRefreshToken() {
		this._resetCredential('refreshToken');
	}

	resetRedirectURI() {
		this._resetCredential('redirectUri');
	}

	private _setCredential(credentialKey, value) {
		this._credentials = this._credentials || {};
		this._credentials[credentialKey] = value;
	}

	private _getCredential(credentialKey) {
		if (!this._credentials) {
			return;
		} else {
			return this._credentials[credentialKey];
		}
	}

	private _resetCredential(credentialKey) {
		if (!this._credentials) {
			return;
		} else {
			this._credentials[credentialKey] = null;
		}
	}

	/**
	 * Request an access token using the Client Credentials flow.
	 * Requires that client ID and client secret has been set previous to the call.
	 * @param {any} options Options.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise} A promise that if successful, resolves into an object containing the access token,
	 *          token type and time to expiration. If rejected, it contains an error object. Not returned if a callback is given.
	 */
	clientCredentialsGrant(options?: any, callback?: Function): Promise<any> {
		return authentication_request.builder()
			.withPath('/api/token')
			.withBodyParameters({
				'grant_type': 'client_credentials'
			})
			.withBodyParameters(options)
			.withHeaders({
				Authorization: 'Basic ' + new Buffer(this.getClientId() + ':' + this.getClientSecret()).toString('base64')
			})
			.build()
			.execute(HttpManager.post, callback);
	}

	/**
	 * Request an access token using the Authorization Code flow.
	 * Requires that client ID, client secret, and redirect URI has been set previous to the call.
	 * @param {string} code The authorization code returned in the callback in the Authorization Code flow.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise} A promise that if successful, resolves into an object containing the access token,
	 *          refresh token, token type and time to expiration. If rejected, it contains an error object.
	 *          Not returned if a callback is given.
	 */
	authorizationCodeGrant(code: string, callback?: Function): Promise<any> {
		return authentication_request.builder()
			.withPath('/api/token')
			.withBodyParameters({
				'grant_type': 'authorization_code',
				'redirect_uri': this.getRedirectURI(),
				'code': code,
				'client_id': this.getClientId(),
				'client_secret': this.getClientSecret()
			})
			.build()
			.execute(HttpManager.post, callback);
	}

	/**
	 * Refresh the access token given that it hasn't expired.
	 * Requires that client ID, client secret and refresh token has been set previous to the call.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise} A promise that if successful, resolves to an object containing the
	 *          access token, time to expiration and token type. If rejected, it contains an error object.
	 *          Not returned if a callback is given.
	 */
	refreshAccessToken(callback?: Function): Promise<any> {
		return authentication_request.builder()
			.withPath('/api/token')
			.withBodyParameters({
				'grant_type': 'refresh_token',
				'refresh_token': this.getRefreshToken()
			})
			.withHeaders({
				Authorization: ('Basic ' + new Buffer(this.getClientId() + ':' + this.getClientSecret()).toString('base64'))
			})
			.build()
			.execute(HttpManager.post, callback);
	}

	/**
	 * Look up a track.
	 * @param {string} trackId The track's ID.
	 * @param {Object} [options] The possible options, currently only market.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getTrack('3Qm86XLflmIXVm1wcwkgDK').then(...)
	 * @returns {Promise|undefined} A promise that if successful, returns an object containing information
	 *          about the track. Not returned if a callback is given.
	 */
	getTrack(trackId: string, options?: object, callback?: Function): Promise<any> | undefined {
		 // In case someone is using a version where options parameter did not exist.
		var actualCallback, actualOptions;
		if (typeof options === 'function' && !callback) {
			actualCallback = options;
			actualOptions = {};
		} else {
			actualCallback = callback;
			actualOptions = options;
		}

		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/tracks/' + trackId)
			.withQueryParameters(actualOptions)
			.build()
			.execute(HttpManager.get, actualCallback);
	}

	/**
	 * Look up several tracks.
	 * @param {string[]} trackIds The IDs of the artists.
	 * @param {Object} [options] The possible options, currently only market.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getArtists(['0oSGxfWSnnOXhD2fKuz2Gy', '3dBVyJ7JuOMt4GE9607Qin']).then(...)
	 * @returns {Promise|undefined} A promise that if successful, returns an object containing information
	 *          about the artists. Not returned if a callback is given.
	 */
	getTracks(trackIds: string[], options?: object, callback?: Function): Promise<any> | undefined {
		// In case someone is using a version where options parameter did not exist.
		var actualCallback, actualOptions;
		if (typeof options === 'function' && !callback) {
			actualCallback = options;
			actualOptions = {};
		} else {
			actualCallback = callback;
			actualOptions = options;
		}

		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/tracks')
			.withQueryParameters({
				'ids' : trackIds.join(',')
			}, actualOptions)
			.build()
			.execute(HttpManager.get, actualCallback);
	}

	/**
	 * Look up an album.
	 * @param {string} albumId The album's ID.
	 * @param {Object} [options] The possible options, currently only market.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getAlbum('0sNOF9WDwhWunNAHPD3Baj').then(...)
	 * @returns {Promise|undefined} A promise that if successful, returns an object containing information
	 *          about the album. Not returned if a callback is given.
	 */
	getAlbum(albumId: string, options?: object, callback?: Function): Promise<any> | undefined {
		// In case someone is using a version where options parameter did not exist.
		var actualCallback, actualOptions;
		if (typeof options === 'function' && !callback) {
			actualCallback = options;
			actualOptions = {};
		} else {
			actualCallback = callback;
			actualOptions = options;
		}

		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/albums/' + albumId)
			.withQueryParameters(actualOptions)
			.build()
			.execute(HttpManager.get, actualCallback);
	}

	/**
	 * Look up several albums.
	 * @param {string[]} albumIds The IDs of the albums.
	 * @param {Object} [options] The possible options, currently only market.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getAlbums(['0oSGxfWSnnOXhD2fKuz2Gy', '3dBVyJ7JuOMt4GE9607Qin']).then(...)
	 * @returns {Promise|undefined} A promise that if successful, returns an object containing information
	 *          about the albums. Not returned if a callback is given.
	 */
	getAlbums(albumIds: string[], options?: object, callback?: Function): Promise<any> | undefined {
		// In case someone is using a version where options parameter did not exist.
		var actualCallback, actualOptions;
		if (typeof options === 'function' && !callback) {
			actualCallback = options;
			actualOptions = {};
		} else {
			actualCallback = callback;
			actualOptions = options;
		}

		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/albums')
			.withQueryParameters({
				'ids' : albumIds.join(',')
			}, actualOptions)
			.build()
			.execute(HttpManager.get, actualCallback);
	}

	/**
	 * Look up an artist.
	 * @param {string} artistId The artist's ID.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example api.getArtist('1u7kkVrr14iBvrpYnZILJR').then(...)
	 * @returns {Promise|undefined} A promise that if successful, returns an object containing information
	 *          about the artist. Not returned if a callback is given.
	 */
	getArtist(artistId: string, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/artists/' + artistId)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Look up several artists.
	 * @param {string[]} artistIds The IDs of the artists.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getArtists(['0oSGxfWSnnOXhD2fKuz2Gy', '3dBVyJ7JuOMt4GE9607Qin']).then(...)
	 * @returns {Promise|undefined} A promise that if successful, returns an object containing information
	 *          about the artists. Not returned if a callback is given.
	 */
	getArtists(artistIds: string[], callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/artists')
			.withQueryParameters({
				'ids' : artistIds.join(',')
			})
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Search for music entities of certain types.
	 * @param {string} query The search query.
	 * @param {string[]} types An array of item types to search across.
	 * Valid types are: 'album', 'artist', 'playlist', and 'track'.
	 * @param {Object} [options] The possible options, e.g. limit, offset.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example search('Abba', ['track', 'playlist'], { limit : 5, offset : 1 }).then(...)
	 * @returns {Promise|undefined} A promise that if successful, returns an object containing the
	 *          search results. The result is paginated. If the promise is rejected,
	 *          it contains an error object. Not returned if a callback is given.
	 */
	search(query: string, types: string[], options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/search/')
			.withQueryParameters({
				type : types.join(','),
				q : query
			}, options)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Search for an album.
	 * @param {string} query The search query.
	 * @param {Object} [options] The possible options, e.g. limit, offset.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example searchAlbums('Space Oddity', { limit : 5, offset : 1 }).then(...)
	 * @returns {Promise|undefined} A promise that if successful, returns an object containing the
	 *          search results. The result is paginated. If the promise is rejected,
	 *          it contains an error object. Not returned if a callback is given.
	 */
	searchAlbums(query: string, options?: object, callback?: Function): Promise<any> | undefined {
		return this.search(query, ['album'], options, callback);
	}

	/**
	 * Search for an artist.
	 * @param {string} query The search query.
	 * @param {Object} [options] The possible options, e.g. limit, offset.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example searchArtists('David Bowie', { limit : 5, offset : 1 }).then(...)
	 * @returns {Promise|undefined} A promise that if successful, returns an object containing the
	 *          search results. The result is paginated. If the promise is rejected,
	 *          it contains an error object. Not returned if a callback is given.
	 */
	searchArtists(query: string, options?: object, callback?: Function): Promise<any> | undefined {
		return this.search(query, ['artist'], options, callback);
	}

	/**
	 * Search for a track.
	 * @param {string} query The search query.
	 * @param {Object} [options] The possible options, e.g. limit, offset.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example searchTracks('Mr. Brightside', { limit : 3, offset : 2 }).then(...)
	 * @returns {Promise|undefined} A promise that if successful, returns an object containing the
	 *          search results. The result is paginated. If the promise is rejected,
	 *          it contains an error object. Not returned if a callback is given.
	 */
	searchTracks(query: string, options?: object, callback?: Function): Promise<any> | undefined {
		return this.search(query, ['track'], options, callback);
	}

	/**
	 * Search for playlists.
	 * @param {string} query The search query.
	 * @param {Object} options The possible options.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example searchPlaylists('workout', { limit : 1, offset : 0 }).then(...)
	 * @returns {Promise|undefined} A promise that if successful, returns an object containing the
	 *          search results. The result is paginated. If the promise is rejected,
	 *          it contains an error object. Not returned if a callback is given.
	 */
	searchPlaylists(query: string, options?: object, callback?: Function): Promise<any> | undefined {
		return this.search(query, ['playlist'], options, callback);
	}

	/**
	 * Get an artist's albums.
	 * @param {string} artistId The artist's ID.
	 * @options {Object} [options] The possible options, e.g. limit, offset.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getArtistAlbums('0oSGxfWSnnOXhD2fKuz2Gy', { album_type : 'album', country : 'GB', limit : 2, offset : 5 }).then(...)
	 * @returns {Promise|undefined} A promise that if successful, returns an object containing the albums
	 *          for the given artist. The result is paginated. If the promise is rejected,
	 *          it contains an error object. Not returned if a callback is given.
	 */
	getArtistAlbums(artistId: string, options, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/artists/' + artistId + '/albums')
			.withQueryParameters(options)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Get the tracks of an album.
	 * @param albumId the album's ID.
	 * @options {Object} [options] The possible options, e.g. limit.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getAlbumTracks('41MnTivkwTO3UUJ8DrqEJJ', { limit : 5, offset : 1 }).then(...)
	 * @returns {Promise|undefined} A promise that if successful, returns an object containing the
	 *                    tracks in the album. The result is paginated. If the promise is rejected.
	 *                    it contains an error object. Not returned if a callback is given.
	 */
	getAlbumTracks(albumId, options, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/albums/' + albumId + '/tracks')
			.withQueryParameters(options)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Get an artist's top tracks.
	 * @param {string} artistId The artist's ID.
	 * @param {string} country The country/territory where the tracks are most popular. (format: ISO 3166-1 alpha-2)
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getArtistTopTracks('0oSGxfWSnnOXhD2fKuz2Gy', 'GB').then(...)
	 * @returns {Promise|undefined} A promise that if successful, returns an object containing the
	 *          artist's top tracks in the given country. If the promise is rejected,
	 *          it contains an error object. Not returned if a callback is given.
	 */
	getArtistTopTracks(artistId: string, country: string, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/artists/' + artistId + '/top-tracks')
			.withQueryParameters({
				'country' : country
			})
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Get related artists.
	 * @param {string} artistId The artist's ID.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getArtistRelatedArtists('0oSGxfWSnnOXhD2fKuz2Gy').then(...)
	 * @returns {Promise|undefined} A promise that if successful, returns an object containing the
	 *          related artists. If the promise is rejected, it contains an error object. Not returned if a callback is given.
	 */
	getArtistRelatedArtists(artistId: string, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/artists/' + artistId + '/related-artists')
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Get information about a user.
	 * @param userId The user ID.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getUser('thelinmichael').then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves to an object
	 *          containing information about the user. If the promise is
	 *          rejected, it contains an error object. Not returned if a callback is given.
	 */
	getUser(userId, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/users/' + encodeURIComponent(userId))
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Get information about the user that has signed in (the current user).
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getMe().then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves to an object
	 *          containing information about the user. The amount of information
	 *          depends on the permissions given by the user. If the promise is
	 *          rejected, it contains an error object. Not returned if a callback is given.
	 */
	getMe(callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me')
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Get a user's playlists.
	 * @param {string} userId An optional id of the user. If you know the Spotify URI it is easy
	 * to find the id (e.g. spotify:user:<here_is_the_id>). If not provided, the id of the user that granted
	 * the permissions will be used.
	 * @param {Object} [options] The options supplied to this request.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getUserPlaylists('thelinmichael').then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves to an object containing
	 *          a list of playlists. If rejected, it contains an error object. Not returned if a callback is given.
	 */
	getUserPlaylists(userId: string, options?: object, callback?: Function): Promise<any> | undefined {
		var path;
		if (typeof userId === 'string') {
			path = '/v1/users/' + encodeURIComponent(userId) + '/playlists';
		} else {
			path = '/v1/me/playlists';
		}

		return web_api_request.builder(this.getAccessToken())
			.withPath(path)
			.withQueryParameters(options)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Get a playlist.
	 * @param {string} userId The playlist's owner's user ID.
	 * @param {string} playlistId The playlist's ID.
	 * @param {Object} [options] The options supplied to this request.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getPlaylist('thelinmichael', '3EsfV6XzCHU8SPNdbnFogK').then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves to an object containing
	 *          the playlist. If rejected, it contains an error object. Not returned if a callback is given.
	 */
	getPlaylist(userId: string, playlistId: string, options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/users/' + encodeURIComponent(userId) + '/playlists/' + playlistId)
			.withQueryParameters(options)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Get tracks in a playlist.
	 * @param {string} userId THe playlist's owner's user ID.
	 * @param {string} playlistId The playlist's ID.
	 * @param {Object} [options] Optional options, such as fields.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getPlaylistTracks('thelinmichael', '3ktAYNcRHpazJ9qecm3ptn').then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves to an object that containing
	 * the tracks in the playlist. If rejected, it contains an error object. Not returned if a callback is given.
	 */
	getPlaylistTracks(userId: string, playlistId: string, options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/users/' + encodeURIComponent(userId) + '/playlists/' + playlistId + '/tracks')
			.withQueryParameters(options)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Create a playlist.
	 * @param {string} userId The playlist's owner's user ID.
	 * @param {string} playlistName The name of the playlist.
	 * @param {Object} [options] The possible options, currently only public.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example createPlaylist('thelinmichael', 'My cool playlist!', { public : false }).then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves to an object containing information about the
	 *          created playlist. If rejected, it contains an error object. Not returned if a callback is given.
	 */
	createPlaylist(userId: string, playlistName: string, options?: object, callback?: Function): Promise<any> | undefined {
		// In case someone is using a version where options parameter did not exist.
		var actualCallback;
		if (typeof options === 'function' && !callback) {
			actualCallback = options;
		} else {
			actualCallback = callback;
		}

		var actualOptions = { 'name' : playlistName };
		if (typeof options === 'object') {
			Object.keys(options).forEach(function(key) {
				actualOptions[key] = options[key];
			});
		}

		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/users/' + encodeURIComponent(userId) + '/playlists')
			.withHeaders({ 'Content-Type' : 'application/json' })
			.withBodyParameters(actualOptions)
			.build()
			.execute(HttpManager.post, actualCallback);
	}

	/**
	 * Follow a playlist.
	 * @param {string} userId The playlist's owner's user ID
	 * @param {string} playlistId The playlist's ID
	 * @param {Object} [options] The possible options, currently only public.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
	 * it contains an error object. Not returned if a callback is given.
	 */
	followPlaylist(userId: string, playlistId: string, options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/users/' + encodeURIComponent(userId) + '/playlists/' + playlistId + '/followers')
			.withHeaders({ 'Content-Type' : 'application/json' })
			.withBodyParameters(options)
			.build()
			.execute(HttpManager.put, callback);
	}

	/**
	 * Unfollow a playlist.
	 * @param {string} userId The playlist's owner's user ID
	 * @param {string} playlistId The playlist's ID
	 * @param {Object} [options] The possible options, currently only public.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
	 * it contains an error object. Not returned if a callback is given.
	 */
	unfollowPlaylist(userId: string, playlistId: string, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/users/' + encodeURIComponent(userId) + '/playlists/' + playlistId + '/followers')
			.withHeaders({ 'Content-Type' : 'application/json' })
			.build()
			.execute(HttpManager.del, callback);

	}

	/**
	 * Change playlist details.
	 * @param {string} userId The playlist's owner's user ID
	 * @param {string} playlistId The playlist's ID
	 * @param {Object} [options] The possible options, e.g. name, public.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example changePlaylistDetails('thelinmichael', '3EsfV6XzCHU8SPNdbnFogK', {name: 'New name', public: true}).then(...)
	 * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
	 * it contains an error object. Not returned if a callback is given.
	 */
	changePlaylistDetails(userId: string, playlistId: string, options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/users/' + encodeURIComponent(userId) + '/playlists/' + playlistId)
			.withHeaders({ 'Content-Type' : 'application/json' })
			.withBodyParameters(options)
			.build()
			.execute(HttpManager.put, callback);
	}

	/**
	 * Replace the image used to represent a specific playlist.
	 * @param {string} userId The playlist's owner's user ID
	 * @param {string} playlistId The playlist's ID
	 * @param {string} base64URI Base64 encoded JPEG image data, maximum payload size is 256 KB
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example uploadCustomPlaylistCoverImage('thelinmichael', '3EsfV6XzCHU8SPNdbnFogK', 'longbase64uri').then(...)
	 * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
	 * it contains an error object. Not returned if a callback is given.
	 */
	uploadCustomPlaylistCoverImage(userId: string, playlistId: string, base64URI: string, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/users/' + encodeURIComponent(userId) + '/playlists/' + playlistId + '/images')
			.withHeaders({ 'Content-Type' : 'image/jpeg' })
			.withBodyParameters(base64URI)
			.build()
			.execute(HttpManager.put, callback);
	}

	/**
	 * Add tracks to a playlist.
	 * @param {string} userId The playlist's owner's user ID
	 * @param {string} playlistId The playlist's ID
	 * @param {string[]} tracks URIs of the tracks to add to the playlist.
	 * @param {Object} [options] Options, position being the only one.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example addTracksToPlaylist('thelinmichael', '3EsfV6XzCHU8SPNdbnFogK',
							'["spotify:track:4iV5W9uYEdYUVa79Axb7Rh", "spotify:track:1301WleyT98MSxVHPZCA6M"]').then(...)
	 * @returns {Promise|undefined} A promise that if successful returns an object containing a snapshot_id. If rejected,
	 * it contains an error object. Not returned if a callback is given.
	 */
	addTracksToPlaylist(userId: string, playlistId: string, tracks: string[], options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/users/' + encodeURIComponent(userId) + '/playlists/' + playlistId + '/tracks')
			.withHeaders({ 'Content-Type' : 'application/json' })
			.withQueryParameters(options)
			.withBodyParameters({
				uris: tracks
			})
			.build()
			.execute(HttpManager.post, callback);
	}

	/**
	 * Remove tracks from a playlist.
	 * @param {string} userId The playlist's owner's user ID
	 * @param {string} playlistId The playlist's ID
	 * @param {Object[]} tracks An array of objects containing a property called uri with the track URI (String), and
	 * a an optional property called positions (int[]), e.g. { uri : "spotify:track:491rM2JN8KvmV6p0oDDuJT", positions : [0, 15] }
	 * @param {Object} options Options, snapshot_id being the only one.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful returns an object containing a snapshot_id. If rejected,
	 * it contains an error object. Not returned if a callback is given.
	 */
	removeTracksFromPlaylist(userId: string, playlistId: string, tracks: object[], options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/users/' + encodeURIComponent(userId) + '/playlists/' + playlistId + '/tracks')
			.withHeaders({ 'Content-Type' : 'application/json' })
			.withBodyParameters({
				'tracks': tracks
			}, options)
			.build()
			.execute(HttpManager.del, callback);

	}

	/**
	 * Remove tracks from a playlist by position instead of specifying the tracks' URIs.
	 * @param {string} userId The playlist's owner's user ID
	 * @param {string} playlistId The playlist's ID
	 * @param {number[]} positions The positions of the tracks in the playlist that should be removed
	 * @param {string} snapshot_id The snapshot ID, or version, of the playlist. Required
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful returns an object containing a snapshot_id. If rejected,
	 * it contains an error object. Not returned if a callback is given.
	 */
	removeTracksFromPlaylistByPosition(userId: string, playlistId: string, positions: number[], snapshotId, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/users/' + encodeURIComponent(userId) + '/playlists/' + playlistId + '/tracks')
			.withHeaders({ 'Content-Type' : 'application/json' })
			.withBodyParameters({
				'positions': positions,
				'snapshot_id' : snapshotId
			})
			.build()
			.execute(HttpManager.del, callback);

	}

	/**
	 * Replace tracks in a playlist.
	 * @param {string} userId The playlist's owner's user ID
	 * @param {string} playlistId The playlist's ID
	 * @param {Object[]} uris An array of track URIs (strings)
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful returns an empty object. If rejected,
	 * it contains an error object. Not returned if a callback is given.
	 */
	replaceTracksInPlaylist(userId: string, playlistId: string, uris: object[], callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/users/' + encodeURIComponent(userId) + '/playlists/' + playlistId + '/tracks')
			.withHeaders({ 'Content-Type' : 'application/json' })
			.withBodyParameters({
				'uris': uris
			})
			.build()
			.execute(HttpManager.put, callback);
	}

	/**
	 * Reorder tracks in a playlist.
	 * @param {string} userId The playlist's owner's user ID
	 * @param {string} playlistId The playlist's ID
	 * @param {number} rangeStart The position of the first track to be reordered.
	 * @param {number} insertBefore The position where the tracks should be inserted.
	 * @param {Object} options Optional parameters, i.e. range_length and snapshot_id.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful returns an object containing a snapshot_id. If rejected,
	 * it contains an error object. Not returned if a callback is given.
	 */
	reorderTracksInPlaylist(userId: string, playlistId: string, rangeStart: number, insertBefore: number, options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/users/' + encodeURIComponent(userId) + '/playlists/' + playlistId + '/tracks')
			.withHeaders({ 'Content-Type' : 'application/json' })
			.withBodyParameters({
				'range_start': rangeStart,
				'insert_before' : insertBefore
			}, options)
			.build()
			.execute(HttpManager.put, callback);
	}

	/**
	 * Get audio features for a single track identified by its unique Spotify ID.
	 * @param {string} trackId The track ID
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getAudioFeaturesForTrack('38P3Q4QcdjQALGF2Z92BmR').then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves to an object
	 *          containing information about the audio features. If the promise is
	 *          rejected, it contains an error object. Not returned if a callback is given.
	 */
	getAudioFeaturesForTrack(trackId: string, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/audio-features/' + trackId)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Get audio analysis for a single track identified by its unique Spotify ID.
	 * @param {string} trackId The track ID
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getAudioAnalysisForTrack('38P3Q4QcdjQALGF2Z92BmR').then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves to an object
	 *          containing information about the audio analysis. If the promise is
	 *          rejected, it contains an error object. Not returned if a callback is given.
	 */
	getAudioAnalysisForTrack(trackId: string, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/audio-analysis/' + trackId)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Get audio features for multiple tracks identified by their unique Spotify ID.
	 * @param {string[]} trackIds The track IDs
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getAudioFeaturesForTracks(['38P3Q4QcdjQALGF2Z92BmR', '2HO2bnoMrpnZUbUqiilLHi']).then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves to an object
	 *          containing information about the audio features for the tracks. If the promise is
	 *          rejected, it contains an error object. Not returned if a callback is given.
	 */
	getAudioFeaturesForTracks(trackIds: string[], callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/audio-features')
			.withQueryParameters({
				'ids' : trackIds.join(',')
			})
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Create a playlist-style listening experience based on seed artists, tracks and genres.
	 * @param {Object} [options] The options supplied to this request.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getRecommendations({ min_energy: 0.4, seed_artists: ['6mfK6Q2tzLMEchAr0e9Uzu', '4DYFVNKZ1uixa6SQTvzQwJ'], min_popularity: 50 }).then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves to an object containing
	 *          a list of tracks and a list of seeds. If rejected, it contains an error object. Not returned if a callback is given.
	 */
	getRecommendations(options?: object, callback?: Function): Promise<any> | undefined {
		var _opts = {};
		var optionsOfTypeArray = ['seed_artists', 'seed_genres', 'seed_tracks'];
		for (var option in options) {
			if (options.hasOwnProperty(option)) {
				if (optionsOfTypeArray.indexOf(option) !== -1 &&
					Object.prototype.toString.call(options[option]) === '[object Array]') {
					_opts[option] = options[option].join(',');
				} else {
					_opts[option] = options[option];
				}
			}
		}

		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/recommendations')
			.withQueryParameters(_opts)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Retrieve a list of available genres seed parameter values for recommendations.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example getAvailableGenreSeeds().then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves to an object containing
	 *          a list of available genres to be used as seeds for recommendations.
	 *          If rejected, it contains an error object. Not returned if a callback is given.
	 */
	getAvailableGenreSeeds(callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/recommendations/available-genre-seeds')
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Retrieve a URL where the user can give the application permissions.
	 * @param {string[]} scopes The scopes corresponding to the permissions the application needs.
	 * @param {string} state A parameter that you can use to maintain a value between the request and the callback to redirect_uri.It is useful to prevent CSRF exploits.
	 * @param {boolean} showDialog A parameter that you can use to force the user to approve the app on each login rather than being automatically redirected.
	 * @returns {string} The URL where the user can give application permissions.
	 */
	createAuthorizeURL(scopes: string[], state: string, showDialog?: boolean): string {
		return authentication_request.builder()
			.withPath('/authorize')
			.withQueryParameters({
				'client_id' : this.getClientId(),
				'response_type' : 'code',
				'redirect_uri' : this.getRedirectURI(),
				'scope' : scopes.join('%20'),
				'state' : state,
				'show_dialog': showDialog && !!showDialog
			})
			.build()
			.getURL();
	}

	/**
	 * Retrieve the tracks that are saved to the authenticated users Your Music library.
	 * @param {Object} [options] Options, being market, limit, and/or offset.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which in turn contains
	 *          playlist track objects. Not returned if a callback is given.
	 */
	getMySavedTracks(options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/tracks')
			.withQueryParameters(options)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Check if one or more tracks is already saved in the current Spotify user’s “Your Music” library.
	 * @param {string[]} trackIds The track IDs
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, resolves into an array of booleans. The order
	 * of the returned array's elements correspond to the track ID in the request.
	 * The boolean value of true indicates that the track is part of the user's library, otherwise false.
	 * Not returned if a callback is given.
	 */
	containsMySavedTracks(trackIds: string[], callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/tracks/contains')
			.withQueryParameters({
				'ids' : trackIds.join(',')
			})
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Remove a track from the authenticated user's Your Music library.
	 * @param {string[]} trackIds The track IDs
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error.
	 * Not returned if a callback is given.
	 */
	removeFromMySavedTracks(trackIds: string[], callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/tracks')
			.withHeaders({ 'Content-Type' : 'application/json' })
			.withBodyParameters(trackIds)
			.build()
			.execute(HttpManager.del, callback);

	}

	 /**
	 * Add a track from the authenticated user's Your Music library.
	 * @param {string[]} trackIds The track IDs
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error. Not returned if a callback is given.
	 */
	addToMySavedTracks(trackIds: string[], callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/tracks')
			.withHeaders({ 'Content-Type' : 'application/json' })
			.withBodyParameters(trackIds)
			.build()
			.execute(HttpManager.put, callback);
	}

	/**
	 * Remove an album from the authenticated user's Your Music library.
	 * @param {string[]} albumIds The album IDs
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error.
	 * Not returned if a callback is given.
	 */
	removeFromMySavedAlbums(albumIds: string[], callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/albums')
			.withHeaders({ 'Content-Type' : 'application/json' })
			.withBodyParameters(albumIds)
			.build()
			.execute(HttpManager.del, callback);

	}

	/**
	 * Add an album from the authenticated user's Your Music library.
	 * @param {string[]} albumIds The track IDs
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error. Not returned if a callback is given.
	 */
	addToMySavedAlbums(albumIds: string[], callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/albums')
			.withHeaders({ 'Content-Type' : 'application/json' })
			.withBodyParameters(albumIds)
			.build()
			.execute(HttpManager.put, callback);
	}

	/**
	 * Retrieve the albums that are saved to the authenticated users Your Music library.
	 * @param {Object} [options] Options, being market, limit, and/or offset.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which in turn contains
	 *          playlist album objects. Not returned if a callback is given.
	 */
	getMySavedAlbums(options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/albums')
			.withQueryParameters(options)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Check if one or more albums is already saved in the current Spotify user’s “Your Music” library.
	 * @param {string[]} albumIds The album IDs
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, resolves into an array of booleans. The order
	 * of the returned array's elements correspond to the album ID in the request.
	 * The boolean value of true indicates that the album is part of the user's library, otherwise false.
	 * Not returned if a callback is given.
	 */
	containsMySavedAlbums(albumIds: string[], callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/albums/contains')
			.withQueryParameters({
				'ids' : albumIds.join(',')
			})
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Get the current user's top artists based on calculated affinity.
	 * @param {Object} [options] Options, being time_range, limit, offset.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of artists,
	 *          otherwise an error. Not returned if a callback is given.
	 */
	getMyTopArtists(options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/top/artists')
			.withQueryParameters(options)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Get the current user's top tracks based on calculated affinity.
	 * @param {Object} [options] Options, being time_range, limit, offset.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
	 *          otherwise an error. Not returned if a callback is given.
	 */
	getMyTopTracks(options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/top/tracks')
			.withQueryParameters(options)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Get the Current User's Recently Played Tracks
	 * @param {Object} [options] Options, being type, after, limit, before.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
	 *          otherwise an error. Not returned if a callback is given.
	 */
	getMyRecentlyPlayedTracks(options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/player/recently-played')
			.withQueryParameters(options)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Get the Current User's Connect Devices
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
	 *          otherwise an error. Not returned if a callback is given.
	 */
	getMyDevices(callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/player/devices')
			.build()
			.execute(HttpManager.get, callback);
	}


	/**
	 * Get the Current User's Currently Playing Track.
	 * @param {Object} [options] Options, being market.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
	 *          otherwise an error. Not returned if a callback is given.
	 */
	getMyCurrentPlayingTrack(options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/player/currently-playing')
			.withQueryParameters(options)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Get the Current User's Current Playback State
	 * @param {Object} [options] Options, being market.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
	 *          otherwise an error. Not returned if a callback is given.
	 */
	getMyCurrentPlaybackState(options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/player')
			.withQueryParameters(options)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Transfer a User's Playback
	 * @param {any} [options] Options, being market.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
	 *          otherwise an error. Not returned if a callback is given.
	 */
	transferMyPlayback(options: any, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/player')
			.withHeaders({ 'Content-Type' : 'application/json' })
			.withBodyParameters({
				'device_ids': options.deviceIds,
				'play': !!options.play
			})
			.build()
			.execute(HttpManager.put, callback);
	}

	/**
	 * Starts o Resumes the Current User's Playback
	 * @param {any} [options] Options, being device_id, context_uri, offset, uris.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example playbackResume({context_uri: 'spotify:album:5ht7ItJgpBH7W6vJ5BqpPr'}).then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
	 *          otherwise an error. Not returned if a callback is given.
	 */
	play(options?: any, callback?: Function): Promise<any> | undefined {
		/*jshint camelcase: false */
		var _options = options || {};
		var queryParams = _options.device_id ? {device_id: _options.device_id} : null;
		var postData = {};
		['context_uri', 'uris', 'offset'].forEach(function(field) {
			if (field in _options) {
				postData[field] = _options[field];
			}
		});
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/player/play')
			.withQueryParameters(queryParams)
			.withHeaders({ 'Content-Type' : 'application/json' })
			.withBodyParameters(postData)
			.build()
			.execute(HttpManager.put, callback);
	}

	/**
	 * Pauses the Current User's Playback
	 * @param {any} [options] Options, for now device_id,
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example playbackPause().then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
	 *          otherwise an error. Not returned if a callback is given.
	 */
	pause(options?: any, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/player/pause')
			/*jshint camelcase: false */
			.withQueryParameters(options && options.device_id ? {device_id: options.device_id} : null)
			.withHeaders({ 'Content-Type' : 'application/json' })
			.build()
			.execute(HttpManager.put, callback);
	}

	/**
	 * Skip the Current User's Playback To Previous Track
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example playbackPrevious().then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
	 *          otherwise an error. Not returned if a callback is given.
	 */
	skipToPrevious(callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/player/previous')
			.withHeaders({ 'Content-Type' : 'application/json' })
			.build()
			.execute(HttpManager.post, callback);
	}

	/**
	 * Skip the Current User's Playback To Next Track
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example playbackNext().then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
	 *          otherwise an error. Not returned if a callback is given.
	 */
	skipToNext(callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/player/next')
			.withHeaders({ 'Content-Type' : 'application/json' })
			.build()
			.execute(HttpManager.post, callback);
	}

	/**
	 * Set Repeat Mode On The Current User's Playback
	 * @param {any} [options] Options, being state (track, context, off).
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example playbackRepeat({state: 'context'}).then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
	 *          otherwise an error. Not returned if a callback is given.
	 */
	setRepeat(options?: any, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/player/repeat')
			.withQueryParameters({
				'state': options.state || 'off'
			})
			.build()
			.execute(HttpManager.put, callback);
	}

	/**
	 * Set Shuffle Mode On The Current User's Playback
	 * @param {any} [options] Options, being state (true, false).
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example playbackShuffle({state: 'false'}).then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
	 *          otherwise an error. Not returned if a callback is given.
	 */
	setShuffle(options?: any, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/player/shuffle')
			.withQueryParameters({
				'state': options.state || 'false'
			})
			.build()
			.execute(HttpManager.put, callback);
	}

	/**
	 * Add the current user as a follower of one or more other Spotify users.
	 * @param {string[]} userIds The IDs of the users to be followed.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example followUsers(['thelinmichael', 'wizzler']).then(...)
	 * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
	 *          it contains an error object. Not returned if a callback is given.
	 */
	followUsers(userIds: string[], callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/following')
			.withQueryParameters({
				ids: userIds.join(','),
				type: 'user'
			})
			.build()
			.execute(HttpManager.put, callback);
	}

	/**
	 * Add the current user as a follower of one or more artists.
	 * @param {string[]} artistIds The IDs of the artists to be followed.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example followArtists(['0LcJLqbBmaGUft1e9Mm8HV', '3gqv1kgivAc92KnUm4elKv']).then(...)
	 * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
	 *          it contains an error object. Not returned if a callback is given.
	 */
	followArtists(artistIds: string[], callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/following')
			.withQueryParameters({
				ids: artistIds.join(','),
				type: 'artist'
			})
			.build()
			.execute(HttpManager.put, callback);
	}

	/**
	 * Remove the current user as a follower of one or more other Spotify users.
	 * @param {string[]} userIds The IDs of the users to be unfollowed.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example unfollowUsers(['thelinmichael', 'wizzler']).then(...)
	 * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
	 *          it contains an error object. Not returned if a callback is given.
	 */
	unfollowUsers(userIds: string[], callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/following')
			.withQueryParameters({
				ids: userIds.join(','),
				type: 'user'
			})
			.build()
			.execute(HttpManager.del, callback);

	}

	/**
	 * Remove the current user as a follower of one or more artists.
	 * @param {string[]} artistIds The IDs of the artists to be unfollowed.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example unfollowArtists(['0LcJLqbBmaGUft1e9Mm8HV', '3gqv1kgivAc92KnUm4elKv']).then(...)
	 * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
	 *          it contains an error object. Not returned if a callback is given.
	 */
	unfollowArtists(artistIds: string[], callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/following')
			.withQueryParameters({
				ids: artistIds.join(','),
				type: 'artist'
			})
			.build()
			.execute(HttpManager.del, callback);

	}

	/**
	 * Check to see if the current user is following one or more other Spotify users.
	 * @param {string[]} userIds The IDs of the users to check if are followed by the current user.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example isFollowingUsers(['thelinmichael', 'wizzler']).then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves into an array of booleans. The order
	 *          of the returned array's elements correspond to the users IDs in the request.
	 *          The boolean value of true indicates that the user is following that user, otherwise is not.
	 *          Not returned if a callback is given.
	 */
	isFollowingUsers(userIds: string[], callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/following/contains')
			.withQueryParameters({
				ids: userIds.join(','),
				type: 'user'
			})
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Get the current user's followed artists.
	 * @param {Object} [options] Options, being after and limit.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which contains
	 * album objects. Not returned if a callback is given.
	 */
	getFollowedArtists(options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/following')
			.withHeaders({ 'Content-Type' : 'application/json' })
			.withQueryParameters({
				type : 'artist'
			}, options)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Check if users are following a playlist.
	 * @param {string} userId The playlist's owner's user ID
	 * @param {string} playlistId The playlist's ID
	 * @param {String[]} User IDs of the following users
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful returns an array of booleans. If rejected,
	 * it contains an error object. Not returned if a callback is given.
	 */
	areFollowingPlaylist(userId: string, playlistId: string, followerIds, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/users/' + encodeURIComponent(userId) + '/playlists/' + playlistId + '/followers/contains')
			.withQueryParameters({
				ids : followerIds.join(',')
			})
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Check to see if the current user is following one or more artists.
	 * @param {string[]} artistIds The IDs of the artists to check if are followed by the current user.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @example isFollowingArtists(['0LcJLqbBmaGUft1e9Mm8HV', '3gqv1kgivAc92KnUm4elKv']).then(...)
	 * @returns {Promise|undefined} A promise that if successful, resolves into an array of booleans. The order
	 *          of the returned array's elements correspond to the artists IDs in the request.
	 *          The boolean value of true indicates that the user is following that artist, otherwise is not.
	 *          Not returned if a callback is given.
	 */
	isFollowingArtists(artistIds: string[], callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/me/following/contains')
			.withQueryParameters({
				ids: artistIds.join(','),
				type: 'artist'
			})
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Retrieve new releases
	 * @param {Object} [options] Options, being country, limit and/or offset.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which contains
	 * album objects. Not returned if a callback is given.
	 */
	getNewReleases(options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/browse/new-releases')
			.withHeaders({ 'Content-Type' : 'application/json' })
			.withQueryParameters(options)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Retrieve featured playlists
	 * @param {Object} [options] Options, being country, locale, timestamp, limit, offset.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which contains
	 * featured playlists. Not returned if a callback is given.
	 */
	getFeaturedPlaylists(options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/browse/featured-playlists')
			.withHeaders({ 'Content-Type' : 'application/json' })
			.withQueryParameters(options)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Retrieve a list of categories used to tag items in Spotify (e.g. in the 'Browse' tab)
	 * @param {Object} [options] Options, being country, locale, limit, offset.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object of categories.
	 * Not returned if a callback is given.
	 */
	getCategories(options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/browse/categories')
			.withQueryParameters(options)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Retrieve a category.
	 * @param {string} categoryId The id of the category to retrieve.
	 * @param {Object} [options] Options, being country, locale.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a category object.
	 * Not returned if a callback is given.
	 */
	getCategory(categoryId: string, options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/browse/categories/' + categoryId)
			.withQueryParameters(options)
			.build()
			.execute(HttpManager.get, callback);
	}

	/**
	 * Retrieve playlists for a category.
	 * @param {string} categoryId The id of the category to retrieve playlists for.
	 * @param {Object} [options] Options, being country, limit, offset.
	 * @param {Function} [callback] Optional callback method to be called instead of the promise.
	 * @returns {Promise|undefined} A promise that if successful, resolves to a paging object containing simple playlists.
	 * Not returned if a callback is given.
	 */
	getPlaylistsForCategory(categoryId: string, options?: object, callback?: Function): Promise<any> | undefined {
		return web_api_request.builder(this.getAccessToken())
			.withPath('/v1/browse/categories/' + categoryId + '/playlists')
			.withQueryParameters(options)
			.build()
			.execute(HttpManager.get, callback);
	}
}
