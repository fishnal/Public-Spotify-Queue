# Design

## Intervals for Access Tokens

+ Make first interval based off of first access token expiration time
  + Each time interval executes, request new access token
  + Set this interval's repeat time (in *ms*) to whatever new access token's expiration time is

## Setting up Spotify Web API Wrapper

+ Provide the following for authentication:
  + Client ID
  + Client Secret
  + Scopes
    + `user-read-private` to determine what their subscription status is
    + `playlist-read-private` to read both user's public and private playlists
    + `playlist-read-collaborative` to read user's collaborative playlists as well
      + In combining public, private, and collaborative playlists, can effectively read all of user's playlists
    + `user-read-currently-playing` to determine what user is currently listening to; used for broadcast it to other listeners
    + `streaming` to control host's playback (need to manually change songs after one finishes)
    + **`user-read-playback-state`** this is questionable, don't know if we want to know user has their playback paused or playing (and whatever else it gives us)
  + Redirect URI
    + Setup a local server
    + Use that as the redirect URI
    + **Do a small front-end update to it saying "You can now close this window" or something**
  + State
    + Get a state from [Seth Cardoza's Password Generator API](http://www.sethcardoza.com/tools/random-password-generator-api/)
    + Make sure to include certain parameters (like complexity, length, etc.)
  + Response Type
    + Set this to `code` to get authorization code (provides most amount of access)
  + Show Dialog
    + For testing purposes, set to `true` so that user has to approve of application each time
    + For practical purposes, set to `false` (or just don't include this as part of the query cause this is the default value)
+ Create and open up authorization URL
+ Let user authenticate and approve of application

## Generating Queue

+ Get all of user's playlists via `/v1/me/playlists`
+ Let user select playlist to play
+ Retrieve all songs (100 at a time if we're limited) from that playlist
+ Generate a playlist given those songs
  + Account for shuffling (use a randomizer)
  + Account for repeat mode
    + None: don't repeat
    + 1: repeat same song
    + otherwise: repeat entire playlist
    ```text
    # Repeat shuffled as played before
    A -> C -> B -> D -> A -> C- > B -> D -> ...
    ```
  + Implement using a circular, doubly linked list
