# Host Design

## Actions

+ [Modify current playing song's playback state](#playback-control-area)
	+ Pause/play
	+ Seek forward/backward (default 5 seconds, customizable in settings)
	+ Skip forward/backward
	+ Change repeat mode (off, single track, context/queue)
	+ Change the song entirely (should update with the queue)
+ [See who's listening along and broadcast who's listening along](#listeners-area)
	+ List of listeners can be hidden
	+ `public`: everyone sees everyone, including names and links to their Spotify profiles (host always has this information)
	+ `count-only`: everyone sees how many people are listening along
	+ `private`: only host sees who's listening along
+ [Modify queue](#queue-area)
	+ Clear the entire queue
	+ Add songs (batch removal supported)
	+ Remove songs (batch removal supported)
	+ **Note**: can't be modified if the context is null, in which case the queue is effectively disabled
+ [Handle song requests](#song-requests-area)
	+ `public`: everyone can see requests, including who requested it
	+ `songs-only`: everyone can see just the requests
	+ `private`: only host can see the requests (displayed as "requests are private")
	+ `closed`: host isn't taking any song requests
	+ Can be hidden

## <a id="playback-control-area"></a>Playback Control Area

+ Horizontal box containing
	+ Song information
	+ Album artwork (can be toggled)
	+ Playback controls
	+ Volume control
+ Song information in a vertical box
	+ Song name
	+ Artists (comma separated)
	+ Both scroll if too long (fixed display size)
	+ Both are hyperlinks (link style displayed on hover)
		+ Song links to album page
		+ Artist links to their page
+ Playback controls in a horizontal box
	+ Seek backward (default 5 seconds)
	+ Skip backward
	+ Pause/play
	+ Skip forward
	+ Seek forward (default 5 seconds)
	+ Repeat Mode (disabled if context is null)
	+ Progress bar for song position
+ Volume Control
	+ Draggable progress bar? (not sure what would be best for this yet)
+ Must be visible at all times

## <a id="listeners-area"></a>Listeners Area

+ Vertical box containing
	+ Dropdown menu for broadcast option
	+ List of listeners
+ Dropdown menu
	+ Includes `public`, `count-only`, and `private`
+ List of listeners
	+ Scrollable
	+ Profile pictures can be toggled (small circle to the left of the names)
	+ Names are hyperlinks (link style displayed on hover) to their Spotify profiles
+ Can be minimized

## <a id="queue-area"></a>Queue Area

+ Simply shows what songs are going to be played next
+ Right click on a song to show a menu
	+ Song Preview (popup, disabled if not available) [[preview](song_preview_popup.png)]
	+ Song information (popup) [[preview](song_info_popup.png)]
		+ Album artwork
		+ Album type
		+ Song name
		+ Album name
		+ Artists
		+ Duration
		+ Release Date (has to be retrieved from the album object)
	+ Add song before or after (input song URI or song link, likely to be more expansive)
	+ Remove song
+ Double left-click on a song to play it (removes all songs before it from the queue)
+ Can be minimized

## <a id="song-requests-area"></a>Song Requests Area

+ Vertical box containing
	+ Dropdown menu for broadcast option
	+ List of requested songs
+ Dropdown menu
	+ Includes `public`, `songs-only`, `private`, and `closed`
+ List of requested songs
	+ Shows who requested it on the right hand side
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
	+ When `closed`, can't be minimized and displays a message saying "You aren't open for song requests"
