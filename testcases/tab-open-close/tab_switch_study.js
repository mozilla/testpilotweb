// A Securable Module to be loaded with Cuddlefish.

const TYPE_INT_32 = 0;
const TYPE_DOUBLE = 1;

const TabsExperimentConstants = {
  // constants for event_code
  STUDY_STATUS: 0,
  OPEN_EVENT: 1,
  CLOSE_EVENT: 2,
  DRAG_EVENT: 3,
  DROP_EVENT: 4,
  SWITCH_EVENT: 5,
  LOAD_EVENT: 6,
  STARTUP_EVENT: 7,
  SHUTDOWN_EVENT: 8,
  OPEN_WINDOW_EVENT: 9,
  CLOSE_WINDOW_EVENT: 10,

  // constants for ui_method
  UI_CLICK: 1,
  UI_KEYBOARD: 2,
  UI_MENU: 3,
  UI_LINK: 4,
  UI_URLENTRY: 5,
  UI_SEARCH: 6,
  UI_BOOKMARK: 7,
  UI_HISTORY: 8
};

// TODO: Add in the idle detection stuff from Week-in-the-life?

const TABS_EXPERIMENT_FILE = "testpilot_tabs_experiment_results_2.sqlite";
/* In this schema, each row represents a single UI event. */
const TABS_TABLE_NAME = "testpilot_tabs_experiment_2";
const TAB_ID_ATTR = "TestPilotTabStudyTabId";
const WINDOW_ID_ATTR = "TestPilotTabStudyWindowId";

// TODO add columns:  parent_tab?
var TABS_EXPERIMENT_COLUMNS =  [
  {property: "event_code", type: TYPE_INT_32, displayName: "Event",
   displayValue: ["Study status", "Open", "Close", "Drag", "Drop", "Switch",
                  "Load", "Startup", "Shutdown", "Window Open", "Window Close"]},
  {property: "tab_id", type: TYPE_DOUBLE, displayName: "Tab ID"},
  {property: "tab_position", type: TYPE_INT_32, displayName: "Tab Pos."},
  {property: "tab_window", type: TYPE_INT_32, displayName: "Window ID"},
  {property: "ui_method", type: TYPE_INT_32, displayName: "UI Method",
   displayValue: ["", "Click", "Keyboard", "Menu", "Link", "URL Entry", "Search",
              "Bookmark", "History"]},
  {property: "tab_site_hash", type: TYPE_INT_32, displayName: "Tab Group ID"},
  {property: "is_search_results", type: TYPE_INT_32, displayName: "Search results?"},
  {property: "num_tabs", type: TYPE_INT_32, displayName: "Num. Tabs"},
  {property: "timestamp", type: TYPE_DOUBLE, displayName: "Time",
   displayValue: function(value) {return new Date(value).toLocaleString();}}];


// This is a different study from the Tab Switch study!
exports.experimentInfo = {
  startDate: null, // Null start date means we can start immediately.
  duration: 7, // Days
  testName: "Tab Switch Study",
  testId: 5,
  testInfoUrl: "https://testpilot.mozillalabs.com/testcases/tab-open-close.html",
  summary: "Do people switch more often among a group of related tabs than they "
           + "do between unrelated tabs?  This study is to test that hypothesis.",
  thumbnail: "https://testpilot.mozillalabs.com/testcases/tab-open-close/tab-study-thumbnail.png",
  optInRequired: false,
  recursAutomatically: false,
  recurrenceInterval: 0,
  versionNumber: 1 // for minor changes in format within the same experiment
};

exports.dataStoreInfo = {
  fileName: TABS_EXPERIMENT_FILE,
  tableName: TABS_TABLE_NAME,
  columns: TABS_EXPERIMENT_COLUMNS
};

