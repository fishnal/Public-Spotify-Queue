define({ "api": [
  {
    "type": "get",
    "url": "/",
    "title": "Requests the home page.",
    "name": "GetHome",
    "group": "Client",
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -i http://localhost:3000/",
        "type": "curl"
      }
    ],
    "version": "1.0.0",
    "filename": "src/server.js",
    "groupTitle": "Client"
  },
  {
    "type": "get",
    "url": "/index.html",
    "title": "Redirects to /",
    "description": "<p>Redirects to the home page</p>",
    "name": "GetIndex",
    "group": "Client",
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -i http://localhost:3000/index.html",
        "type": "curl"
      }
    ],
    "version": "1.0.0",
    "filename": "src/server.js",
    "groupTitle": "Client"
  },
  {
    "type": "post",
    "url": "/queue/add_after",
    "title": "Adds a song after another one",
    "description": "<p>Adds a song after another song in the queue indicated by it's queue id</p>",
    "name": "AddAfter",
    "group": "Queue",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "user_id",
            "description": "<p>the user's Spotify id (for authentication)</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "token",
            "description": "<p>the provided access token (for authentication)</p>"
          },
          {
            "group": "Parameter",
            "type": "number",
            "optional": false,
            "field": "relative_key",
            "description": "<p>the key of the song to add after</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "new_song_id",
            "description": "<p>the Spotify track id of the new song to add (null to add it before the first song in the queue)</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "number",
            "optional": false,
            "field": "new_key",
            "description": "<p>the key of the newly added song</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"new_key\": <key of added song>\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "404": [
          {
            "group": "404",
            "optional": false,
            "field": "key_not_found",
            "description": "<p>the relative key could not be found in the queue</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 404 Not Found\n{\n    \"error\": \"key_not_found\",\n    \"error_description\": \"the relative key <relative_key> could not be found in the queue\"\n}",
          "type": "json"
        }
      ]
    },
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -X POST http://localhost:3000/queue/add_after\n     -d user_id=fishnal\n     -d token=BQCKsz5Dv...eSNUbbI6w\n     -d relative_key=0\n     -d new_song_id=3L3bIKIYIvzIsR6Obv2WB3",
        "type": "curl"
      }
    ],
    "version": "1.0.0",
    "filename": "src/server.js",
    "groupTitle": "Queue"
  },
  {
    "type": "delete",
    "url": "/queue/song",
    "title": "Removes a song from the queue",
    "description": "<p>Removes a song from the queue given it's key</p>",
    "name": "RemoveSong",
    "group": "Queue",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "user_id",
            "description": "<p>the user's Spotify id (for authentication)</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "token",
            "description": "<p>the provided access token (for authentication)</p>"
          },
          {
            "group": "Parameter",
            "type": "number",
            "optional": false,
            "field": "key",
            "description": "<p>the song's key</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "404": [
          {
            "group": "404",
            "optional": false,
            "field": "key_not_found",
            "description": "<p>the key was not found in the queue</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 404 Not Found\n{\n    \"error\": \"key_not_found\",\n    \"error_description\": \"the key was not found in the queue\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "1.0.0",
    "filename": "src/server.js",
    "groupTitle": "Queue"
  },
  {
    "type": "get",
    "url": "/token",
    "title": "Requests access and refresh tokens",
    "description": "<p>Request access and refresh tokens for Spotify's Web API given an authorization code provided from the client authorizing this application through Spotify.</p>",
    "name": "GetTokens",
    "group": "SpotifyAuth",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "code",
            "description": "<p>the code returned from authorization request</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "string",
            "optional": false,
            "field": "access_token",
            "description": "<p>a token used for Spotify Web API services</p>"
          },
          {
            "group": "200",
            "type": "string",
            "optional": false,
            "field": "token_type",
            "description": "<p>how the token is used (always &quot;Bearer&quot;)</p>"
          },
          {
            "group": "200",
            "type": "string",
            "optional": false,
            "field": "scope",
            "description": "<p>the scopes granted for this <code>access_token</code></p>"
          },
          {
            "group": "200",
            "type": "number",
            "optional": false,
            "field": "expires_in",
            "description": "<p>how long the access token is valid for (in seconds)</p>"
          },
          {
            "group": "200",
            "type": "string",
            "optional": false,
            "field": "refresh_token",
            "description": "<p>a token used for retrieving another access token with same scopes granted as this <code>access_token</code></p>"
          }
        ]
      },
      "examples": [
        {
          "title": "200 Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"access_token\": \"BQCKsz5Dv...eSNUbbI6w\",\n    \"token_type\": \"Bearer\",\n    \"scope\": \"user-library-read user-library-modify\",\n    \"expires_in\": 3600,\n    \"refresh_token\": \"AQBYahCgx...Xa8msLnyA\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "no_code",
            "description": "<p>missing <code>code</code> parameter</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "400 Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n    \"error\": \"no_code\",\n    \"error_description\": \"a code parameter was not provided\"\n}",
          "type": "json"
        }
      ]
    },
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -i http://localhost:3000/token\n     -d code=AQDk2ztJ3...qiNp9WCTI",
        "type": "curl"
      }
    ],
    "version": "1.0.0",
    "filename": "src/server.js",
    "groupTitle": "SpotifyAuth"
  },
  {
    "type": "post",
    "url": "/refresh",
    "title": "Requests a new access token",
    "description": "<p>Requests a new access token via an existing and valid refresh token</p>",
    "name": "RefreshToken",
    "group": "SpotifyAuth",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "refresh_token",
            "description": "<p>the refresh token to use</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "string",
            "optional": false,
            "field": "access_token",
            "description": "<p>the new access token</p>"
          },
          {
            "group": "200",
            "type": "string",
            "optional": false,
            "field": "token_type",
            "description": "<p>how the token is used (always &quot;Bearer&quot;)</p>"
          },
          {
            "group": "200",
            "type": "string",
            "optional": false,
            "field": "scope",
            "description": "<p>the scopes granted for this <code>access_token</code></p>"
          },
          {
            "group": "200",
            "type": "number",
            "optional": false,
            "field": "expires_in",
            "description": "<p>how long the access token is valid for (in seconds)</p>"
          },
          {
            "group": "200",
            "type": "string",
            "optional": false,
            "field": "refresh_token",
            "description": "<p>a token used for retrieving another access token with (can be undefined, indicating refresh token was not changed)</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "200 Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"access_token\": \"CRDLt06Ew...fTOccJ7x\",\n    \"token_type\": \"Bearer\",\n    \"scope\": \"user-library-read user-library-modify\",\n    \"expires_in\": 3600,\n    \"refresh_token\": <new refresh token string, otherwise undefined>\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "no_refresh_token",
            "description": "<p>missing <code>refresh_token</code> parameter</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "400 Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n    \"error\": \"no_refresh_token\",\n    \"error_description\": \"a refresh token parameter was not provided\"\n}",
          "type": "json"
        }
      ]
    },
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -X POST http://localhost:3000/refresh\n     -d refresh_token=AQBYahCgx...Xa8msLnyA",
        "type": "curl"
      }
    ],
    "version": "1.0.0",
    "filename": "src/server.js",
    "groupTitle": "SpotifyAuth"
  }
] });
