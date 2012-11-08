var Core = require('Core');
var Class = Core.Class;
var Events = Core.Events;
var Options = Core.Options;

var IdleTimer = require('Cordova/IdleTimer');

module.exports = new Class({

  Implements: [Class.Binds, Options, Events],

  extension: 'm4a',
  canceled: false,
  statusEventIsDisabled: false,

  initialize: function(filename, options) {
    this.setOptions(options);

    this.filename = filename;
  },

  start: function() {
    this.statusEventIsDisabled = false;
    if (this.media) this._start();
    else window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, this.bound('onFileSystemReady'), this.bound('onError'));
  },

  _start: function() {
    if (!this.media) this.media = new window.Media(this.file.fullPath, this.bound('onCaptureSuccess'), this.bound('onCaptureError'), this.bound('onStatus'), this.bound('onLevelUpdate'));
    IdleTimer.disable();
    this.fireEvent('start');
    this.media.startRecord();
    this.timer = this.update.periodical(1000, this);
  },

  pause: function() {
    // onPause gets fired through onStatus
    this.media.pauseRecord();
  },

  stop: function() {
    clearInterval(this.timer);
    this.media.stopRecord();

    this.fireEvent('cancel');
  },

  cancel: function() {
    this.canceled = true;
    this.stop();
  },

  update: function() {
    this.fireEvent('update');
  },

  onCaptureSuccess: function() {
    var canceled = this.canceled;
    this.canceled = false;
    if (canceled) return;

    this.file.media_type = 'audio';
    this.statusEventIsDisabled = true;
    this.media.play();
    this.media.pause();
    // Duration can only be accessed asynchronously
    (function() {
      this.file.duration = this.media.getDuration();
      // Access the "File" Object
      this.file.file((function(file) {
        this.file.size = file.size;
        this.fireEvent('success', [this.file]);
        // We are getting rid of the media object so it will be recreated on the next call to start().
        this.media = null;
      }).bind(this));
    }).delay(0, this);
  },

  onFileSystemReady: function(fileSystem) {
    var options = {
      create: true,
      exclusive: false
    };

    fileSystem.root.getFile(this.getFileName(), options, this.bound('onFileLoadSuccess'), this.bound('onError'));
  },

  onFileLoadSuccess: function(file) {
    this.file = file;
    this._start();
  },

  onError: function() {
    clearInterval(this.timer);
    this.fireEvent('cancel');
    this.fireEvent('error');
    this.media = null;
    if (this.file) this.file.remove(function() {}, function() {});
  },

  onCaptureError: function() {
    var canceled = this.canceled;
    this.canceled = false;
    if (canceled) return;

    clearInterval(this.timer);
    this.fireEvent('cancel');
    this.fireEvent('error');
    this.media = null;
    this.file.remove(function() {}, function() {});
  },

  onPause: function() {
    clearInterval(this.timer);
    IdleTimer.enable();
    this.fireEvent('pause');
  },

  onStatus: function(status) {
    // We are calling .pause() when we get the duration but we don't want to fire the Pause event.
    if (this.statusEventIsDisabled) return;
    if (status == window.Media.MEDIA_PAUSED) this.onPause();
  },

  onLevelUpdate: function(averageLevel, peakLevel) {
    this.fireEvent('levelUpdate', [averageLevel, peakLevel]);
  },

  getFileName: function() {
    return this.filename + '.' + this.extension;
  }

});
