# Design

## Intervals

+ Make first interval based off of first access token expiration time
  + Each time interval executes, request new access token
  + Set this interval's repeat time (in *ms*) to whatever new access token's expiration time is
