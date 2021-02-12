var NodeHelper = require('node_helper');
var request = require('request');

module.exports = NodeHelper.create({
  start: function() {
    if (config.debuglogging) {
      console.log('MMM-homeassistant-sensors helper started...')
    };
  },
  getStats: function(config) {
    var self = this;
    var url = self.buildUrl(config);
    var get_options = {
      url: url,
      json: true
    };
    if (config.token.length > 1) {
      if (config.debuglogging) {
        console.error('MMM-homeassistant-sensors: Adding token', config.token)
      }
      get_options.headers = {
        'Authorization': 'Bearer ' + config.token
      };
    }
    request(get_options, function(error, response, body) {
      if (config.debuglogging) {
        console.error('MMM-homeassistant-sensors ERROR:', error);
        console.error('MMM-homeassistant-sensors statusCode:', response.statusCode);
        console.error('MMM-homeassistant-sensors Body:', body);
      }
      if (!error && response.statusCode == 200) {
        if (config.debuglogging) {
          console.log('MMM-homeassistant-sensors response successfull. calling STATS_RESULT')
        };
        self.sendSocketNotification('STATS_RESULT', body);
      }
    });
  },
  checkLock: function(config) {
    var self = this;
    var url = 'http://localhost:8123/api/services/';

    var status_options = {
      url: 'http://localhost:8123/api/template',
      json: {
        "template": "{% if is_state('\''lock.front_door'\'' ,'\''locked'\'') %} lock/unlock {% else %} lock/lock {% endif %}"
      }
    };

    if (config.token.length > 1) {
      if (config.debuglogging) {
        console.error('MMM-homeassistant-sensors: Adding token', config.token)
      }
      status_options.headers = {
        'Authorization': 'Bearer ' + config.token
      };
    }
    return new Promise(function(resolve, reject) {
      request.post(status_options, function(error, response, body) {
        if (config.debuglogging) {
          console.error('MMM-homeassistant-sensors ERROR:', error);
          console.error('MMM-homeassistant-sensors statusCode:', response.statusCode);
          console.error('MMM-homeassistant-sensors Body:', body);
        }
        if (!error && response.statusCode == 200) {
          if (config.debuglogging) {
            console.log('MMM-homeassistant-sensors response successfull. calling STATS_RESULT')
          };
          resolve(url + body);
        }
      });
    });
  },
  updateLock: function(config, url) {
    var self = this;
    var test = url
    console.log('Test', test);

    var post_options = {
      url: url,
      json: {
        "entity_id": "lock.front_door"
      }
    };
    if (config.token.length > 1) {
      if (config.debuglogging) {
        console.error('MMM-homeassistant-sensors: Adding token', config.token)
      }
      post_options.headers = {
        'Authorization': 'Bearer ' + config.token
      };
    }
    request.post(post_options, function(error, response, body) {
      if (config.debuglogging) {
        console.error('MMM-homeassistant-sensors ERROR:', error);
        console.error('MMM-homeassistant-sensors statusCode:', response.statusCode);
        console.error('MMM-homeassistant-sensors Body:', body);
      }
      if (!error && response.statusCode == 200) {
        if (config.debuglogging) {
          console.log('MMM-homeassistant-sensors response successfull. calling STATS_RESULT')
        };
        self.getStats(config);
      }
    });
  },
  buildUrl: function(config) {
    var url = config.host;
    if (config.port) {
      url = url + ':' + config.port;
    }
    url = url + '/api/states'
    if (config.apipassword.length > 1) {
      url = url + '?api_password=' + config.apipassword;
    }
    if (config.https) {
      url = 'https://' + url;
    } else {
      url = 'http://' + url;
    }
    if (config.debuglogging) {
      console.error("MMM-homeassistant-sensors - buildUrl:", url);
    }
    return url;
  },
  //Subclass socketNotificationReceived received.
  socketNotificationReceived: function(notification, payload) {
    var self = this;
    console.log("TEST", notification);
    if (notification === 'GET_STATS') {
      this.getStats(payload);
    } else if (notification === "LOCK") {
      this.checkLock(payload).then(function(url) {
        self.updateLock(payload, url);
      });
    }
  }
});
