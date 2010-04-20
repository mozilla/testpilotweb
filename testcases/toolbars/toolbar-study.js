const TYPE_INT_32 = 0;
const TYPE_DOUBLE = 1;

const ToolbarWidget = {
  // which widget are you interacting with
  BACK: 0,
  FORWARD: 1,
  DROP_DOWN_RECENT_PAGE: 2,
  TOP_LEFT_ICON: 3,
  WINDOW_MENU_ICON: 4,
  MENU_BAR: 5,
  RELOAD: 6,
  STOP: 7,
  HOME: 8,
  SIDE_BUTTON_NEAR: 9,
  RSS_ICON: 10,
  BOOKMARK_STAR: 11,
  GO_BUTTON: 12,
  DROP_DOWN_MOST_VISITED: 13,
  DROP_DOWN_SEARCH: 14,
  SEARCH_ICON: 15,
  BOOKMARK_TOOLBAR_CLICK: 16,
  TAB_SCROLL_LEFT: 17,
  TAB_SCROLL_RIGHT: 18,
  NEW_TAB_BUTTON: 19,
  DROP_DOWN_LIST_TABS: 20,
  SCROLL_UP: 21,
  SCROLL_DOWN: 22,
  SCROLL_LEFT: 23,
  SCROLL_RIGHT: 24,
  STATUS_BAR_CLICK: 25,
  STATUS_BAR_LOCK: 26,
  CUSTOMIZE_TOOLBAR_MENU: 27
  // More?
};

const ToolbarAction = {
  CLICK: 0,
  FOCUS: 1,
  ENTER_URL: 2,
  SEARCH: 3,
  CLICK_SUGGESTION: 4,
  EXPLORE_SUGGESTIONS: 5,
  SWITCH_SEARCH_ENGINE: 6
  // More?
};

const ToolbarEvent = {
  ACTION: 0,
  CUSTOMIZE: 1,
  STUDY: 2
};

const TOOLBAR_EXPERIMENT_FILE = "testpilot_toolbar_study_results.sqlite";
const TOOLBAR_TABLE_NAME = "testpilot_toolbar_study";

/* On expeirment startup, if the user has customized their toolbars,
 * then we'll record a
 */

var TOOLBAR_EXPERIMENT_COLUMNS =  [
  {property: "event", type: TYPE_INT_32, displayName: "Event",
   displayValue: ["Action", "Customization", "Study Metadata"]},
  {property: "item_id", type: TYPE_INT_32, displayName: "Widget"},
  {property: "interaction_type", type: TYPE_INT_32,
   displayName: "Interaction"},
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
  privateMode: false,
  _store: null,
  _windowObservers: [],

  _getObserverForWindow: function(window) {
    for (let i = 0; i < this._windowObservers.length; i++) {
      if (this._windowObservers[i].window === window) {
        return this._windowObservers[i];
      }
    }
    return null;
  },

  _registerWindow: function(window) {
    if (this._getObserverForWindow(window) == null) {
      let newObserver = new ToolbarWindowObserver(window);
      this._windowObservers.push(newObserver);
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

    // TODO record study version.

    // TODO if there is customization, record the customized toolbar
    // order now.

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

  onEnterPrivateBrowsing: function() {
    // Don't record any events when in private mode
    this.privateMode = true;
  },

  onExitPrivateBrowsing: function() {
    this.privateMode = false;
  },

  record: function(event, itemId, interactionType) {
    if (!this.privateMode) {
      this._store.storeEvent({
        event: event,
        item_id: itemId,
        interaction_type: interactionType,
        timestamp: Date.now()
      });
    }
  },

  uninstallAll: function() {
    for (let i = 0; i < this._windowObservers.length; i++) {
      this._windowObservers[i].uninstall();
    }
    this._windowObservers = [];
  }
};

exports.handlers = GlobalToolbarObserver;

require("unload").when(
  function myDestructor() {
    GlobalToolbarObserver.uninstallAll();
  });


// The per-window observer class:
function ToolbarWindowObserver(window) {
  this._init(window);
};
ToolbarWindowObserver.prototype = {
  _init: function ToolbarWindowObserver__init(window) {
    this.window = window;
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
    let browser = this.window.getBrowser();
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
  inProgressHtml: '<h2>Thank you, Test Pilot!</h2>\
<p>You are currently in a study to find out how the Firefox toolbars are used.</p>\
 ' + DATA_CANVAS,

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