let ObserverHelper = {
  /* TODO: Make nextWindowId, nextTabId, nextTabGroupId, and tempHostHash
   * all persistent across runs.
   */
  _nextWindowId: 1,
  _nextTabGroupId: 0,
  _tempHostHash: {},
  _installedObservers: [],
  _dataStore: null,
  privateMode: false,
  nextTabId: 0,

  _sessionStore: null,
  get sessionStore() {
    if (!this._sessionStore) {
      this._sessionStore = Cc["@mozilla.org/browser/sessionstore;1"]
                    .getService(Ci.nsISessionStore);
    }
    return this._sessionStore;
  },

  getTabGroupIdFromUrl: function(url) {
    var ioService = Cc["@mozilla.org/network/io-service;1"]
                      .getService(Ci.nsIIOService);
    // TODO this next line can sometimes throw a data:no exception.
    // It doesn't seem to cause any serious problems.
    let host = ioService.newURI(url, null, null).host;

    if (this._tempHostHash[host] == undefined) {
      this._tempHostHash[host] = this._nextTabGroupId;
      this._nextTabGroupId ++;
    }
    return this._tempHostHash[host];
  },

  _getNextWindowId: function() {
    let id = this._nextWindowId;
    this._nextWindowId ++;
    return id;
  },

  _getIdFromWindow: function(window) {
    let id = this.sessionStore.getWindowValue(window, WINDOW_ID_ATTR);
    if (id == "") {
      return null;
    } else {
      return id;
    }
  },

  _getObserverForWindow: function(window) {
    let windowId = this._getIdFromWindow(window);
    if (!windowId) {
      return null;
    }
    for (let i = 0; i < this._installedObservers.length; i++) {
      if (this._installedObservers[i]._windowId == windowId) {
        return this._installedObservers[i];
      }
    }
    return null;
  },

  _registerWindow: function(window) {
    // First check window doesn't already have registration, so that this
    // function can be called multiple times with no ill effect:
    dump("in _registerWindow.\n");
    let windowId = this._getIdFromWindow(window);
    if (windowId) {
      dump("This window has an ID already!\n");
      if (this._getObserverForWindow(window)) {
        dump("This window is already registered.\n");
        return;
      }
    }

    // OK, we don't already have registration on this window... start one
    if (!windowId) {
      dump("Establishing ID for this window.\n");
      // Create and store a new window ID:
      windowId = this._getNextWindowId();
      this.sessionStore.setWindowValue(window, WINDOW_ID_ATTR, windowId);
    }
    let newObserver = new TabWindowObserver(window, windowId, this._dataStore);
    this._installedObservers.push(newObserver);
    dump("Done registering window.\n");
  },

  cleanup: function() {
    dump("Tab study ObserverHelper.cleanup()\n");
    // Uninstall all installed observers
    for (let i = 0; i < this._installedObservers.length; i++) {
      this._installedObservers[i].uninstall();
    }
    this._installedObservers = [];
  },

  // for handlers API:
  onNewWindow: function(window) {
    dump("Tab study ObserverHelper.onNewWindow()\n");
    // Create an observer for each window.
    this._registerWindow(window);
    let id = this._getIdFromWindow(window);
    console.info("Pushed a tab observer in onNewWindow.");

    // Record the window-opening event:
    if (!this.privateMode) {
      this._dataStore.storeEvent({
        event_code: TabsExperimentConstants.OPEN_WINDOW_EVENT,
        timestamp: Date.now(),
        num_tabs: window.getBrowser().tabContainer.itemCount,
        tab_window: id
      });
    }
  },

  onWindowClosed: function(window) {
    dump("Tab study ObserverHelper.onWindowClosed()\n");
    let observer = this._getObserverForWindow(window);
    if (observer) {
      console.info("Uninstalled a tab observer in onWindowClosed.");
      observer.uninstall();
      let index = this._installedObservers.indexOf(observer);
      this._installedObservers.splice(index, 1);
      dump("Uninstalled and deleted observer " + index + "\n");
    }

    // Record the window-closing event:
    let windowId = getIdFromWindow(window);
    if (!this.privateMode) {
      this._dataStore.storeEvent({
        event_code: TabsExperimentConstants.CLOSE_WINDOW_EVENT,
        timestamp: Date.now(),
        tab_window: windowId
      });
    }
  },

  onAppStartup: function() {
    dump("Tab study ObserverHelper.onAppStartup()\n");
    // Record app startup event:
    this._dataStore.storeEvent({
      event_code: TabsExperimentConstants.STARTUP_EVENT,
      timestamp: Date.now()
    });
  },

  onAppShutdown: function() {
    dump("Tab study ObserverHelper.onAppShutdown()\n");
    this._dataStore.storeEvent({
      event_code: TabsExperimentConstants.SHUTDOWN_EVENT,
      timestamp: Date.now()
    });
  },

  onExperimentStartup: function(store) {
    dump("Tab study ObserverHelper.onExperimentStartup()\n");
    this._dataStore = store;
    // Record study version:
    // NOTE we're overloading tab_id to store the study version number
    // which is lame but much easier than adding a dedicated column at this
    // point.
    dump("Storing study status...\n");
    this._dataStore.storeEvent({
      event_code: TabsExperimentConstants.STUDY_STATUS,
      tab_id: exports.experimentInfo.versionNumber,
      timestamp: Date.now()
    });
    dump("Done storing study status.\n");

    // Install observers on all windows that are already open:
    console.info("Trying to install observers on already open windows.");
    let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                    .getService(Ci.nsIWindowMediator);
    let enumerator = wm.getEnumerator("navigator:browser");
    while(enumerator.hasMoreElements()) {
      dump("Gonna register a window...\n");
      let win = enumerator.getNext();
      dump("Here is the window...\n");
      this._registerWindow(win);
    }
    console.info("I did it.");
    dump("Done with Tab Study onExperimentStartup.\n");
  },

  onExperimentShutdown: function() {
    dump("Tab study ObserverHelper.onExperimentShutdown()\n");
    console.info("Shutting down experiment, cleaning up observers.");
    this.cleanup();
  },

  onEnterPrivateBrowsing: function() {
    // Don't record any events when in private mode
    this.privateMode = true;
  },

  onExitPrivateBrowsing: function() {
    this.privateMode = false;
  }

};

