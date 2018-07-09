# Public Spotify Queue

## Requirements

fishnal/Public-Spotify-Queue@aea4cbed1798963c793239f0b8db04fc0d81bacd

+ [nodejs](https://nodejs.org/en/)
+ [npm](https://www.npmjs.com/)
+ [A Spotify developer application](https://developer.spotify.com/dashboard/)

## Instructions

**Note:** Currently only works on local servers (though could easily be moved to a remote server)

1. Create a Spotify Developer Application [here](https://developer.spotify.com/dashboard/)
2. Register `http://127.0.0.1:3000` as a redirect URI in your application
3. Clone or download and extract this repo
4. Run `npm install` to get the dependencies
5. Run `node server.js CLIENT_ID CLIENT_SECRET`, passing in your application's id and secret credentials as command line arguments
	+ Alternatively, you can set environment variables for the `CLIENT_ID` and `CLIENT_SECRET` instead of passing in arguments
6. Go to http://127.0.0.1:3000
7. After the page loads, click the `Authorize` button. Should be straight forward from this point
	+ If the authorization was not complete, make sure you actually authorize the application and you don't take too long to authorize it (read the [authorization process](#auth-proc) to see why)
	+ Try clearing your cookies (just for this local domain)
	+ If there is still an issue authorizing, open an issue with any console output, steps taken to reproduce the issue, as well as your web browser and version.

## <a id="auth-proc"></a> Authorization Process

1. Use a cookie to store the current state of the client (that lives for 5 minutes because user should not take more than 5 minutes to authorize); state is randomly generated every 5 minutes
2. Authorization is opened from client-side (triggered from some event like a button), with a state passed through.
3. After authorization and redirection takes place, the state is then verified to make sure it hasn't changed; it can change or be different than what the cookie says based on two conditions:
	+ User takes longer than 5 minutes to authorize
	+ User attempts to go to post-auth redirection page without actually authorizing
4. `code` query parameter returned in redirection URL is sent to backend
5. Backend retrieves an access token, sends all relevant data back
6. Perform any Spotify API calls necessary.

## Files

+ `server.js` is the backend server; it hosts the website, controls authorization and access token retrieval processes
+ `control.js` is frontend scripting and communicates with backend server
+ `index.html` is the homepage, likely to change
+ `favicon.ico` is the website icon (temporary at the moment)
+ `deps/` contains any dependencies that are needed for the frontend (will port to some sort of frontend package manager like Yarn)
+ `src/core/` contains core code for the "public queue" idea, currently being refactored
	+ The `master` branch has a better organization for the core, and can be tested (though it is poorly documented). The `localdev` branch isn't reliable since it's constantly changing, involving the core being changed and moved around to work with the project's new approach
+ `package.json` and `package-lock.json` are for npm management
