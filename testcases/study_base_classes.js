exports.TYPE_INT_32 = 0;
exports.TYPE_DOUBLE = 1;

exports.GenericWebContent = function(experimentInfo) {
  this.expInfo = experimentInfo;
};
exports.GenericWebContent.prototype = {
  get rawDataLink() {
    return '<p><a onclick="showRawData(' + this.expInfo.testId + ');">'
     + 'Click here</a> to see a display of all the collected data '
     + 'in its raw form, exactly as it will be sent.</p>';
  },

  get optOutLink() {
    return '<a href="chrome://testpilot/content/status-quit.html?eid='
    + this.expInfo.testId + '">click here to cancel</a>';
  },

  get uploadData() {
    return '<p>&nbsp;</p> \
    <div class="home_callout_continue">\
<img class="homeIcon" src="chrome://testpilot/skin/images/home_computer.png">\
<span id="upload-status"><a onclick="uploadData();">Submit your data &raquo;</a>\
</span></div> \
      <p>&nbsp;</p>';
  },

  get thinkThereIsAnError() {
      return '<p>If you think there is an error in this data, \
    <a onclick="openLink(\'http://groups.google.com/group/mozilla-labs-testpilot\');">\
    click here to post</a> a message to notify the Test Pilot team about it</p>';
  },

  get dataViewExplanation() {
    return "TODO override this with test-specific content";
  },

  get saveButtons() {
    return '<div><button type="button" \
    onclick="saveCanvas(document.getElementById(\'data-canvas\'))">\
    Save Graph</button>&nbsp;&nbsp;<button type="button"\
    onclick="exportData();">Export Data</button></div>';
  },

  get titleLink() {
    return '<a onclick="openLink(\'' +
      this.expInfo.testInfoUrl + '\');">&quot;' + this.expInfo.testName
      + '&quot;</a>';
  },

  get dataCanvas() {
    return '<div class="dataBox"><h3>View Your Data:</h3>' +
      this.dataViewExplanation + this.rawDataLink +
      '<canvas id="data-canvas" width="450" height="680"></canvas></div>' +
      this.saveButtons;
  },

  get inProgressHtml () {
    return '<h2>Thank you, Test Pilot!</h2>' +
    '<p><b>' + this.expInfo.summary + '</b></p>' +
    '<p>Read more details for the ' + this.titleLink + ' study.</p>\
    <p>You can save your test graph or export the raw data now, or after you \
    submit your data.</p>' +
      this.thinkThereIsAnError +
      '<p>If you don\'t want to submit your data this time, ' +
      this.optOutLink + '.</p>' + this.dataCanvas;
  },

  get completedHtml() {
    return '<h2>Excellent! You just finished the &quot;' +
      this.expInfo.testName + '&quot; Study!</h2>' +
    '<b>The study is complete and your test data is ready to submit!</b>\
    <p>You have 7 days to decide if you want to submit your data.  7 days \
    after the study is complete, your data will be automatically removed from \
    your computer if you don\'t submit it.</p>\
    <p>You can save your graph or export the raw data now or after you submit \
    you data.</p>' + this.thinkThereIsAnError +
    '<p>If you choose to cancel the study now, your data will be removed from \
    your computer immediately. You won\'t be able to see your chart or the raw \
    data after you cancel the study. You can ' + this.optOutLink +
    '.</p>' + this.uploadData + this.dataCanvas;
  },

  upcomingHtml: "",

  get canceledHtml() {
    return'<h2>You canceled the ' + this.titleLink + 'study.</h2> \
    <p>You have canceled this study so your data is removed. Sorry we won\'t \
    be able to show your data anymore.</p> \
    <p>Test Pilot will offer you new studies and surveys as they become \
    available.</p>';
  },

  get remainDataHtml() {
    return '<h2>Thank you for submitting your ' + this.titleLink +
    'study data!</h2> \
    <p>Please remember to save your test graph or export the raw data now if \
    you are interested!</p>\
    <p>If you choose not to save them, they will be removed from your computer \
    7 days after your submission.</p>'
    + dataCanvas;
  },

  get dataExpiredHtml() {
  return '<h2>Your ' + this.titleLink + 'study data is expired.</h2> \
    <p>It has been more than 7 days since the study is completed. Since you \
    decided not to submit the data, it has been removed automatically from your \
    computer.  Sorry we won\'t be able to show your data anymore.';
  },

  get deletedRemainDataHtml() {
    return '<h2>Your ' + this.titleLink + 'study data is removed.</h2> \
    <p>All the data that was collected has been transmitted to Mozilla and \
    removed from your computer.</p> \
    <p>The results of the study will be available soon.  When they are ready \
    to view, Test Pilot will let you know.</p>';
  },

  get inProgressDataPrivacyHtml() {
    return '<p>The study will end in ' + this.expInfo.duration + ' days.\
    <b>At the end of it, you will be prompted to choose whether you want to \
    submit your test data or not.</b> All test data you submit will be \
    anonymized and will not be personally identifiable. We do not record \
    any search terms or what sites you visit.</p>';
  },

  completedDataPrivacyHtml: '<p>All test data you submit will be \
    anonymized and will not be personally identifiable. The data you submit \
    will help us directly with improvements to the tab management interface. \
    <b>After we\'ve analyzed the data from all submissions, you will be able \
    to see the new study findings by clicking on the Test Pilot icon on the \
    bottom-right corner and choosing "All your studies".</b></p>',

  canceledDataPrivacyHtml: "",
  dataExpiredDataPrivacyHtml: "",
  remainDataPrivacyHtml: "",
  deletedRemainDataPrivacyHtml: "",

  onPageLoad: function(experiment, document, graphUtils) {
  }
};


