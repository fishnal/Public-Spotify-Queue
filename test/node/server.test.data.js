/* eslint-disable max-len */
/* eslint-disable no-template-curly-in-string */
const fs = require('fs');

module.exports = {
  "{root}": [
    {
      "title": "(200) ok root/homepage",
      "args": {},
      "expected": {
        "code": 200,
        "data": fs.readFileSync("./public/html/index.html").toString()
      }
    }
  ],
  "index.html": [
    {
      "title": "(200) static file, but redirect to root",
      "args": {},
      "expected": {
        "code": 200,
        "data": fs.readFileSync("./public/html/index.html").toString()
      }
    }
  ],
  "token": [
    {
      "title": "(400) missing auth code",
      "args": {},
      "expected": {
        "code": 400,
        "data": {
          "error": "invalid_request",
          "error_description": "code must be supplied"
        }
      }
    },
    {
      "title": "(400) wrong auth code",
      "args": {
        "queries": {
          "code": "not an actual auth code"
        }
      },
      "expected": {
        "code": 400,
        "data": {
          "error": "invalid_grant",
          "error_description": "Invalid authorization code"
        }
      }
    },
    {
      "title": "(400) expired auth code",
      "args": {
        "queries": {
          "code": "1"
        }
      },
      "expected": {
        "code": 400,
        "data": {
          "error": "invalid_grant",
          "error_description": "Authorization code expired"
        }
      }
    },
    {
      "title": "(200) ok",
      "args": {
        "queries": {
          "code": "2"
        }
      },
      "expected": {
        "code": 200,
        "data": {
          "access_token": "1",
          "token_type": "Bearer",
          "expires_in": 300,
          "scope": "streaming user-modify-playback-state user-read-currently-playing user-read-playback-state user-read-birthdate user-read-email user-read-private",
          "refresh_token": "1",
          "psq_token": Buffer.from("fishnal;1;1;1").toString('base64')
        }
      }
    }
  ],
  "refresh": [
    {
      "title": "(400) missing psq token",
      "args": {},
      "expected": {
        "code": 400,
        "data": {
          "error": "invalid_request",
          "error_description": "psq_token must be supplied"
        }
      }
    },
    {
      "title": "(400) wrong psq token length",
      "args": {
        "queries": {
          "psq_token": Buffer.from("user;access;missing_refresh_here").toString('base64')
        }
      },
      "expected": {
        "code": 400,
        "data": {
          "error": "invalid_grant",
          "error_description": "Invalid PSQ token"
        }
      }
    },
    {
      "title": "(400) no refresh token in psq token",
      "args": {
        "queries": {
          "psq_token": Buffer.from("user;access;;time").toString('base64')
        }
      },
      "expected": {
        "code": 400,
        "data": {
          "error": "invalid_grant",
          "error_description": "Invalid PSQ token"
        }
      }
    },
    {
      "title": "(200) ok",
      "args": {
        "queries": {
          "psq_token": Buffer.from("fishnal;1;1;1").toString('base64')
        }
      },
      "expected": {
        "code": 200,
        "data": {
          "access_token": "2",
          "token_type": "Bearer",
          "scope": "streaming user-modify-playback-state user-read-currently-playing user-read-playback-state user-read-birthdate user-read-email user-read-private",
          "expires_in": 300,
          "psq_token": Buffer.from("fishnal;2;1;2").toString('base64')
        }
      }
    }
  ],
  "client_credentials": [
    {
      "title": "(200) ok",
      "args": {},
      "expected": {
        "code": 200,
        "data": {
          "access_token": "3",
          "token_type": "Bearer",
          "expires_in": 300,
          "scope": "",
          "psq_token": Buffer.from(";3;;3").toString('base64')
        }
      }
    }
  ],
  "queue": {
    "add_after": [
      {
        "title": "(401) missing credentials",
        "args": {},
        "expected": {
          "code": 401,
          "data": {
            "error": "invalid_credentials",
            "error_description": "authorization header or access token is invalid"
          }
        }
      },
      {
        "title": "(401) wrong credentials, bad psq token length",
        "args": {
          "headers": {
            "Authorization": `Bearer ${Buffer.from('1;2;3').toString('base64')}`
          }
        },
        "expected": {
          "code": 401,
          "data": {
            "error": "invalid_credentials",
            "error_description": "authorization header or access token is invalid"
          }
        }
      },
      {
        "title": "(400) no relative key",
        "args": {
          "headers": {
            "Authorization": `Bearer ${Buffer.from('fishnal;1;1;1').toString('base64')}`
          }
        },
        "expected": {
          "code": 400,
          "data": {
            "error": "invalid_request",
            "error_description": "relative_key must be supplied"
          }
        }
      },
      {
        "title": "(400) wrong relative key type",
        "args": {
          "headers": {
            "Authorization": `Bearer ${Buffer.from('fishnal;1;1;1').toString('base64')}`
          },
          "queries": {
            "relative_key": "not a number"
          }
        },
        "expected": {
          "code": 400,
          "data": {
            "error": "invalid_type",
            "error_description": "relative_key must be a number or \"null\""
          }
        }
      },
      {
        "title": "(400) no new song id",
        "args": {
          "headers": {
            "Authorization": `Bearer ${Buffer.from('fishnal;1;1;1').toString('base64')}`
          },
          "queries": {
            "relative_key": 0
          }
        },
        "expected": {
          "code": 400,
          "data": {
            "error": "invalid_request",
            "error_description": "new_song_id must be supplied"
          }
        }
      },
      {
        "title": "(404) couldn't find song",
        "args": {
          "headers": {
            "Authorization": `Bearer ${Buffer.from('fishnal;1;1;1').toString('base64')}`
          },
          "queries": {
            "relative_key": 0,
            "new_song_id": "abc_def"
          }
        },
        "expected": {
          "code": 404,
          "data": {
            "error": "song_not_found",
            "error_description": "song abc_def not found"
          }
        }
      },
      {
        "title": "(404) couldn't find song, but in spotify uri format",
        "args": {
          "headers": {
            "Authorization": `Bearer ${Buffer.from('fishnal;1;1;1').toString('base64')}`
          },
          "queries": {
            "relative_key": 0,
            "new_song_id": "spotify:track:abc_def"
          }
        },
        "expected": {
          "code": 404,
          "data": {
            "error": "song_not_found",
            "error_description": "song spotify:track:abc_def not found"
          }
        }
      },
      {
        "title": "(404) couldn't find relative key",
        "args": {
          "headers": {
            "Authorization": `Bearer ${Buffer.from('fishnal;1;1;1').toString('base64')}`
          },
          "queries": {
            "relative_key": 0,
            "new_song_id": "abc123"
          }
        },
        "expected": {
          "code": 404,
          "data": {
            "error": "key_not_found",
            "error_description": "relative_key 0 not found"
          }
        }
      },
      {
        "title": "(200) ok",
        "args": {
          "headers": {
            "Authorization": `Bearer ${Buffer.from('fishnal;1;1;1').toString('base64')}`
          },
          "queries": [
            {
              "relative_key": "null",
              "new_song_id": "id1"
            },
            {
              "relative_key": 0,
              "new_song_id": "id2"
            },
            {
              "relative_key": 1,
              "new_song_id": "id3"
            },
            {
              "relative_key": 2,
              "new_song_id": "spotify:track:id4"
            },
            {
              "relative_key": 1,
              "new_song_id": "id5"
            },
            {
              "relative_key": 1,
              "new_song_id": "id6"
            },
            {
              "relative_key": 3,
              "new_song_id": "spotify:track:id7"
            }
          ]
        },
        "expected": {
          "code": 200,
          "data": [
            { "new_key": 0 },
            { "new_key": 1 },
            { "new_key": 2 },
            { "new_key": 3 },
            { "new_key": 1.5 },
            { "new_key": 1.25 },
            { "new_key": 4 }
          ]
        }
      },
      {
        "title": "(400) too much averaging (too much inserting)",
        "test_id": "/api/queue/add_after/average_error",
        "args": {
          "headers": {
            "Authorization": `Bearer ${Buffer.from('fishnal;1;1;1').toString('base64')}`
          }
        },
        "expected": {
          "code": 400,
          "data": {
            "error": "invalid_request",
            "error_description": "too much averaging"
          }
        }
      },
      {
        "title": "(400) unsafe integer (too much appending)",
        "test_id": "/api/queue/add_after/unsafe_integer_error",
        "args": {
          "headers": {
            "Authorization": `Bearer ${Buffer.from('fishnal;1;1;1').toString('base64')}`
          }
        },
        "expected": {
          "code": 400,
          "data": {
            "error": "invalid_request",
            "error_description": "unsafe integer"
          }
        }
      }
    ],
    "remove": [
      {
        "title": "(401) missing credentials",
        "args": {},
        "expected": {
          "code": 401,
          "data": {
            "error": "invalid_credentials",
            "error_description": "authorization header or access token is invalid"
          }
        }
      },
      {
        "title": "(401) wrong credentials",
        "args": {
          "headers": {
            "Authorization": `Bearer ${Buffer.from('somethingtotallywrong').toString('base64')}`
          }
        },
        "expected": {
          "code": 401,
          "data": {
            "error": "invalid_credentials",
            "error_description": "authorization header or access token is invalid"
          }
        }
      },
      {
        "title": "(400) missing key",
        "args": {
          "headers": {
            "Authorization": `Bearer ${Buffer.from('fishnal;1;1;1').toString('base64')}`
          }
        },
        "expected": {
          "code": 400,
          "data": {
            "error": "invalid_request",
            "error_description": "key must be supplied"
          }
        }
      },
      {
        "title": "(400) wrong key type",
        "args": {
          "headers": {
            "Authorization": `Bearer ${Buffer.from('fishnal;1;1;1').toString('base64')}`
          },
          "queries": {
            "key": "not a number"
          }
        },
        "expected": {
          "code": 400,
          "data": {
            "error": "invalid_type",
            "error_description": "key must be a number"
          }
        }
      },
      {
        "title": "(404) couldn't find key",
        "args": {
          "headers": {
            "Authorization": `Bearer ${Buffer.from('fishnal;1;1;1').toString('base64')}`
          },
          "queries": {
            "key": -5000
          }
        },
        "expected": {
          "code": 404,
          "data": {
            "error": "key_not_found",
            "error_description": "key -5000 not found"
          }
        }
      },
      {
        "title": "(200) ok",
        "args": {
          "headers": {
            "Authorization": `Bearer ${Buffer.from('fishnal;1;1;1').toString('base64')}`
          },
          "queries": {
            "key": 0
          }
        },
        "expected": {
          "code": 200,
          "data": null
        }
      }
    ]
  }
};
