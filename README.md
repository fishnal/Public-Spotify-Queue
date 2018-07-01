# Public Spotify Queue

## Instructions

**Note:** Currently only works on local servers (though could easily be moved to a remote server)

1. Create a Spotify Developer Application [here](https://developer.spotify.com/dashboard/)
2. Register `http://127.0.0.1:3000` as a redirect URI in your application
3. Run `node server.js CLIENT_ID CLIENT_SECRET`, passing in your application's id and secret credentials as command line arguments
4. Go to http://127.0.0.1:3000
5. After the page loads, click the `Authorize` button. Should be straight forward from this point. If the authorization was not complete, make sure you actually authorize the application and you don't take too long to authorize it (read the [authorization process](#auth-proc) to see why)
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

+ `server.js` is backend server code, hosts the website, controls authorization and access token retrieval process
+ `*.html` is frontend HTML code, likely to change
