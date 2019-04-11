/**
 * The asynchronous controller manages how multiple components request data from Spotify.
 * Whenever a Spotify request is made, we first check if the access token cookie still exists. If it
 * doesn't, then (a) cookies were cleared and/or (b) the access token expired. In the worst case,
 * we assume that the access token expired, which calls for us to refresh the tokens, which is a
 * trivial process.
 *
 * Let two components, A and B, each request some data from Spotify. Let rA and rB be A's and B's
 * request, respectively. rA and rB each undergo the cookie-existence check. If the cookie doesn't
 * exist, then one of the requests will start a refresh call. Say rA gets to the check before rB.
 * Then rA will initiate the refresh process, which is asynchronous. rB may be given the chance to
 * execute (since rA is awaiting an asynchronous response), in which case rB may also see the cookie
 * doesn't exist, and initiate another refresh process.
 *
 * rA's refresh now completes, updating the cookies and tokens accordingly. Note when the refresh
 * process responds, Spotify has changed this client's access token on it's servers. So now only
 * this new access token can be used. rA now makes it's request to Spotify and waits.
 * Say rB's refresh also completes, and updates the cookies and tokens. Therein lies the issue.
 * Spotify now has a different access token associated with this client, which can conflict with
 * rA's request (since rA made the request with a different token). rB may make it's request
 * normally, but rA may fail, which is not what should be happening.
 *
 * Step in the asynchronous controller (AC). The AC will place each request into a queue.
 * Specifically, if two components make a request, then A will be allowed to initiate it's request
 * process (cookie-existence check, refresh process if needed, spotify request, etc), while B must
 * wait for A to finish it's entire request process. This way, two refresh processes won't occur at
 * the same time, preventing the data-race issue with access tokens.
 *
 * @param {Function} refresher function that refreshes tokens when needed
 * @param {Function} refreshChecker syncrhonous function that checks if a refresh is needed
 */
function AsyncController(refresher, refreshChecker) {
  let active = false;
  let queue = [];

  /**
   * Attempts to start the next promise. If a promise is currently running, then the next promise
   * in queue must wait for the current one to finish.
   */
  function nextPromise() {
    if (!active) {
      queue.shift()();
    }
  }

  /**
   * Adds a promise to the queue.
   *
   * @param {Function} reqFunc a function that returns a promise
   * @param {Object} thisArg context object for the request function
   * @param {Array} reqArgs an array of arguments that are applied to the request function
   * @return {Promise<any>} a promise that resolves/rejects when the requesting function
   * resolves/rejects.
   */
  this.enqueue = function(reqFunc, thisArg, reqArgs) {
    reqArgs = reqArgs || [];
    return new Promise((callerResolve, callerReject) => {
      const wrapFunc = async function() {
        try {
          // Indicate a promise is currently pending
          active = true;

          // Refresh if needed
          if (refreshChecker()) {
            try {
              await refresher();
            } catch (err) {
              // Indicate that it was a refresh error
              err.isRefreshErr = true;
              throw err;
            }
          }

          // Start the promise now
          let promise = reqFunc.call(thisArg, ...reqArgs);
          if (!(promise instanceof Promise)) {
            // Request function didn't return a promise
            throw new TypeError(`expected function to return Promise, instead got ${promise.constructor.name}`);
          }
          callerResolve(await promise);
        } catch (err) {
          // Trying to start the promise failed or the promise itself failed
          callerReject(err);
        }

        active = false;

        // Regardless of whether or not the promise resolves or rejects, we must start the next
        // promise in queue.
        if (queue.length > 0) {
          queue.shift()();
        }
      }

      queue.push(wrapFunc);
      nextPromise();
    });
  }
}

module.exports = AsyncController
