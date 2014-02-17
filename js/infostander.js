/**
 * @file
 * This is a frontend to the information publishing system. This frontend is used
 * by the information pylons.
 */

var INFOS = (function() {
  "use strict"

  // Get the load configuration object.
  var config = window.config;

  // Communication with web-socket.
  var socket = undefined;

  // Global variable with token cookie.
  var token_cookie = undefined;

  /**
   * Cookie object.
   *
   * Used to handle the cookie(s), mainly used to store the connetion JSON Web Token.
   */
  var Cookie = (function() {
    var Cookie = function(name) {
      var self = this;
      var name = name;

      // Get token.
      self.get = function get() {
        var regexp = new RegExp("(?:^" + name + "|;\s*"+ name + ")=(.*?)(?:;|$)", "g");
        var result = regexp.exec(document.cookie);
        return (result === null) ? undefined : result[1];
      }

      // Set token
      self.set = function set(value, expire) {
        var cookie = name + '=' + escape(value) + ';';

        if (expire !== undefined) {
          cookie += 'expires=' + expire + ';';
        }

        cookie += 'path=/;';
        cookie += 'domain=' + document.domain + ';';

        // Check if cookie should be available only over https.
        if (config.cookie.secure === true) {
          cookie += ' secure';
        }

        document.cookie = cookie;
      }

      // Remove the cookie by expiring it.
      self.remove = function remove() {
        self.set('', 'Thu, 01 Jan 1970 00:00:00 GMT');
      }
    }

    return Cookie;
  })();

  /***************************
   * Private methods
   *****************/

  /**
   * Check if a valied token exists.
   *
   * If a token is found and connection to the proxy is attampted. If token
   * not found the activation form is displayed.
   */
  function activation() {
    // Check if token exists.
    token_cookie = new Cookie('infostander_token');
    var token = token_cookie.get('token');

    if (token === undefined) {
      // Token not found, so display actiavte page.
      var template = Hogan.compile(window.templates['activation']);
      var output = template.render();

      // Insert the render content.
      var el = document.getElementsByClassName('content');
      el[0].innerHTML = output;

      // Add event listener to form submit button.
      el = document.getElementsByClassName('btn-activate');
      el[0].addEventListener('click', function(event) {
        event.preventDefault();

        // Build ajax post request.
        var request = new XMLHttpRequest();
        request.open('POST', config.resource.server + config.resource.uri + '/activate', true);
        request.setRequestHeader('Content-Type', 'application/json');

        request.onload = function(resp) {
          if (request.readyState == 4 && request.status == 200) {
            // Success.
            resp = JSON.parse(request.responseText);

            // Try to get connection to the proxy.
            connect(resp.token);
          }
          else {
            // We reached our target server, but it returned an error
            alert('Activation could not be performed.');
          }
        }

        request.onerror = function(exception) {
          // There was a connection error of some sort
          alert('Activation request failed.');
        }

        // Send the request.
        var form = document.getElementsByClassName('form-activation-code');
        request.send(JSON.stringify({ activationCode: form[0].value }));

        return false;
      });
    }
    else {
      // If token exists, connect to the socket.
      connect(token);
    }
  }

  /**
   * Load the socket.io script from the proxy server.
   */
  function loadSocket(callback) {
    var file = document.createElement('script');
    file.setAttribute('type', 'text/javascript');
    file.setAttribute('src', config.resource.server +  config.resource.uri + '/socket.io/socket.io.js');

    file.onload = callback;

    document.getElementsByTagName("head")[0].appendChild(file);
  }

  /**
   * Connect to the web-socket.
   *
   * @param string token
   *   JWT authentication token from the activation request.
   */
  function connect(token) {
    // Get connected to the server.
    socket = io.connect(config.ws.server, { query: 'token=' + token });

    // Handle error events.
    socket.socket.on('error', function (reason) {
      alert(reason);
    });

    // Handle connected event.
    socket.on('connect', function () {
      // Connection accepted, so lets store the token.
      token_cookie.set(token);

      // Set ready state at the server.
      socket.emit('ready', { token: token });
    });

    // Handle disconnect event (fires when disconnected or connection fails).
    socket.on('disconnect', function (reason) {
      if (reason == 'booted') {
        // Remove cookie with token.
        token_cookie.remove();

        // Reload application.
        location.reload(true);
      }
    });

    // Ready event - if the server accepted the ready command.
    socket.on('ready', function (data) {
      if (data.statusCode != 200) {
        // Screen not found will reload applicaton on dis-connection event.
        if (data.statusCode !== 404) {
          // @todo: better error message.
          alert('Code: ' + data.statusCode + ' - Connection error');
          return;
        }
      }
      else {
        // Remove the form.
        var el = document.getElementsByClassName('content');
        el[0].innerHTML = '<p>Awaiting content...</p>';
      }
    });

    // Pause event - if the server accepted the pause command.
    socket.on('pause', function (data) {
      if (data.statusCode != 200) {
        // @todo: error on pause command.
      }
    });

    // Reload - if the server accepted the pause command.
    socket.on('reload', function (data) {
      // Reload browser windows (by-pass-cache).
      location.reload(true);
    });

    // Request status.
    socket.on('status', function (data) {
      alert('Status requested');
    });

    // Channel pushed content.
    socket.on('channelPush', function (data) {
      var slideTemplate = Hogan.compile(window.templates['slide']);
      var output = slideTemplate.render(data);

      // Insert the render content.
      var el = document.getElementsByClassName('content');
      el[0].innerHTML = output;
    });

    // Emergency content pushed.
    socket.on('emergencyPush', function (data) {
      alert('Emergency content pushed');
    });
  }

  /***************************
   * Exposed methods
   *****************/

  function start() {
    // Load socket.io Javascript.
    loadSocket(function () {
      // Activate the screen.
      activation();
    });
  }

  /**
   * This should mainly be used to bebugging.
   */
  function stop() {
    socket.emit('pause', {});
  }

  return {
    start: start,
    stop: stop
  }
})();

// Get the show on the road.
INFOS.start();
