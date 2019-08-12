/* eslint-disable max-lines */
/* eslint-disable max-len */
module.exports = {
  "authorize": [
    {
      "title": "(400) missing client id",
      "args": {},
      "expected": {
        "code": 400,
        "error": "INVALID_CLIENT: Invalid client"
      }
    },
    {
      "title": "(400) wrong client id",
      "args": {
        "queries": {
          "client_id": "DOESNT EXIST"
        }
      },
      "expected": {
        "code": 400,
        "error": "INVALID_CLIENT: Invalid client"
      }
    },
    {
      "title": "(400) missing response type",
      "args": {
        "queries": {
          "client_id": process.env.CLIENT_ID
        }
      },
      "expected": {
        "code": 400,
        "error": "response_type must be code or token"
      }
    },
    {
      "title": "(400) wrong response type",
      "args": {
        "queries": {
          "client_id": process.env.CLIENT_ID,
          "response_type": "bad response type"
        }
      },
      "expected": {
        "code": 400,
        "error": "response_type must be code or token"
      }
    },
    {
      "title": "(400) missing redirect uri",
      "args": {
        "queries": {
          "client_id": process.env.CLIENT_ID,
          "response_type": "code"
        }
      },
      "expected": {
        "code": 400,
        "error": "INVALID_CLIENT: Invalid redirect URI"
      }
    },
    {
      "title": "(400) wrong redirect uri",
      "args": {
        "queries": {
          "client_id": process.env.CLIENT_ID,
          "response_type": "code",
          "redirect_uri": "http://badredirect`.com"
        }
      },
      "expected": {
        "code": 400,
        "error": "INVALID_CLIENT: Invalid redirect URI"
      }
    },
    {
      "title": "(302) code with no state",
      "args": {
        "queries": {
          "client_id": process.env.CLIENT_ID,
          "response_type": "code",
          "redirect_uri": "http://testingurl:3000"
        }
      },
      "expected": {
        "code": 302,
        "redirect_base": "http://testingurl:3000",
        "queries": {
          "code": "1"
        }
      }
    },
    {
      "title": "(302) code with state",
      "args": {
        "queries": {
          "client_id": process.env.CLIENT_ID,
          "response_type": "code",
          "redirect_uri": "http://localhost:3000",
          "state": "my state"
        }
      },
      "expected": {
        "code": 302,
        "redirect_base": "http://localhost:3000",
        "queries": {
          "code": "2",
          "state": "my state"
        }
      }
    },
    {
      "title": "(302) token with no state",
      "args": {
        "queries": {
          "client_id": process.env.CLIENT_ID,
          "response_type": "token",
          "redirect_uri": "http://localhost:3000"
        }
      },
      "expected": {
        "code": 302,
        "redirect_base": "http://localhost:3000",
        "hashes": {
          "access_token": "1",
          "token_type": "Bearer",
          "expires_in": "300"
        }
      }
    },
    {
      "title": "(302) token with state",
      "args": {
        "queries": {
          "client_id": process.env.CLIENT_ID,
          "response_type": "token",
          "redirect_uri": "http://localhost:3000",
          "state": "my state"
        }
      },
      "expected": {
        "code": 302,
        "redirect_base": "http://localhost:3000",
        "hashes": {
          "access_token": "2",
          "token_type": "Bearer",
          "expires_in": "300",
          "state": "my state"
        }
      }
    },
    {
      "title": "(302) with redirect http://localhost:3000",
      "args": {
        "queries": {
          "client_id": process.env.CLIENT_ID,
          "response_type": "code",
          "redirect_uri": "http://localhost:3000",
          "state": "my state"
        }
      },
      "expected": {
        "code": 302,
        "redirect_base": "http://localhost:3000",
        "queries": {
          "code": "3",
          "state": "my state"
        }
      }
    },
    {
      "title": "(302) code with scopes [user-read-email, user-read-private, streaming]",
      "args": {
        "queries": {
          "client_id": process.env.CLIENT_ID,
          "response_type": "code",
          "redirect_uri": "http://localhost:3000",
          "scope": "user-read-email user-read-private streaming"
        }
      },
      "expected": {
        "code": 302,
        "redirect_base": "http://localhost:3000",
        "queries": {
          "code": "4"
        }
      }
    },
    {
      "title": "(302) token with scopes [user-read-email, user-read-private, streaming]",
      "args": {
        "queries": {
          "client_id": process.env.CLIENT_ID,
          "response_type": "token",
          "redirect_uri": "http://localhost:3000",
          "scope": "user-read-email user-read-private streaming"
        }
      },
      "expected": {
        "code": 302,
        "redirect_base": "http://localhost:3000",
        "hashes": {
          "access_token": "3",
          "token_type": "Bearer",
          "expires_in": "300"
        }
      }
    },
    {
      "title": "(302) code, but it expires in 1ms",
      "func": {
        "name": "setCodeExpiration",
        "args": [ 1 ]
      },
      "args": {
        "queries": {
          "client_id": process.env.CLIENT_ID,
          "response_type": "code",
          "redirect_uri": "http://localhost:3000"
        }
      },
      "expected": {
        "code": 302,
        "redirect_base": "http://localhost:3000",
        "queries": {
          "code": "5"
        }
      }
    },
    {
      "title": "(302) token, but it expires in 1ms",
      "func": {
        "name": "setAccessTokenExpiration",
        "args": [ 1 ]
      },
      "args": {
        "queries": {
          "client_id": process.env.CLIENT_ID,
          "response_type": "token",
          "redirect_uri": "http://localhost:3000"
        }
      },
      "expected": {
        "code": 302,
        "redirect_base": "http://localhost:3000",
        "hashes": {
          "access_token": "4",
          "token_type": "Bearer",
          "expires_in": "0.001"
        }
      }
    }
  ],
  "token": [
    {
      "title": "(400) missing Authorization header",
      "args": {
        "headers": {}
      },
      "expected": {
        "code": 400,
        "data": {
          "error": "invalid_client"
        }
      }
    },
    {
      "title": "(400) wrong Authorization header",
      "args": {
        "headers": {
          "Authorization": "Basic fakeid:fakesecret"
        }
      },
      "expected": {
        "code": 400,
        "data": {
          "error": "invalid_client"
        }
      }
    },
    {
      "title": "(415) missing Content-Type header",
      "args": {
        "headers": {
          "Authorization": Buffer.from(`Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')
        }
      },
      "expected": {
        "code": 415,
        "data": {
          "error": "invalid_content_type",
          "error_description": "Content-Type must be application/x-www-form-urlencoded"
        }
      }
    },
    {
      "title": "(415) wrong Content-Type header",
      "args": {
        "headers": {
          "Authorization": Buffer.from(`Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64'),
          "Content-Type": "not the right one"
        }
      },
      "expected": {
        "code": 415,
        "data": {
          "error": "invalid_content_type",
          "error_description": "Content-Type must be application/x-www-form-urlencoded"
        }
      }
    },
    {
      "title": "(400) missing grant type parameter",
      "args": {
        "headers": {
          "Authorization": Buffer.from(`Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64'),
          "Content-Type": "application/x-www-form-urlencoded"
        }
      },
      "expected": {
        "code": 400,
        "data": {
          "error": "unsupported_grant_type",
          "error_description": "grant_type must be client_credentials, authorization_code or refresh_token"
        }
      }
    },
    {
      "title": "(400) wrong grant type parameter",
      "args": {
        "headers": {
          "Authorization": Buffer.from(`Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64'),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        "queries": {
          "grant_type": "bad grant type"
        }
      },
      "expected": {
        "code": 400,
        "data": {
          "error": "unsupported_grant_type",
          "error_description": "grant_type must be client_credentials, authorization_code or refresh_token"
        }
      }
    },
    {
      "title": "(400) authorization_code: missing code parameter",
      "args": {
        "headers": {
          "Authorization": Buffer.from(`Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64'),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        "queries": {
          "grant_type": "authorization_code"
        }
      },
      "expected": {
        "code": 400,
        "data": {
          "error": "invalid_request",
          "error_description": "code must be supplied"
        }
      }
    },
    {
      "title": "(400) authorization_code: wrong code parameter",
      "args": {
        "headers": {
          "Authorization": Buffer.from(`Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64'),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        "queries": {
          "grant_type": "authorization_code",
          "code": "bad auth code"
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
      "title": "(400) authorization_code: auth code expired",
      "args": {
        "headers": {
          "Authorization": Buffer.from(`Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64'),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        "queries": {
          "grant_type": "authorization_code",
          "code": "5"
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
      "title": "(400) authorization_code: missing redirect uri",
      "args": {
        "headers": {
          "Authorization": Buffer.from(`Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64'),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        "queries": {
          "grant_type": "authorization_code",
          "code": "1"
        }
      },
      "expected": {
        "code": 400,
        "data": {
          "error": "invalid_grant",
          "error_description": "Invalid redirect URI"
        }
      }
    },
    {
      "title": "(400) authorization_code: wrong redirect uri",
      "args": {
        "headers": {
          "Authorization": Buffer.from(`Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64'),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        "queries": {
          "grant_type": "authorization_code",
          "code": "1",
          "redirect_uri": "http://localhost:3000"
        }
      },
      "expected": {
        "code": 400,
        "data": {
          "error": "invalid_grant",
          "error_description": "Invalid redirect URI"
        }
      }
    },
    {
      "title": "(400) refresh_token: missing refresh token",
      "args": {
        "headers": {
          "Authorization": Buffer.from(`Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64'),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        "queries": {
          "grant_type": "refresh_token"
        }
      },
      "expected": {
        "code": 400,
        "data": {
          "error": "invalid_request",
          "error_description": "refresh_token must be supplied"
        }
      }
    },
    {
      "title": "(400) refresh_token: bad refresh token",
      "args": {
        "headers": {
          "Authorization": Buffer.from(`Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64'),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        "queries": {
          "grant_type": "refresh_token",
          "refresh_token": "bad refresh token"
        }
      },
      "expected": {
        "code": 400,
        "data": {
          "error": "invalid_grant",
          "error_description": "Invalid refresh token"
        }
      }
    },
    {
      "title": "(200) client_credentials: ok",
      "args": {
        "headers": {
          "Authorization": Buffer.from(`Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64'),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        "queries": {
          "grant_type": "client_credentials"
        }
      },
      "expected": {
        "code": 200,
        "data": {
          "access_token": "5",
          "token_type": "Bearer",
          "expires_in": 300,
          "scope": ""
        }
      }
    },
    {
      "title": "(200) authorization_code: ok, no scopes",
      "args": {
        "headers": {
          "Authorization": Buffer.from(`Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64'),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        "queries": {
          "grant_type": "authorization_code",
          "code": "1",
          "redirect_uri": "http://testingurl:3000"
        }
      },
      "expected": {
        "code": 200,
        "data": {
          "access_token": "6",
          "refresh_token": "1",
          "token_type": "Bearer",
          "expires_in": 300,
          "scope": ""
        }
      }
    },
    {
      "title": "(200) authorization_code: ok, with scopes",
      "args": {
        "headers": {
          "Authorization": Buffer.from(`Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64'),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        "queries": {
          "grant_type": "authorization_code",
          "code": "4",
          "redirect_uri": "http://localhost:3000"
        }
      },
      "expected": {
        "code": 200,
        "data": {
          "access_token": "7",
          "refresh_token": "2",
          "token_type": "Bearer",
          "expires_in": 300,
          "scope": "user-read-email user-read-private streaming"
        }
      }
    },
    {
      "title": "(200) authorization_code: ok but token expires in 1ms",
      "func": {
        "name": "setAccessTokenExpiration",
        "args": [ 1 ]
      },
      "args": {
        "headers": {
          "Authorization": Buffer.from(`Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64'),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        "queries": {
          "grant_type": "authorization_code",
          "code": "2",
          "redirect_uri": "http://localhost:3000"
        }
      },
      "expected": {
        "code": 200,
        "data": {
          "access_token": "8",
          "refresh_token": "3",
          "token_type": "Bearer",
          "expires_in": 0.001,
          "scope": ""
        }
      }
    },
    {
      "title": "(200) refresh_token: ok, new token expires in 60000ms",
      "func": {
        "name": "setAccessTokenExpiration",
        "args": [ 60000 ]
      },
      "args": {
        "headers": {
          "Authorization": Buffer.from(`Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64'),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        "queries": {
          "grant_type": "refresh_token",
          "refresh_token": "3"
        }
      },
      "expected": {
        "code": 200,
        "data": {
          "access_token": "9",
          "token_type": "Bearer",
          "expires_in": 60,
          "scope": ""
        }
      }
    },
    {
      "title": "(200) refresh_token: generates new refresh token",
      "args": {
        "headers": {
          "Authorization": Buffer.from(`Basic ${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64'),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        "queries": {
          "grant_type": "refresh_token",
          "refresh_token": "3"
        }
      },
      "expected": {
        "code": 200,
        "data": {
          "access_token": "10",
          "refresh_token": "4",
          "token_type": "Bearer",
          "expires_in": 60,
          "scope": ""
        }
      }
    }
  ]
};
