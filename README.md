# Public Spotify Queue

## Requirements

+ [nodejs](https://nodejs.org/en/)
+ [npm](https://www.npmjs.com/)
+ [A Spotify developer application](https://developer.spotify.com/dashboard/)

## Instructions

**Note:** Currently only works on local servers

1. Create a Spotify Developer Application [here](https://developer.spotify.com/dashboard/)
2. Register `http://localhost:3000` or `http://127.0.0.1:3000` as a redirect URI in your application
3. Clone or download and extract this repo
4. Run `npm install` to get the dependencies
5. Store your application's id and secret credentials into a file called `production.conf`
	```bash
	# production.conf
	clientId=foobar
	clientSecret=bazqaz
	```
6. Run `npm start`*
7. Go to http://localhost:3000 (or whatever address you registered)
8. After the page loads, click the `Authorize` button. Should be straight forward from this point
    + If the authorization was not complete, make sure you actually authorize the application and
      you don't take too long to authorize it (read the [authorization process](#auth-proc) to see
      why)
    + Try clearing your cookies (just for this local domain)
    + If there is still an issue authorizing, open an issue with any console output, steps taken to
      reproduce the issue, as well as your web browser, version, and any command line arguments you
      used (excluding your Spotify application credentials)

## <a id="npm-scripts"></a> Additional NPM Scripts

There are a couple of other npm scripts that you can run:
+ `clean`: cleans the project directory, removing build files and temporary files. See the `gulp`
script for it's implementation
+ `build`: builds the project, bundling jsx and styles into their own, respective files
+ `dev`: development script that watches both frontend and backend source directories. Watched
directories and files include:
	+ `src/`
	+ `public/`
	+ `parcel.config.js`
	+ `.babelrc`
+ `start`: runs the application as if it were in production mode
+ `test`: runs all test scripts, as specified by the `gulp` script

## <a id="arguments"></a> Command Line Arguments

There are five arguments, two of which are required:

+ `i|clientId <string>` the Spotify application client id
+ `s|clientSecret <string>` the Spotify application client Secret
+ `d|domain [string]` the domain of the server (defaults to `http://localhost`)
+ `p|port [integer]` the port of the server (defaults to `3000`)
+ `c|config [file path]` reads in the arguments listed above from a given configuration file

You can specify arguments via the command line, a configuration file, with each line formatted as
`argument=value`, or with environment variables,
named below:

+ `CLIENT_ID`
+ `CLIENT_SECRET`
+ `DOMAIN`
+ `PORT`

The priority order is command line, configuration file, and lastly environment variables. That is,
arguments specified via the command line always override config files and environment variables, and
configuration files always override environment variables.

## <a id="auth-proc"></a> Authorization Process

1. Use a cookie to store the current state of the client (that lives for 5 minutes because user should not take more than 5 minutes to authorize); state is randomly generated every 5 minutes
2. Authorization is opened from client-side (triggered from some event like a button), with a state passed through.
3. After authorization and redirection takes place, the state is then verified to make sure it hasn't changed; it can change or be different than what the cookie says based on two conditions:
	+ User takes longer than 5 minutes to authorize
	+ User attempts to go to post-auth redirection page without actually authorizing
4. `code` query parameter returned in redirection URL is sent to backend
5. Backend retrieves an access token, sends all relevant data back
6. Perform any Spotify API calls necessary.

## Tests

Run `npm test` to execute all the tests. All tests use the [mocha.js](https://mochajs.org/) unit
testing framework.

These tests don't require a valid client id or secret provided by a Spotify developer application. Instead, a local server loosely mocks what Spotify's API endpoints would perform, which `src/server.js` communicates with.

## Files

+ [deprecated/](./deprecated/) contains old, deprecated code for the "public queue" idea, currently being refactored
+ [design/](./design/) contains design docs for most of the implemented/future features for the project
+ [docs/](./docs/) contains documentation for the source code useful for development.
	+ [rest/](./design/rest/) RESTful API documentation for `server.js`
+ [src/](./src/) contains main source code
	+ [jsx/](./src/jsx/) contains frontend code
		+ [components/](./src/jsx/components) contains React Components
		+ [props/](./src/jsx/props) contains the properties for each React Component
		+ [control.js](./src/jsx/control.js) frontend scripting and communicates with backend server
		+ [index.jsx](./src/jsx/index.jsx) entry point
	+ [node/](./src/node/) contains backend code
		+ [server.js](./src/server.js) the backend server; it hosts the website, controls authorization and access token retrieval processes
		+ [skiplist.js](./src/skiplist.js) skiplist implementation, used internally on the server
		+ [utils.js](./src/utils.js) small set of utility functions
		+ [index.js](./index.js) what `npm` uses to start the server
	+ [styles/](./src/styles/) contains styling code for the frontend
+ [test/](./test/) contains files used for testing
