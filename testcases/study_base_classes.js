exports.TYPE_INT_32 = 0;
exports.TYPE_DOUBLE = 1;
exports.TYPE_STRING = 2;

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
<span id="upload-status"><a onclick="uploadData();">Submit my data! &raquo;</a>\
</span></div> \
      <p>&nbsp;</p>';
  },

  get thinkThereIsAnError() {
      return '<li>If you think there is an error in this data, \
    <a onclick="openLink(\'http://groups.google.com/group/mozilla-labs-testpilot\');">\
    click here to post a message</a> to notify the Test Pilot team about it.</li>';
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
      '<p>The ' + this.titleLink + ' study is currently in progress.</p>' +
    '<p>' + this.expInfo.summary + '</p>' +
    '<p> The study will end in ' + this.expInfo.duration + ' days. Read more details for this ' + this.titleLink + ' study.\</p>\
    <ul><li>You can save your test graph or export the raw data now, or after you \
    submit your data.</li>' + this.thinkThereIsAnError +
      '<li>If you don\'t want to submit your data this time, ' +
      this.optOutLink + '.</li></ul>' + this.dataCanvas;
  },

  get completedHtml() {
    return '<h2>Excellent! You just finished the ' + this.titleLink + ' Study!</h2>' +
    '<b>The study is complete and your test data is ready to submit!</b>\
    <ul><li>You have 7 days to decide if you want to submit your data.  7 days \
    after the study is complete, your data will be automatically removed from \
    your computer if you don\'t submit it.</li>\
    <li>You can save your graph or export the raw data now or after you submit \
    you data.</li>' + this.thinkThereIsAnError +
    '<li>If you choose to cancel the study now, your data will be removed from \
    your computer immediately. You won\'t be able to see your chart or the raw \
    data after you cancel the study. You can ' + this.optOutLink +
    '.</li>' + this.uploadData + this.dataCanvas;
  },

  get upcomingHtml() {
    return '<h2>The ' + this.titleLink + ' study will begin soon.</h2>' +
        '<p>' + this.expInfo.summary + '</p>' +
        '<p>The study will start collecting data on <span id="startdate"></span>' +
        ' and finish on <span id="enddate"></span>.</p>' +
        this.inProgressDataPrivacyHtml +
        '<p>If you don\'t wish to participate, you can '+ this.optOutLink +
        '</p>';
  },

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
    <ul> <li>Please remember to save your test graph or export the raw data now if \
    you are interested!</li>\
    <li>If you choose not to save them, they will be removed from your computer \
    7 days after your submission.</li></ul>'
    + this.dataCanvas;
  },

  get dataExpiredHtml() {
  return '<h2>Your ' + this.titleLink + 'study data is expired.</h2> \
    <p>It has been more than 7 days since the study is completed. Since you \
    decided not to submit the data, it has been removed automatically from your \
    computer.  Sorry we won\'t be able to show your data anymore.';
  },

  get deletedRemainDataHtml() {
    return '<h2>Your ' + this.titleLink + 'study data is removed.</h2> \
    <ul><li>All the data that was collected has been transmitted to Mozilla and \
    removed from your computer.</li> \
    <li>The results of the study will be available soon.  When they are ready \
    to view, Test Pilot will let you know.</li></ul>';
  },

  get inProgressDataPrivacyHtml() {
    return '<p>At the end of the study, you will be prompted to choose whether you want to \
    submit your test data or not. All test data you submit will be \
    anonymized and will not be personally identifiable. We do not record \
    any search terms or what sites you visit.</p>';
  },

  completedDataPrivacyHtml: '<p>All test data you submit will be \
    anonymized and will not be personally identifiable. \
    After we\'ve analyzed the data from all submissions, you will be able \
    to see the new study findings by clicking on the Test Pilot icon \
    and choosing "All your studies".</p>',

  canceledDataPrivacyHtml: "",
  dataExpiredDataPrivacyHtml: "",
  remainDataPrivacyHtml:"",
  deletedRemainDataPrivacyHtml: "",

  onPageLoad: function(experiment, document, graphUtils) {
    // Override me!
  },

  drawPieChart: function(canvas, dataSet) {
    // dataSet should be a series of {name: "name", frequency: 55}
    let origin  = { x: 110, y: 125 };
    let radius = 100;

    if (dataSet.length == 0) {
      return;
    }
    if (!canvas) {
      return;
    }
    let ctx = canvas.getContext("2d");

    let i, total = 0;
    for (i = 0; i < dataSet.length; i++) {
      total += dataSet[i].frequency;
    }

    let colors = ["red", "blue", "green", "yellow", "black", "orange",
                  "purple", "white", "pink", "grey"];
    // TODO algorithmically generate colors so we have an infinite number
    // with high contrast!
    ctx.mozTextStyle = "12pt sans serif";
    let sumAngle = 0;
    for (i = 0; i < dataSet.length; i++) {
      let angle = 2*Math.PI * dataSet[i].frequency / total;
      ctx.fillStyle = colors[i % (colors.length)];

      ctx.beginPath();
      ctx.moveTo( origin.x, origin.y);
      ctx.lineTo( origin.x + radius * Math.cos( sumAngle ),
                  origin.y + radius * Math.sin( sumAngle ) );
      ctx.arc( origin.x, origin.y, radius, sumAngle, sumAngle + angle, false);
      ctx.lineTo( origin.x, origin.y );
      ctx.fill();
      ctx.stroke();

      sumAngle += angle;

      if (i < 6) {
        ctx.mozTextStyle = "10pt sans serif";
        ctx.fillStyle = colors[i];
        ctx.fillRect( 220, 10 + 30 * i, 20, 20);
        ctx.strokeRect( 220, 10 + 30 * i, 20, 20);
        ctx.fillStyle = "black";
        ctx.save();
        ctx.translate( 245, 25 + 30 * i );
        let percent = Math.round( 100 * dataSet[i].frequency /total);
        let line1 = dataSet[i].name + ": " + dataSet[i].frequency
            + " (" + percent + "%)";
        ctx.mozDrawText( line1 );
        ctx.restore();
      }
    }
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
        let newObserver = new this._windowObserverClass(window, this);
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
  },

  onExperimentShutdown: function() {
    this.uninstallAll();
  },

  doExperimentCleanup: function() {
    dump("Base classes. doExperimentCleanup() called.\n");
  },

  onEnterPrivateBrowsing: function() {
    // Don't record any events when in private mode
    this.privateMode = true;
  },

  onExitPrivateBrowsing: function() {
    this.privateMode = false;
  },

  uninstallAll: function() {
    for (let i = 0; i < this._windowObservers.length; i++) {
      this._windowObservers[i].uninstall();
    }
    this._windowObservers = [];
  },

  record: function(event, callback) {
    if (!this.privateMode) {
      this._store.storeEvent(event, callback);
    } else {
      if (callback) {
        callback(false);
      }
    }
  }
};

