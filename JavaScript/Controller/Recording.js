var Controller = require('./');
var UI = require('UI');
var View = require('View');

var Recording = require('Store/Recording');

var Auphonic = require('Auphonic');

var showAll = function() {
  var recordings = Object.values(Recording.findAll()).sortByKey('timestamp').reverse();
  var object = new View.Object({
    title: 'Recordings',
    content: UI.render('recordings', {
      recordings: recordings.length && recordings
    }),
    action: {
      title: 'New',
      url: '/production/source'
    }
  });

  View.getMain().push('recording', object);
  var getElements = function() {
    return object.toElement().getElements('ul.main-list >');
  };

  getElements().addEvent('remove', function(id) {
    Recording.remove(id);
    if (getElements().length == 1) {
      // If the last item is being deleted, refresh now
      object.invalidate();
      showAll();
    } else {
      // otherwise invalidate onHide
      object.addEvent('hide', function() {
        object.invalidate();
      });
    }
  });
};

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

Controller.define('/recording', {isGreedy: true}, showAll);

Controller.define('/recording/{id}', function(req) {

  var recording = Recording.findById(req.id);
  var date = new Date(recording.timestamp);

  recording.media_files = JSON.stringify([recording.fullPath]);
  recording.display_date = months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getHours() + ':' + date.getMinutes();

  View.getMain().push('recording', new View.Object({
    title: Recording.getRecordingName(recording),
    content: UI.render('recording', recording)
  }));

});
