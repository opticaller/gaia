'use strict';

var fb = window.fb || {};

fb.ACC_T = 'access_token';

if (typeof fb.oauth === 'undefined') {
  (function(document) {

    var fboauth = fb.oauth = {};

    // <callback> is invoked when an access token is ready
    // and the hash state matches <state>
    var accessTokenCbData;

    var STORAGE_KEY = 'tokenData';

    /**
     *  Clears credential data stored locally
     *
     */
    function clearStorage() {
      window.asyncStorage.removeItem(STORAGE_KEY);
    }


    /**
     *  Obtains the access token. The access token is retrieved from the local
     *  storage and if not present a OAuth 2.0 flow is started
     *
     *
     */
    fboauth.getAccessToken = function(ready, state) {
      accessTokenCbData = {
        callback: ready,
        state: state
      };

      asyncStorage.getItem(STORAGE_KEY,
                           function getAccessToken(tokenData) {
        if (!tokenData || !tokenData.access_token) {
          startOAuth(state);
          return;
        }

        var access_token = tokenData.access_token;
        var expires = Number(tokenData.expires);
        var token_ts = tokenData.token_ts;

        if (expires !== 0 && Date.now() - token_ts >= expires) {
          startOAuth(state);
          return;
        }

        if (typeof ready === 'function') {
          ready(access_token);
        }
      });
    }

    /**
     *  Starts a OAuth 2.0 flow to obtain the user information
     *
     */
    function startOAuth(state) {
      clearStorage();

      // This page will be in charge of handling authorization
      fb.oauthflow.start(state);
    }

    function tokenDataReady(e) {
      var tokenData = e.data;

      // The content of window.postMessage is parsed
      var parameters = JSON.parse(tokenData);

      if (parameters.access_token) {
        var end = parameters.expires_in;
        var access_token = parameters.access_token;

        // Don't wait for callback because it's not necessary
        window.asyncStorage.setItem(STORAGE_KEY, {
          access_token: access_token,
          expires: end * 1000,
          token_ts: Date.now()
        });
      }

      if (parameters.state === accessTokenCbData.state) {
        accessTokenCbData.callback(access_token);
      } else {
        window.console.error('FB: Error in state', parameters.state,
                                  accessTokenCbData.state);
      }
    }

    window.addEventListener('message', tokenDataReady);

  }
  )(document);
}
