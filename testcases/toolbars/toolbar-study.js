const TYPE_INT_32 = 0;
const TYPE_DOUBLE = 1;

const ToolbarExperimentConstants = {
};

const TOOLBAR_EXPERIMENT_FILE = "testpilot_toolbar_study_results.sqlite";
const TOOLBAR_TABLE_NAME = "testpilot_toolbar_study";

var TOOLBAR_EXPERIMENT_COLUMNS =  [
  {property: "timestamp", type: TYPE_DOUBLE, displayName: "Time",
   displayValue: function(value) {return new Date(value).toLocaleString();}}
];


exports.experimentInfo = {
  startDate: null, // Null start date means we can start immediately.
  duration: 5, // Days
  testName: "Toolbar Study",
  testId: 6,
  testInfoUrl: null,
  summary: "Toolbar study",
  thumbnail: null,
  optInRequired: false,
  recursAutomatically: false,
  recurrenceInterval: 0,
  versionNumber: 1,
  minTPVersion: "1.0a1"
};

exports.dataStoreInfo = {
  fileName: TOOLBAR_EXPERIMENT_FILE,
  tableName: TOOLBAR_TABLE_NAME,
  columns: TOOLBAR_EXPERIMENT_COLUMNS
};

let GlobalToolbarObserver = {
  onNewWindow: function(window) {
  },

  onWindowClosed: function(window) {
  },

  onAppStartup: function() {
  },

  onAppShutdown: function() {
  },

  onExperimentStartup: function(store) {
    this._store = store;
  },

  onExperimentShutdown: function() {
  },

  onEnterPrivateBrowsing: function() {
    // Don't record any events when in private mode
    this.privateMode = true;
  },

  onExitPrivateBrowsing: function() {
    this.privateMode = false;
  }
};

exports.handlers = GlobalToolbarObserver;

require("unload").when(
  function myDestructor() {
  });


// The per-window observer class:
function ToolbarWindowObserver(window, windowId, store) {
  this._init(window, windowId, store);
};
ToolbarWindowObserver.prototype = {
  _init: function ToolbarWindowObserver__init(window, windowId, store) {
  },

  _listen: function TEO__listen(container, eventName, method, catchCap) {
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

  install: function ToolbarWindowObserver_install() {
    let self = this;
    let browser = this._window.getBrowser();
  },


  uninstall: function ToolbarWindowObserver_uninstall() {
    for (let i = 0; i < this._registeredListeners.length; i++) {
      let rl = this._registeredListeners[i];
      rl.container.removeEventListener(rl.eventName, rl.handler, rl.catchCap);
    }
  }
};


const FINE_PRINT = '<h3>The fine print:</h3> \
      <ul> \
	<li>The websites (URLs) that you visit will never be recorded.</li> \
    <li>At the end of the test, you will be able to choose if you want to submit your test data or not.</li> \
       <li>All test data you submit will be anonymized and will not be personally identifiable.</li> \
</ul>';

const DATA_CANVAS = '<div class="dataBox"> \
</div>';

exports.webContent = {
  inProgressHtml: '<h2>Thank you, Test Pilot!</h2>'
  + DATA_CANVAS,

  completedHtml: '<h2>Excellent! You just finished the Toolbar Study!</h2>\
<b>Please submit your test data.</b>\
    <p>&nbsp;</p> \
    <div class="home_callout_continue">\
<img class="homeIcon" src="chrome://testpilot/skin/images/home_computer.png">\
<span id="upload-status"><a onclick="uploadData();">Submit your data &raquo;</a>\
</span></div> \
    <p>&nbsp;</p> \
</p>All test data you submit will be anonymized and will not be personally identifiable.\
<b>After we analyze the data from all submissions, you will be able to see \
all new study findings by clicking on the Test Pilot icon on the bottom-right corner \
and choosing "All your studies".</b></p>\
<p>If you are not comfortable submitting your data this time, \
<a href="chrome://testpilot/content/status-quit.html?eid=6"> click here to cancel</a>.</p>'
 + DATA_CANVAS,

  upcomingHtml: "",    // For tests which don't start automatically, this gets
                       // displayed in status page before test starts.


  onPageLoad: function(experiment, document, graphUtils) {
  }
};