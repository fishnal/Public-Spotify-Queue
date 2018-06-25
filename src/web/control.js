// Generates a random string, converts a random decimal to base 36,
// and discards the "0." from the beginning
// amt represents how many times this is done (results concatenated)
function randString(amt) {
	var str = "";
	for (var i = 0; i < amt; i++) {
		str += Math.random().toString(36).substring(2);
	}
	return str;
}

function getParameterByName(name, url) {
	// https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
	if (!url) {
		url = window.location.href;
	}

	name = name.replace(/[\[\]]/g, "\\$&");
	let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
	let results = regex.exec(url);

	if (!results) return null;
	else if (!results[2]) return '';
	else return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// server information
const SERVER_PORT = 3000;
const HOST = `http://127.0.0.1:${SERVER_PORT}`;
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

// dummy function so console doesn't complain about it not being defined
window.onSpotifyWebPlaybackSDKReady = () => {};

$(document).ready(() => {
	// retrieve state and any active tokens from cookies
	let state = Cookies.get("state");
	let tokens = {
		access: Cookies.get("access_token"),
		refresh: Cookies.get("refresh_token")
	};

	// code only becomes defined when we are redirected from authorization
	// (assuming state has been verified)
	let code = getParameterByName("code");
	let error = getParameterByName("error");
	let queryState = getParameterByName("state");

	if (queryState && (!tokens.access || !tokens.refresh)) {
		// state was returned in query, verify it matches the one in the cookie
		if (queryState != state) {
			// bad query state (either previous state expired or it just doesn't match)
			$("body").append(
				$("<p>Bad state</p>")
				.css("background-color", "red")
			);
		} else {
			if (error) {
				$("body").append(
					$(`<p>Error in authorizing this application:\n\t${error}</p>`)
					.css('background-color', 'red')
				);
			} else {
				// use code from query to get access token
				$.get(`/token?code=${code}`, (tokenData) => {
					if (tokenData["status_code"] != 200) {
						// request isn't good if status code isn't 200
						$("body").append(
							$(`<p>Couldn't get access token (code ${tokenData["status_code"]})\n\
								Error: ${tokenData["error_description"]}</p>`)
							.css("backgorund-color", "red")
						);
					} else {
						// store access and refresh tokens in cookies
						// refresh token cookie expires in 365 days (1 year), so users don't have to
						// reauthorize again (unless they logout)
						Cookies.set(
							"refresh_token",
							tokens.refresh = tokenData["refresh_token"],
							{ expires: 365 }
						);
						// access token expires in (tokenData["expires_in"] - 120 seconds) (just to be safe)
						Cookies.set(
							"access_token",
							tokens.access = tokenData["access_token"],
							{ expires: (tokenData["expires_in"] - 120) / 86400 }
						);
						window.location.replace(`${HOST}/`);
					}
				});
			}
		}
	}

	if (!tokens.refresh) {
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
		$("body").append(
			$("<p>You need to authorize this application first to use it.\n\
				Click the button below to do so.</p>")
		);
		let authBtn = $("<button>");
		authBtn.click((event) => {
			// only handle left clicks
			if (event.button == 0) {
				let authURL = "https://accounts.spotify.com/authorize"
					+ `?client_id=${CLIENT_ID}`
					+ "&response_type=code"
					+ `&redirect_uri=${HOST}/`
					+ `&state=${state}`
					+ `&scope=${SCOPES.join("%20")}`
					+ `&show_dialog=false`;

				// go to authorization page
				window.location.href = authURL;
			}
		});
		authBtn.text("Authorize");
		$("body").append(authBtn);
	} else if (!tokens.access) {
		// there's a refresh, but no access token, so get another one
		$.get(`/refresh?refresh_token=${tokens.refresh}`, (tokenData) => {
			if (tokenData["status_code"] != 200) {
				// request isn't good if status code isn't 200
				$("body").append(
					$(`<p>Couldn't refresh access token (code ${tokenData["status_code"]})\n\
						Error: ${tokenData["error_description"]}</p>`)
					.css("backgorund-color", "red")
				);
			} else {
				// store access and refresh tokens in cookies
				// access token expires in (tokenData["expires_in"] - 120 seconds) (just to be safe)
				Cookies.set(
					"access_token",
					tokens.access = tokenData["access_token"],
					{ expires: (tokenData["expires_in"] - 120) / 86400 }
				);
				window.location.replace(`${HOST}/`);
			}
		});
	} else {
		// only here if we have all tokens

		$("body").append(
			$("<p>Application authenticated!</p>")
			.css("background-color", "green")
		);

		window.onSpotifyWebPlaybackSDKReady = () => {
			$("body").append(
				$("<p>Spotify Web Playback SDK ready!</p>")
				.css("background-color", "green")
			)

			let player = new Spotify.Player({
				name: "Public Spotify Queue Player",
				getOAuthToken: (cb) => {
					cb(tokens.access);
				}
			});

			let errors = [
				"initialization_error",
				"authentication_error",
				"account_error",
				"playback_error"
			];

			errors.forEach((error) => {
				player.addListener(error, (message) => {
					message = JSON.stringify(message);
					console.log(`${error}: ${message}`);
					$("body").append(
						$(`<p>${error}: ${message}</p>`)
						.css("background-color", "red")
					);
				});
			});

			player.addListener("player_state_changed", (state) => {
				console.log(state);

				let mins = Math.floor(state.position / 60000);
				let secs = Math.floor((state.position - mins * 60000) / 1000);
				let time = sprintf("%d:%02d", mins, secs);
				$("body").append(
					$(`<p>${state.track_window.current_track.name} (${time})</p>`)
				);
			});

			player.connect(() => {
				$("body").append(
					$("<p>Local player connected</p>")
					.css("background-color", "green")
				)
			});
		};
	}
});
