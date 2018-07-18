# Requests

**NOTE** all Spotify API requests are done by the client

While the main goal is to synchronize the listeners with the host, we need to be wary of:

+ How many requests are made
+ How much data is sent in each request

## Syncing the playback

In order to sync the playback, the host must request where they are in the current playing track (via [`/v1/me/player/currently-playing`](https://developer.spotify.com/documentation/web-api/reference/player/get-the-users-currently-playing-track/)) and send that to the server. This is done repeatedly.

The listener must request where the host is currently at in their current playing track. In order to get this data, they must request the server. Once the listener acquires where the host is, they request Spotify to seek the position in the current playing track (via [`/v1/me/player/seek`](https://developer.spotify.com/documentation/web-api/reference/player/seek-to-position-in-currently-playing-track/)). This is done repeatedly.

If we want the best synchronization, we basically have very small delays for each constant request (something like 100ms or even 50ms). The issue with this is that the Spotify API has rate limiting, and it will refuse our requests if we make too many in a short period of time. Because of this, the delay between each request will be around 1000ms.

When the host starts their session, they immediately request their current playing song (provides us what the track name is and where they are in the song), and request it again every ~1000ms. For each fulfilled request, the host client sends this information to the server. The server then updates this information in it's database for each request it receives from the host client. When a listener joins, they immediately request the host's current song via the server. After the listener retrieves this information, they request Spotify to make changes to their (the listener's) playback so it can sync up with the host. The listener repeats this every ~1000ms as well. This will leave about a ~1000ms latency between the listeners and the host. When the host moves around in the song, it'll take the listener about ~1000ms to receive that change.

Because of these two Spotify API endpoints, we can't really control how much data is sent in each request, so that's not an issue here.

## Updating queue information

To modify the queue:

1. The host must make a request to the server indicating what changes to make (removal, additions, etc)
2. Server processes requests, and responds with data indicating what changes were made to the queue
3. Host then processes the server's response as such:
	1. Updates visual queue display (so any added/removed songs will be shown properly)
	2. Request the `/v1/me/player/currently-playing` endpoint to get their most recent position in the current song (this information will not be sent to the server)
	3. Request the PUT [`/v1/me/player/play`](https://developer.spotify.com/documentation/web-api/reference/player/start-a-users-playback/) endpoint to update their queue, and additionally pass in the current playing song (this will reset the position to 0ms)
	4. Because the song restarted, we move back to where we were (via `/v1/me/player/seek`) from using the info we got from the previous `/v1/me/player/currently-playing` request

The third main step is the most problematic. This could cause a repeat in the playback, where the host (and potentially listeners) hear the same part of the song twice. Assume the following

+ Two latencies: one between the host and the Spotify API servers, and another between the host and this server. Each are 500ms.
+ Client-side operations are negligble
+ All requests, both to this server and to Spotify API servers, are fulfilled

1. Say the host is at time 1000ms in the song when they request the server to change their queue (host now at 1500ms).
2. Host quickly processes server's response (0ms from the client-side operation assumption)
3. Host requests current playing track info to get most recent position in song
4. Host sees that it's at 1500ms (which is accurate for this scenario)
5. Host requests to update queue via `/v1/me/player/play`. Since these requests take 500ms to finish, the host is at 2000ms before this request is fulfilled and it resets the host's playback to the beginning of the song (0ms).
6. Host requests to move song back to where they last were via `/v1/me/player/seek`, which was recorded as 1500ms.

This causes a repeat of the 1500ms mark in the song, which can sound odd and be mildly infuriating. A solution would be when the host requests `/v1/me/player/currently-playing` (record song position into `song_pos`, the host can also record the time via `Date.now()` (say it's in variable `before_req`). When the host gets to the `/v1/me/player/seek` request, they can approximate how much time has elapsed through `Date.now() - before_req`. They can then add this difference to `song_pos`, and pass it to the `/v1/me/player/seek` request.

However, there are scenarios where `song_pos` can be close to the end (or even exactly at the end). When we try to approximate how much time has elapsed through our requests and operations, `song_pos` could end up being greater than the actual duration of the song. When we request to seek to an out of bounds position (negatives don't count cause Spotify rejects them), Spotify will just start the song at the beginning. We don't really want this happening, so instead, we can just seek to the very end of the song, that way the next song will start.

Addressing the two efficiency questions, they actually end up being the same question when it comes to updating the queue. We should only update the queue on Spotify's serverse when we change the queue. This will limit how many times we request the `/v1/me/player/play` endpoint, as well as minimize how much data we're sending (the queue can be large in size when we have more and more songs).
