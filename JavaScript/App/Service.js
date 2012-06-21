var API = require('API');
var UI = require('UI');
var View = require('View');

var services = {};

var format = exports.format = function(service) {
  var type = service.type;
  if (type == 'dropbox') type = type.charAt(0).toUpperCase() + type.slice(1);
  else type = service.type.toUpperCase();
  service.display_type = type;

  return service;
};

API.on('services', {
  formatter: function(response) {
    response.data = response.data.map(format);
    return response;
  }
});

exports.getType = function() {
  return 'outgoings';
};

exports.getData = function(dataStore) {
  var list = [];
  var outgoings = Object.expand(Object.append({}, dataStore.get('outgoings', {})));
  Object.each(outgoings.outgoings, function(value, service) {
    if (value) list.push(service);
  });
  return {
    outgoings: list
  };
};

exports.createView = function(dataStore) {
  View.getMain().showIndicator();

  API.call('services').on({

    success: function(response) {
      View.getMain().push(new View.Object({
        title: 'Transfers',
        content: UI.render('form-new-service', {
          service: response.data
        }),
        action: {
          title: 'Done',
          back: true,
          onClick: function() {
            dataStore.set('outgoings', View.getMain().getCurrentView().serialize());
          }
        },
        back: {
          title: 'Cancel'
        },

        onShow: function() {
          this.unserialize(dataStore.get('outgoings'));
        }
      }));

    }
  });
};
