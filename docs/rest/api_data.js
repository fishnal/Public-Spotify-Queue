define({ "api": [
  {
    "type": "get",
    "url": "/",
    "title": "Requests the home page.",
    "name": "GetHome",
    "group": "Client",
    "examples": [
      {
        "title": "cURL",
        "content": "curl -i http://localhost:3000/",
        "type": "curl"
      },
      {
        "title": "JavaScript (axios)",
        "content": "axios.get('http://localhost:3000/');",
        "type": "javascript"
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
        "title": "cURL",
        "content": "curl -i http://localhost:3000/index.html",
        "type": "curl"
      },
      {
        "title": "JavaScript (axios)",
        "content": "axios.get('http://localhost:3000/index.html');",
        "type": "javascript"
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
          "title": "200 Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"new_key\": 1\n}",
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
            "field": "invalid_request",
            "description": "<ul> <li><code>relative_key</code> is not provided</li> <li><code>new_song_id</code> is not provided</li> <li><code>relative_key</code> is positive infinity</li> <li>there's no room to add the song after the desired <code>relative_key</code> (this was done too many times)</li> <li>the new song key is an unsafe integer</li> </ul>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "invalid_type",
            "description": "<ul> <li><code>relative_key</code> is not a number</li> <li><code>new_song_id</code> is not a string</li> </ul>"
          }
        ],
        "401": [
          {
            "group": "401",
            "optional": false,
            "field": "invalid_credentials",
            "description": "<p>provided user id and/or access token is wrong</p>"
          }
        ],
        "404": [
          {
            "group": "404",
            "optional": false,
            "field": "song_not_found",
            "description": "<p>the song (identified by <code>new_song_id</code> could not be found)</p>"
          },
          {
            "group": "404",
            "optional": false,
            "field": "key_not_found",
            "description": "<p><code>relative_key</code> could not be found in the queue</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "400 No Relative Key",
          "content": "HTTP/1.1 400 Bad Request\n{\n    \"error\": \"invalid_request\",\n    \"error_description\": \"relative_key must be supplied\"\n}",
          "type": "json"
        },
        {
          "title": "400 Bad Relative Key Type",
          "content": "HTTP/1.1 400 Bad Request\n{\n    \"error\": \"invalid_type\",\n    \"error_description\": \"relative_key must be a number\"\n}",
          "type": "json"
        },
        {
          "title": "400 No New Song Id",
          "content": "HTTP/1.1 400 Bad Request\n{\n    \"error\": \"invalid_request\",\n    \"error_description\": \"new_song_id must be supplied\"\n}",
          "type": "json"
        },
        {
          "title": "400 No Relative Key",
          "content": "HTTP/1.1 400 Bad Request\n{\n    \"error\": \"invalid_type\",\n    \"error_description\": \"new_song_id must be a string\"\n}",
          "type": "json"
        },
        {
          "title": "401 Invalid Credentials",
          "content": "HTTP/1.1 401 Unauthorized\n{\n    \"error\": \"invalid_credentials\",\n    \"error_description\": \"the provided user id and/or access token is wrong\"\n}",
          "type": "json"
        },
        {
          "title": "404 Song Not Found",
          "content": "HTTP/1.1 404 Not Found\n{\n    \"error\": \"song_not_found\",\n    \"error_description\": \"song <new_song_id> not found\"\n}",
          "type": "json"
        },
        {
          "title": "400 Positive Infinity Relative Key",
          "content": "HTTP/1.1 400 Bad Request\n{\n    \"error\": \"invalid_request\",\n    \"error_description\": \"relative_key must be less than positive infinity\"\n}",
          "type": "json"
        },
        {
          "title": "400 Too Much Averaging",
          "content": "HTTP/1.1 400 Bad Request\n{\n    \"error\": \"invalid_request\",\n    \"error_description\": \"too much averaging\"\n}",
          "type": "json"
        },
        {
          "title": "400 Unsafe Integer",
          "content": "HTTP/1.1 400 Bad Request\n{\n    \"error\": \"invalid_request\",\n    \"error_description\": \"unsafe integer\"\n}",
          "type": "json"
        },
        {
          "title": "404 Key Not Found",
          "content": "HTTP/1.1 404 Not Found\n{\n    \"error\": \"key_not_found\",\n    \"error_description\": \"relative key <relative_key> not found\"\n}",
          "type": "json"
        }
      ]
    },
    "examples": [
      {
        "title": "cURL",
        "content": "curl -X POST http://localhost:3000/queue/add_after\n     -d user_id=fishnal\n     -d token=BQCKsz5Dv...eSNUbbI6w\n     -d relative_key=0\n     -d new_song_id=3L3bIKIYIvzIsR6Obv2WB3",
        "type": "curl"
      },
      {
        "title": "JavaScript (axios)",
        "content": "axios.post('http://localhost:3000/queue/add_after', {\n  params: {\n    user_id: 'fishnal',\n    token: 'BQCKsz5Dv...eSNUbbI6w',\n    relative_key: 0,\n    new_song_id: '3L3bIKIYIvzIsR6Obv2WB3'\n  }\n});",
        "type": "javascript"
      }
    ],
    "version": "1.0.0",
    "filename": "src/server.js",
    "groupTitle": "Queue"
  },
  {
    "type": "delete",
    "url": "/queue/remove",
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
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "invalid_request",
            "description": "<ul> <li><code>key</code> is not provided</li> <li><code>key</code> is not finite</li> </ul>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "invalid_type",
            "description": "<p><code>key</code> is not a number</p>"
          }
        ],
        "401": [
          {
            "group": "401",
            "optional": false,
            "field": "invalid_credentials",
            "description": "<p>the provided user id and/or access token is wrong</p>"
          }
        ],
        "404": [
          {
            "group": "404",
            "optional": false,
            "field": "key_not_found",
            "description": "<p><code>key</code> was not found in the queue</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "400 No Key",
          "content": "HTTP/1.1 400 Bad Request\n{\n    \"error\": \"invalid_request\",\n    \"error_description\": \"key must be supplied\"\n}",
          "type": "json"
        },
        {
          "title": "400 Bad Key Type",
          "content": "HTTP/1.1 400 Bad Request\n{\n    \"error\": \"invalid_type\",\n    \"error_description\": \"key must be a number\"\n}",
          "type": "json"
        },
        {
          "title": "401 Invalid Credentials",
          "content": "HTTP/1.1 401 Unauthorized\n{\n    \"error\": \"invalid_credentials\",\n    \"error_description\": \"the provided user id and/or access token is wrong\"\n}",
          "type": "json"
        },
        {
          "title": "400 Infinite Key",
          "content": "HTTP/1.1 400 Bad Request\n{\n    \"error\": \"invalid_request\",\n    \"error_description\": \"key must be finite\"\n}",
          "type": "json"
        },
        {
          "title": "404 Key Not Found",
          "content": "HTTP/1.1 404 Not Found\n{\n    \"error\": \"key_not_found\",\n    \"error_description\": \"key <key> not found\"\n}",
          "type": "json"
        }
      ]
    },
    "examples": [
      {
        "title": "cURL",
        "content": "curl -X DELETE http://localhost:3000/queue/remove\n     -d user_id=fishnal\n     -d token=BQCKsz5Dv...eSNUbbI6w\n     -d key=0",
        "type": "curl"
      },
      {
        "title": "JavaScript (axios)",
        "content": "axios.delete('http://localhost:3000/queue/remove', {\n  params: {\n    user_id: 'fishnal',\n    token: 'BQCKsz5Dv...eSNUbbI6w',\n    key: 0\n  }\n});",
        "type": "javascript"
      }
    ],
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
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "user_id",
            "description": "<p>the user's Spotify Id, which will be associated with their access token</p>"
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
          "title": "200 Success-Response",
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
            "field": "invalid_request",
            "description": "<p><code>code</code> isn't supplied for grant type <code>authorization_code</code></p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "invalid_grant",
            "description": "<p><code>code</code> doesn't exist or has expired</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "400 No Code",
          "content": "HTTP/1.1 400 Bad Request\n{\n    \"error\": \"invalid_request\",\n    \"error_description\": \"code must be supplied\"\n}",
          "type": "json"
        },
        {
          "title": "400 Invalid Code",
          "content": "HTTP/1.1 400 Bad Request\n{\n    \"error\": \"invalid_grant\",\n    \"error_description\": \"Invalid authorization code\"\n}",
          "type": "json"
        },
        {
          "title": "400 Expired Code",
          "content": "HTTP/1.1 400 Bad Request\n{\n    \"error\": \"invalid_grant\",\n    \"error_description\": \"Authorization code expired\"\n}",
          "type": "json"
        }
      ]
    },
    "examples": [
      {
        "title": "cURL",
        "content": "curl -i http://localhost:3000/token\n     -d code=AQDk2ztJ3...qiNp9WCTI\n     -d user_id=fishnal",
        "type": "curl"
      },
      {
        "title": "JavaScript (axios)",
        "content": "axios.get('http://localhost:3000/token', {\n  params: {\n    code: 'AQDk2ztJ3...qiNp9WCTI'\n    user_id: 'fishnal'\n  }\n});",
        "type": "javascript"
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
            "field": "invalid_request",
            "description": "<p><code>refresh_token</code> isn't supplied</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "invalid_grant",
            "description": "<p><code>refresh_token</code> doesn't exist</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "400 No Refresh Token",
          "content": "HTTP/1.1 400 Bad Request\n{\n    \"error\": \"invalid_request\",\n    \"error_description\": \"refresh_token must be supplied\"\n}",
          "type": "json"
        },
        {
          "title": "400 Invalid Refresh Token",
          "content": "HTTP/1.1 400 Bad Request\n{\n    \"error\": \"invalid_grant\",\n    \"error_description\": \"Invalid refresh token\"\n}",
          "type": "json"
        }
      ]
    },
    "examples": [
      {
        "title": "cURL",
        "content": "curl -X POST http://localhost:3000/refresh\n     -d refresh_token=AQBYahCgx...Xa8msLnyA",
        "type": "curl"
      },
      {
        "title": "JavaScript (axios)",
        "content": "axios.post('http://localhost:3000/refresh', {\n  params: {\n    refresh_token: 'AQBYahCgx...Xa8msLnyA'\n  }\n});",
        "type": "javascript"
      }
    ],
    "version": "1.0.0",
    "filename": "src/server.js",
    "groupTitle": "SpotifyAuth"
  }
] });