exports.handlers = ObserverHelper;

/* Ensure that when this module is unloaded, all observers get uninstalled
 * too. */
require("unload").when(
  function myDestructor() {
    ObserverHelper.cleanup();
  });


// The per-window observer class:
function TabWindowObserver(window, windowId, store) {
  this._init(window, windowId, store);
};
TabWindowObserver.prototype = {
  _init: function TabsExperimentObserver__init(window, windowId, store) {
    dump("Tab study TabWindowObserver._init()\n");
    this._lastEventWasClick = null;
    this._window = window;
    this._dataStore = store;
    this._windowId = windowId;
    this._registeredListeners = [];
    this.install();
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

  _assignTabId: function TabsExperimentObserver__assignTabId( tabElem ) {
    let tabId = exports.handlers.nextTabId;
    ObserverHelper.sessionStore.setTabValue( tabElem, TAB_ID_ATTR, tabId);
    dump("Stored tab id = " + tabId + " in session store for this tab.");
    console.info("Tab opened - assigning tab ID of " + tabId + " to a " + tabElem.tagName);
    exports.handlers.nextTabId ++;
  },

  install: function TabsExperimentObserver_install() {
    dump("Tab study TabWindowObserver.install()\n");
    let self = this;
    let browser = this._window.getBrowser();
    let container = browser.tabContainer;
    console.info("Installing tabsExperimentObserver on a window!");
    // Can we catch the click event during the capturing phase??
    // last argument of addEventListener is true to catch during capture, false to catch during bubbling.

    this._listen(container, "TabOpen", this.onTabOpened, false);
    this._listen(container, "TabClose", this.onTabClosed, false);
    this._listen(container, "TabSelect", this.onTabSelected, false);
    this._listen(container, "dragstart", this.onDragStart, false);
    this._listen(container, "drop", this.onDrop, false);
    // TODO what other events can we listen for here?  What if we put the
    // listener on the browser or the window?

    this._listen(container, "mousedown", this.onClick, true);
    this._listen(container, "mouseup", this.onMouseUp, true);
    //this._listen(container, "keydown", this.onKey, true);

    // apparently there are events called ondragover, ondragleave, ondragstart,
    // ondragend, and ondrop.

    // For URL loads, we register a DOMContentLoaded on the appcontent:
    let appcontent = this._window.document.getElementById("appcontent");
    if (appcontent) {
      this._listen(appcontent, "DOMContentLoaded", this.onUrlLoad, true);
    }

    //https://developer.mozilla.org/en/nsISessionStore

    // Try:  sessionStore.setTabValue(domNode, key, value)
    // and sessionStore.getTabValue(domNode, key)
    //

    // This can be used to persist the site id hash too?
  },

  _recordEvent: function TabsExperimentObserver__recordEvent(tab,
                                                             evtCode,
                                                             uiMethod,
                                                             overrides) {
    if (!overrides) {
      overrides = {};
    }
    // TODO gets an error msg that 'getIndexOfItem' is not function...
    // (when called from load events)
    let index = tab.parentNode.getIndexOfItem(tab);
    let count = tab.parentNode.itemCount;
    let tabId = ObserverHelper.sessionStore.getTabValue(tab, TAB_ID_ATTR);
    let windowId = this._windowId;
    if (!ObserverHelper.privateMode) {
      this._dataStore.storeEvent({
        event_code: evtCode,
        timestamp: Date.now(),
        tab_id: overrides.tabId ? overrides.tabId : tabId,
        tab_position: overrides.index ? overrides.index : index,
        num_tabs: overrides.count ? overrides.count : count,
        ui_method: uiMethod,
        tab_window: overrides.windowId ? overrides.windowId : windowId,
        tab_site_hash: overrides.group? overrides.group: 0
      });
    }
    // TODO record is_search_results column
  },

  uninstall: function TabsExperimentObserver_uninstall() {
    dump("Tab study TabWindowObserver.uninstall()\n");
    for (let i = 0; i < this._registeredListeners.length; i++) {
      let rl = this._registeredListeners[i];
      rl.container.removeEventListener(rl.eventName, rl.handler, rl.catchCap);
    }
  },

  onClick: function TabsExperimentObserver_onClick(event) {
    console.info("You clicked on tabs bar.");
    this._lastEventWasClick = true;
  },

  onMouseUp: function TabsExperimentObserver_onMouseUp(event) {
    console.info("You released your click on the tabs bar.");
    this._lastEventWasClick = false;
  },

  onDragStart: function TabsExperimentObserver_onDragStart(event) {
    console.info("You started dragging a tab.");
    dump("Recording tab drag.\n");
    this._recordEvent(event.target, TabsExperimentConstants.DRAG_EVENT,
                      TabsExperimentConstants.UI_CLICK);
  },

  onDrop: function TabsExperimentObserver_onDrop(event) {
    console.info("You dropped a dragged tab.");
    dump("Recording tab drop.\n");
    console.info("Index is " + index );
    this._recordEvent(event.target, TabsExperimentConstants.DROP_EVENT,
                      TabsExperimentConstants.UI_CLICK);
  },

  getUrlInTab: function TabsExperimentObserver_getUrlInTab(index) {
    let tabbrowser = this._window.getBrowser();
    let currentBrowser = tabbrowser.getBrowserAtIndex(index);
    if (!currentBrowser.currentURI) {
      return null;
    }
    return currentBrowser.currentURI.spec;
  },

  onUrlLoad: function TabsExperimentObserver_onUrlLoaded(event) {
    dump("Recording url load.\n");
    let url = event.originalTarget.URL;
    let tabBrowserSet = this._window.getBrowser();
    let browser = tabBrowserSet.getBrowserForDocument(event.target);
    if (!browser) {
      return;
    }

    let index = null;
    for (let i = 0; i < tabBrowserSet.browsers.length; i ++) {
      if (tabBrowserSet.getBrowserAtIndex(i) == browser) {
	index = i;
	break;
      }
    }
    // TODO move groupId detection to _recordEvent so it happens every time
    let groupId = ObserverHelper.getTabGroupIdFromUrl(url);

    // TODO is browser the right object here?
    this._recordEvent(browser, TabsExperimentConstants.LOAD_EVENT,
                      TabsExperimentConstants.UI_CLICK,
                      {index: index, count: tabBrowserSet.browsers.length,
                       group: groupId});
    // TODO UI method
  },

  onTabOpened: function TabsExperimentObserver_onTabOpened(event) {
    console.info("Tab opened. Last event was click? " + this._lastEventWasClick );
    // TODO Not registering click here on open events -- because mouse up and
    // mousedown both happen before the tab open event.
    let uiMethod = this._lastEventWasClick ? TabsExperimentConstants.UI_CLICK:TabsExperimentConstants.UI_KEYBOARD;
    console.info("Recording uiMethod of " + uiMethod );
    let url = this.getUrlInTab(index);
    if (url == "about:blank") {
      // Url will be undefined if you open a new blank tab, but it will be
      // "about:blank" if you opened the tab through a link (or by opening a
      // recently-closed tab from the history menu).  Go figure.
      uiMethod = TabsExperimentConstants.UI_LINK;
    }
    this._assignTabId(event.target);

    this._recordEvent(event.target, TabsExperimentConstants.OPEN_EVENT,
                      uiMethod);
    // event has properties:
    // target, originalTarget, currentTarget, type.
    // Target is the tab.  currentTarget is the tabset (xul:tabs).
  },

  onTabClosed: function TabsExperimentObserver_onTabClosed(event) {
    console.info("Tab closed.");

    // TODO not registering click here on close events.
    // cuz mouseup and mousedown both happen before the tab open event.
    let uiMethod = this._lastEventWasClick ? TabsExperimentConstants.UI_CLICK:TabsExperimentConstants.UI_KEYBOARD;
    this._recordEvent(event.target, TabsExperimentConstants.CLOSE_EVENT,
                      uiMethod);
  },

  onTabSelected: function TabsExperimentObserver_onTabSelected(event) {
    // TODO there is an automatic tab-selection event after each open and
    // after each close.  Right now these get listed as 'keyboard', which is
    // not accurate.  Should we try to figure them out and mark them as auto-
    // matic?
    console.info("Tab selected.  Last event was click? " + this._lastEventWasClick );
    let uiMethod = this._lastEventWasClick ? TabsExperimentConstants.UI_CLICK:TabsExperimentConstants.UI_KEYBOARD;

    console.info("Recording uiMethod of " + uiMethod );
    this._recordEvent(event.target, TabsExperimentConstants.SWITCH_EVENT,
                      uiMethod);
  }
};


const FINE_PRINT = '<h3>The fine print:</h3> \
      <ul> \
	<li>The websites (URLs) that you visit will never be recorded.</li> \
    <li>At the end of the test, you will be able to choose if you want to submit your test data or not.</li> \
       <li>All test data you submit will be anonymized and will not be personally identifiable.</li> \
</ul>';

const DATA_CANVAS = '<div class="dataBox"> \
    <h3>View Your Data:</h3>\
    <p>You are using the <span id="md-locale"></span> language version\
    of Firefox <span id="md-version"></span> on <span id="md-os"></span>\
    with <span id="md-num-ext"></span> installed.</p> \
    <p><a onclick="showRawData(5);">Click here</a> to see a display of all\
    the collected data in its raw form, exactly as it will be sent.</p>\
    <canvas id="tab-switch-arcs" width="450" height="220"></canvas> \
</div>';

exports.webContent = {
  inProgressHtml: ' <h2>Hello Test Pilot,</h2> \
    <h3>Thank you for helping with our Tab Switch Study!</h3> \
    <p><b>This study aims to understand how tab switch events are clustered.</b></p> \
    <h4>This study is currently running.  It will end <span id="test-end-time"></span>. If you don\'t want to participate, please <a href="chrome://testpilot/content/status-quit.html?eid=5">click here to quit</a>.</h4>'
    + FINE_PRINT + DATA_CANVAS,

  completedHtml: '<h2>Congratulations!</h2> \
    <h3>You have completed the <a href="">Tab Open/Close Study</a>!</h3> \
    <p>&nbsp;</p> \
    <div class="home_callout_continue"><img class="homeIcon" src="chrome://testpilot/skin/images/home_computer.png"> <span id="upload-status"><a onclick="uploadData();">Submit your data &raquo;</a></span></div> \
    <p>&nbsp;</p> \
    <p>We will analyze the data submitted by all Test Pilots in order to to detect patterns that will help us build a better browser.  When the analysis is done, we will let you know where you can see the results.</p>\
    <p> If there is anything there that you are not comfortable with sending to us, you can\
 <a href="chrome://testpilot/content/status-quit.html?eid=5">click here to \
delete the data without sending it</a>.</p>'
    + FINE_PRINT + DATA_CANVAS,

  upcomingHtml: "",    // For tests which don't start automatically, this gets
                       // displayed in status page before test starts.


  onPageLoad: function(experiment, document, graphUtils) {
    // Get raw data:
    let rawData = experiment.dataStoreAsJSON;
    // Graph it:
    if (rawData.length > 0) {
      let canvas1 = document.getElementById("tabs-over-time-canvas");
      let canvas2 = document.getElementById("tab-close-pie-chart-canvas");
    }
  }
};