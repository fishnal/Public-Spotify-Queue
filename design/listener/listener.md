# Listener Design

## Actions

+ [View current playing song's playback state](#playback-control-area)
	+ **Cannot** perform any modifiable actions
+ [See who's listening along](#listeners-area)
	+ Can see names if host makes it `public`
	+ Can see number of people if host makes it `count-only`
	+ Can't see anything if host makes it `private`, which displays some message (what's the message?)
+ [View the queue](#queue-area)
	+ Can see what songs are up next
	+ Can see if a queued song was originally a requested song (by highlight, but what color?)
+ [Handle song requests](#song-requests-area)
	+ Request a song by
		+ Inputting it's song URI or song link
		+ Searching for it
	+ Cancel pending requests
	+ Once a requested song has been accepted, there's no going back

## <a id="playback-control-area"></a>Playback Control Area

+ Listeners can only *view* the position of the song, they **cannot** change it, nor change the song
+ Listeners can, however, control the volume of their playback

## <a id="listeners-area"></a>Listeners Area

+ Simple, scrollable list of listeners
+ Profile pictures are shown to the left of the name (if host broadcasts listeners as `public`)
	+ Clicking on the name opens their Spotify profile
+ Can be minimized (so long as host's broadcast is not `private`)

## <a id="queue-area"></a> Queue Area

+ Simple, scrollable list of songs that are in the queue
+ Right-click on a song to show a menu
	+ Song Preview (popup, disabled if not available) [[concept preview](song_preview_popup.png)]
	+ Song information (popup) [[concept preview](song_info_popup.png)]
		+ Album artwork
		+ Album type
		+ Song name
		+ Album name
		+ Artists
		+ Duration
		+ Release Date (has to be retrieved from the album object)
+ Can be minimized

## <a id="song-requests-area"></a>Song Requests Area

+ List of requested songs
	+ Only shown if broadcast level is at least `songs-only`
	+ If host makes it `public`, shows who requested it on the right hand side
		+ Displayed in either
			+ Table-like format
			+ Underneath song name in smaller text
		+ Toggle to display the name/person who requested it
		+ Toggle to display profile pictures
	+ Right click on a song to show a menu
		+ Song preview (same as above)
		+ Song information (same as above)
	+ Right of the song, display reject (no-entry symbol) and accept (checkmark or add symbol) options
	+ Can be minimized
	+ When `closed`, can't be minimized and displays a message saying "Host isn't taking any requests"