exports.GenericWindowObserver = function(window, globalInstance) {
  this.window = window;
  this._registeredListeners = [];
  this._globalObserverInstance = globalInstance;
};
exports.GenericWindowObserver.prototype = {
  _listen: function GenericWindowObserver__listen(container,
                                                  eventName,
                                                  method,
                                                  catchCap) {
    if (!container) {
      console.warn("Can't attach listener: container is null.");
      return;
    }
    try {
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

    }
    catch(ex) {
      console.warn("Failed to attach listener: " + [ex, container,
        eventName, method, catchCap, Error().stack]);
    }
  },

  install: function GenericWindowObserver_install() {
    // override this
  },

  uninstall: function GenericWindowObserver_uninstall() {
    for (let i = 0; i < this._registeredListeners.length; i++) {
      let rl = this._registeredListeners[i];
      rl.container.removeEventListener(rl.eventName, rl.handler, rl.catchCap);
    }
  },

  record: function(event) {
    this._globalObserverInstance.record(event);
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

// Cleanup code that is always run on first load of remote code
function globalCleanup() {
  // Delete global site hash pref
  // Truncate error log file if too long
  // Delete no longer needed files in test pilot directory
  // Restore preferences that are "Custom Value" to default value
  dump("Running global cleanup code from study base classes.\n");
}
globalCleanup();