/**
 * Generates a random string, converts a random decimal to base 36, and discards the "0." from the
 * beginning amt represents how many times this is done (results concatenated).
 *
 * @param {number} amt the number of times to repeat the process.
 * @returns {string} the random string.
 */
function randString(amt) {
    let str = "";

    for (let i = 0; i < amt; i++) {
        str += Math.random().toString(36).substring(2);
    }

    return str;
}

/**
 * Gets a URL's query parameter's value by it's key/name.
 *
 * @param {string} name the parameter name
 * @param {string} url the url to parse
 * @returns {string} the value of the parameter's value; null if not found
 */
function getParameterByName(name, url) {
    // https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
    if (!url) {
        url = window.location.href;
    }

    name = name.replace(/[[\]]/g, "\\$&");
    let regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
    let results = regex.exec(url);

    if (!results) {
        return null;
    } else if (!results[2]) {
        return '';
    }

    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * Returns true if the argument is a literal boolean, the string "true",
 * or the number 1
 *
 * @param {boolean|string|number} arg the argument to check
 * @returns {boolean} true if arg satisfies any of the above conditions
 */
function toBoolean(arg) {
    return arg === true || arg === "true" || arg === 1;
}

// server information
const SERVER_URL = window.location.origin;
// Spotify App Client Id
const CLIENT_ID = "acd0f18a3e124101af31f9b3582130c6";
// scopes required for controlling playback and streaming
// thru Spotify API
const SCOPES = [
    "streaming",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-read-birthdate",
    "user-read-email",
    "user-read-private"
];

$(document).ready(() => {
    // status indicators:
    // 1 - bad state
    // 2 - couldn't authorize
    // 3 - couldn't get tokens
    // 4 - couldn't refresh
    let statusCode = 0;
    // retrieve state and any active tokens from cookies
    let state = Cookies.get("state");
    // tokens variable will not be used in making API calls, because the cookie could expire
    let tokens = {
        access: Cookies.get("access_token"),
        refresh: Cookies.get("refresh_token"),
        psq: Cookies.get("psq_token")
    };

    // code only becomes defined when we are redirected from authorization
    // (assuming state has been verified)
    let code = getParameterByName("code");
    let error = getParameterByName("error");
    let queryState = getParameterByName("state");

    // Gets another access token using an existing and valid refresh token
    // options parameter supports the following keys:
    //     replace: if true, then replaces the window with the homepage (does not go through any other
    //        callback functions)
    //    cb: callback function for when the refresh request succeeds (sends the response data back
    //        after processing it
    //    err: callback function for when the refresh request fails (sends the response data back
    //        after processing it)

    /**
     * Refreshes/retrieves another access token using an existing refresh token asynchronously.
     *
     * @param {string} psqToken the refresh token to use
     * @param {object} options additional options
     * @returns {void}
     */
    function refresh(psqToken, options) {
        $.post(`/refresh?psq_token=${psqToken}`, (tokenData) => {
            if (tokenData.status_code && tokenData.status_code !== 200) {
                // request isn't good if status code isn't 200
                statusCode = 4;
                $("#user-control").append(
                    $(`<p>Couldn't refresh access token (code ${tokenData.status_code})\n\
                        Error: ${tokenData.error_description}</p>`)
                        .css("backgorund-color", "red")
                );

                if (options.err instanceof Function) {
                    options.err(tokenData);
                }
            } else {
                // store access and refresh tokens in cookies
                // access token expires in (tokenData["expires_in"] - 120 seconds)
                let accessExpireTime = tokenData.expires_in - 120;

                Cookies.set(
                    "access_token",
                    tokens.access = tokenData.access_token,
                    { expires: accessExpireTime / 86400 }
                );

                Cookies.set(
                    "psq_token",
                    tokens.psq = tokenData.psq_token,
                    { expires: 365 }
                )

                if (toBoolean(options.replace)) {
                    window.location.replace(`${SERVER_URL}/`);
                } else if (options.cb instanceof Function) {
                    options.cb(tokenData);
                }
            }
        });
    }

    if (queryState && (!tokens.access || !tokens.refresh)) {
        Cookies.remove("state");
        // state was returned in query, verify it matches the one in the cookie
        if (state && queryState !== state) {
            // bad query state (either previous state expired or it just doesn't match)
            statusCode = 1;
            $("#user-control").append(
                $("<p>Bad state</p>").css("background-color", "red")
            );
            $("#user-control").append(
                $("<button>Retry</button>").click((event) => {
                    if (event.button === 0) {
                        window.location.replace(`${SERVER_URL}/`);
                    }
                })
            );
        } else if (error) {
            statusCode = 2;
            $("#user-control").append(
                $(`<p>Error in authorizing this application:\n\t${error}</p>`)
                    .css('background-color', 'red')
            );
        } else {
            // use code from query to get access token

            $.get(`/token?code=${code}`, (tokenData) => {
                if (tokenData.status_code && tokenData.status_code !== 200) {
                    // request isn't good if status code isn't 200
                    statusCode = 3;
                    $("#user-control").append(
                        $(`<p>Couldn't get access token (code ${tokenData.status_code})\n'` +
                        `Error: ${tokenData.error_description}</p>`)
                            .css("backgorund-color", "red")
                    );
                } else {
                    // store access and refresh tokens in cookies

                    // refresh token cookie expires in 365 days (1 year), so users don't
                    // have to reauthorize again (unless they logout)
                    Cookies.set(
                        "refresh_token",
                        tokens.refresh = tokenData.refresh_token,
                        { expires: 365 }
                    );

                    // access token cookie expires 4 minutes before the actual token
                    Cookies.set(
                        "access_token",
                        tokens.access = tokenData.access_token,
                        { expires: (tokenData.expires_in - 240) / 86400 } // converting to days
                    );

                    // psq token cookie expires in 365 days (same reason as refresh token)
                    Cookies.set(
                        "psq_token",
                        tokens.psq = tokenData.psq_token,
                        { expires: 365 }
                    );

                    // go to main page, clears up any query parameters present in URL
                    window.location.replace(`${SERVER_URL}/`);
                }
            });
        }
    }

    if (statusCode) {
        console.log(`status=${statusCode}`);
    } else if (!tokens.refresh) {
        // since there is no refresh token, user must authorize again so we can get one

        if (!state) {
            // no state in cookies
            // make one and make it expire in 5 minutes
            Cookies.set(
                "state",
                state = randString(4),
                { expires: 5 / 1440 }
            );
        }

        // present an authorization button
        // when clicked, it'll start authorization process
        $("#user-control").append(
            $("<p>You need to authorize this application first to use it.\n" +
                "Click the button below to do so.</p>")
        );

        let authBtn = $("<button>");

        authBtn.click((event) => {
            // only handle left clicks
            if (event.button !== 0) {
                return;
            }

            let authURL = "https://accounts.spotify.com/authorize" +
                `?client_id=${CLIENT_ID}` +
                "&response_type=code" +
                `&redirect_uri=${SERVER_URL}` +
                `&state=${state}` +
                `&scope=${SCOPES.join("%20")}` +
                `&show_dialog=false`;

            // go to authorization page
            window.location.href = authURL;
        });
        authBtn.text("Authorize");
        $("#user-control").append(authBtn);
    } else if (!tokens.access) {
        // there's a refresh, but no access token, so get another one
        refresh(tokens.psq, {
            replace: true,
            err: (req) => {
                $("#user-control").append(
                    $("<p>Couldn't start the application, see the console for details</p>")
                );
                console.log("Couldn't refresh the access token");
                console.log(req);
            }
        });
    } else {
        // only here if we have all tokens
        let spotifyApi = new SpotifyWebApi();

        spotifyApi.setAccessToken(tokens.access);

        $("#user-control").append(
            $("<p>Application authenticated!</p>").css("background-color", "green")
        );

        // starts/stops recording playback state
        let recorderBtn = $("<button>Start recording</button>");
        // displays a simplified playback state
        let recorderText = $("<p>Not recording.</p>");
        // whether or not we're processing playback state; this is used to avoid the
        // current track progress from being displayed after the user requested to
        // stop recording
        let processingCurrentTrack = false;
        // responsible for the current playing track interval
        let currentTrackRecorder = null;
        // approx interval time to get current playing track
        let getInfoIntervalTime = 1000;
        // gets the current playing track
        let getCurrentTrack = () => {
            if (!Cookies.get("access_token")) {
                // access token cookie expired, time to get a new access token
                refresh(tokens.psq, {
                    cb: (req) => {
                        spotifyApi.setAccessToken(tokens.access);
                        // immediately get current track info, because maybe we lost time while we
                        // were waiting for the access token to be refreshed
                        getCurrentTrack();
                        currentTrackRecorder = setInterval(getCurrentTrack, getInfoIntervalTime);
                    },
                    err: (req) => {
                        $("#user-control").append(
                            $("<p>An error occurred, see the console for details</p>")
                        );
                        console.log("Couldn't refresh the access token");
                        console.log(req);
                    }
                });
            } else {
                // in the case where the access token cookie expires after the above check, we can
                // still make a valid request with the current token in tokens.access because the
                // cookie expires 4 minutes earlier than the actual access token

                // processing current track
                processingCurrentTrack = true;

                spotifyApi.getMyCurrentPlayingTrack().then((stateData) => {
                    let time = stateData["progress_ms"];
                    // get mins and secs from ms time
                    let mins = parseInt(time / 60000);
                    let secs = parseInt((time - mins * 60000) / 1000);
                    let track = stateData["item"];

                    // record track name and time elapsed in song
                    recorderText.text(sprintf("%s - [%d:%02d]", track.name, mins, secs));
                }).catch((err) => {
                    // TODO handle errors through error_handler#handleSpotifyError(req)
                    recorderText.text("Couldn't get playback state, see console for details");
                    console.log(err);
                }).finally(() => {
                    // no longer processing playback state
                    processingCurrentTrack = false;
                });
            }
        };

        // html attribute indicating whether or not
        // we're recording the playback state
        recorderBtn.attr("is-recording", "false");
        recorderBtn.click((event) => {
            if (event.button === 0) {
                // are we currently recording the current track progress?
                let isRecording = toBoolean(recorderBtn.attr("is-recording"));

                // flip the is-recording attribute, since we
                // already have the original value
                recorderBtn.attr("is-recording", !isRecording);

                // if it's currently recording, stop the interval
                if (isRecording) {
                    // stop recording the state
                    clearInterval(currentTrackRecorder);
                    // wait for the current track to finish being processed
                    let tmp = setInterval(() => {
                        if (!processingCurrentTrack) {
                            // current track has been processed
                            clearInterval(tmp);
                            recorderBtn.text("Start recording");
                            recorderText.text("Not recording");
                        }
                    }, 100);
                } else {
                    recorderBtn.text("Stop recording");
                    recorderText.text('Connecting...');
                    // get the current track progress right now, then start the interval
                    getCurrentTrack();
                    // record the current track progress every set amt of ms
                    currentTrackRecorder = setInterval(getCurrentTrack, getInfoIntervalTime);
                }
            }
        });

        // add elements to display
        $("#user-control").append(recorderBtn);
        $("#user-control").append(recorderText);
    }
});