exports.GenericGlobalObserver = function(windowHandler) {
  this.privateMode = false;
  this._store = null;
  this._windowObservers = [];
  this._windowObserverClass = windowHandler;
};
exports.GenericGlobalObserver.prototype = {
  _getObserverForWindow: function(window) {
    for (let i = 0; i < this._windowObservers.length; i++) {
      if (this._windowObservers[i].window === window) {
        return this._windowObservers[i];
      }
    }
    return null;
  },

  _registerWindow: function(window) {
    if (this._windowObserverClass) {
      if (this._getObserverForWindow(window) == null) {
        let newObserver = new this._windowObserverClass(window);
        newObserver.install();
        this._windowObservers.push(newObserver);
      }
    }
  },

  onNewWindow: function(window) {
    this._registerWindow(window);
  },

  onWindowClosed: function(window) {
    let obs = this._getObserverForWindow(window);
    if (obs) {
      obs.uninstall();
      let index = this._windowObservers.indexOf(obs);
      this._windowObservers[index] = null;
      this._windowObservers.splice(index, 1);
    }
  },

  onAppStartup: function() {
  },

  onAppShutdown: function() {
  },

  onExperimentStartup: function(store) {
    this._store = store;
    // Install observers on all windows that are already open:
    let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                    .getService(Ci.nsIWindowMediator);
    let enumerator = wm.getEnumerator("navigator:browser");
    while(enumerator.hasMoreElements()) {
      let win = enumerator.getNext();
      this._registerWindow(win);
    }
    dump("GenericGlobalObserver.onExperimentStartup.\n");
  },

  onExperimentShutdown: function() {
    dump("ExperimentShutdown called.\n");
    this.uninstallAll();
  },

  onEnterPrivateBrowsing: function() {
    // Don't record any events when in private mode
    this.privateMode = true;
  },

  onExitPrivateBrowsing: function() {
    this.privateMode = false;
  },

  uninstallAll: function() {
    dump("Gonna uninstall All window observers.\n");
    for (let i = 0; i < this._windowObservers.length; i++) {
      dump("Uninstalling a window observer!\n");
      this._windowObservers[i].uninstall();
    }
    this._windowObservers = [];
  }
};

exports.GenericWindowObserver = function(window) {
  dump("GenericWindowObserver constructed for " + window +".\n");
  this.window = window;
  this._registeredListeners = [];
};
exports.GenericWindowObserver.prototype = {
  _listen: function GenericWindowObserver__listen(container,
                                                  eventName,
                                                  method,
                                                  catchCap) {
    dump("Installing a listener.\n");
    // Keep a record of this so that we can automatically unregister during
    // uninstall:
    let self = this;
    let handler = function(event) {
      method.call(self, event);
    };
    container.addEventListener(eventName, handler, catchCap);

    this._registeredListeners.push(
      {container: container, eventName: eventName, handler: handler,
       catchCap: catchCap});
  },

  install: function GenericWindowObserver_install() {
  },

  uninstall: function ToolbarWindowObserver_uninstall() {
    dump("Uninstalling ye window observer.\n");
    for (let i = 0; i < this._registeredListeners.length; i++) {
      dump("Uninstalling a listener.\n");
      let rl = this._registeredListeners[i];
      rl.container.removeEventListener(rl.eventName, rl.handler, rl.catchCap);
    }
  }
};

exports.extend = function(subClass, baseClass) {
  //http://www.kevlindev.com/tutorials/javascript/inheritance/index.htm
  function inheritance() {}
  inheritance.prototype = baseClass.prototype;

  subClass.prototype = new inheritance();
  subClass.prototype.constructor = subClass;
  subClass.baseConstructor = baseClass;
  subClass.superClass = baseClass.prototype;
};