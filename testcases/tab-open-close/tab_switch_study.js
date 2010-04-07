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

// TODO add columns:  parent_tab?   is_search_results ?
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

  getNextWindowId: function() {
    let id = this._nextWindowId;
    this._nextWindowId ++;
    return id;
  },

  cleanup: function() {
    dump("Tab study ObserverHelper.cleanup()\n");
    // Uninstall all installed observers
    for (let i = 0; i < this._installedObservers.length; i++) {
      this._installedObservers[i].uninstall();
    }
  },

  // for handlers API:
  onNewWindow: function(window) {
    dump("Tab study ObserverHelper.onNewWindow()\n");
    // Create an observer for each window.
    let windowId = this._nextWindowId;
    this._installedObservers.push( new TabWindowObserver(window, this._dataStore));
    console.info("Pushed a tab observer in onNewWindow.");

    // Record the window-opening event:
    if (!this.privateMode) {
      this._dataStore.storeEvent({
        event_code: TabsExperimentConstants.OPEN_WINDOW_EVENT,
        timestamp: Date.now(),
        num_tabs: window.getBrowser().tabContainer.itemCount,
        tab_window: windowId
      });
    }
  },

  onWindowClosed: function(window) {
    dump("Tab study ObserverHelper.onWindowClosed()\n");
    // TODO any tabs that are still open, let's use session restore API
    // to store the tab GUIDs for late restoration.
    for (let i=0; i < this._installedObservers.length; i++) {
      if (this._installedObservers[i]._window == window) {
        console.info("Uninstalled a tab observer in onWindowClosed.");
        this._installedObservers[i].uninstall();
        // Record the window-closing event:
        console.info("Uninstalling tabsExperimentObserver.");
        let windowId = this._installedObservers[i]._windowId;
        if (!this.privateMode) {
          this._dataStore.storeEvent({
            event_code: TabsExperimentConstants.CLOSE_WINDOW_EVENT,
            timestamp: Date.now(),
            tab_window: windowId
          });
        }
        // TODO remove the uninstalled observer from the list?
      }
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
    this._dataStore.storeEvent({
      event_code: TabsExperimentConstants.STUDY_STATUS,
      tab_id: exports.experimentInfo.versionNumber,
      timestamp: Date.now()
    });

    // Install observers on all windows that are already open:
    console.info("Trying to install observers on already open windows.");
    let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                    .getService(Ci.nsIWindowMediator);
    let enumerator = wm.getEnumerator("navigator:browser");
    while(enumerator.hasMoreElements()) {
      let win = enumerator.getNext();
      this._installedObservers.push( new TabWindowObserver(win, this._dataStore));
    }
    console.info("I did it.");
    // TODO BUT---!! we don't want to double-register on windows open at
    // startup! I guess we should look at whether a window already has listeners
    // registered on it or not...
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
function TabWindowObserver(window, store) {
  this._init(window, store);
};
TabWindowObserver.prototype = {
  _init: function TabsExperimentObserver__init(window, store) {
    dump("Tab study TabWindowObserver._init()\n");
    this._lastEventWasClick = null;
    this._window = window;
    this._dataStore = store;

    let windowId = ObserverHelper.sessionStore.getWindowValue(window,
                                                              WINDOW_ID_ATTR);
    if (windowId != "") {
      this._windowId = windowId;
    } else {
      // doesn't have a windowId yet - make one up:
      this._windowId = ObserverHelper.getNextWindowId();
      ObserverHelper.sessionStore.setWindowValue(window,
                                                 WINDOW_ID_ATTR,
                                                 this._windowId);
    }
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
    this._recordEvent(event.target, TabsExperimentConstants.DRAG_EVENT,
                      TabsExperimentConstants.UI_CLICK);
  },

  onDrop: function TabsExperimentObserver_onDrop(event) {
    console.info("You dropped a dragged tab.");
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

// TODO my experimentID must be passed along to other pages such as status-quit.html.
exports.webContent = {
  inProgressHtml: ' <h2>Hello Test Pilot,</h2> \
    <h3>Thank you for helping with our <a href="https://testpilot.mozillalabs.com/testcases/tab-open-close.html">"Tab Open/Close" </a>study.</h3> \
    <p><b>This study aims to understand what users typically do next after opening or closing a tab.</b> You don\'t have to do anything except use the Web normally.</p> \
    <p>When you interact with tabs, Test Pilot will record what you do (open/close/switch etc) and when you do it (timestamp). We will then analyze this data to detect patterns that will help us build a better browser. More information is available on <a href="https://testpilot.mozillalabs.com/testcases/tab-open-close.html">the study\'s website.</a></p> \
    <p>So, buckle up and get ready for your first flight! </p> \
    <h4>This study is currently running.  It will end <span id="test-end-time"></span>. If you don\'t want to participate, please <a href="chrome://testpilot/content/status-quit.html?eid=1">click here to quit</a>.</h4> \
    <h3>The fine print:</h3> \
      <ul> \
	<li>The websites (URLs) that you visit will never be recorded.</li> \
    <li>At the end of the test, you will be able to choose if you want to submit your test data or not.</li> \
       <li>All test data you submit will be anonymized and will not be personally identifiable.</li> \
      </ul> \
	<div class="dataBox"> \
          <h3>View Your Data:</h3> \
 	  <p>You are using the <span id="md-locale"></span> language version of Firefox <span id="md-version"></span> on <span id="md-os"></span> with <span id="md-num-ext"></span> installed.</p> \
	  <p>The graphs below are just two examples of the kind of questions we\'ll be able to answer using the data collected in this study.  If you like, you can look at <a onclick="showRawData(1);">the complete raw data set</a> which we hope will be able to answer many other questions as well.</p> \
	  <p>1. How many tabs did you have open at a time? <a href="https://testpilot.mozillalabs.com/testcases/tab-open-close.html">(More info...)</a></p> \
          <canvas id="tabs-over-time-canvas" width="450" height="220"></canvas> \
	  <p>2. When you closed a tab, did you stay on the default tab or did you switch to another one immediately? <a href="https://testpilot.mozillalabs.com/testcases/tab-open-close.html">(More info...)</a></p> \
        <canvas id="tab-close-pie-chart-canvas" width="350" height="250"></canvas> \
        </div>',

  completedHtml: '<h2>Congratulations!</h2> \
    <h3>You have completed the <a href="">Tab Open/Close Study</a>!</h3> \
    <p>&nbsp;</p> \
    <div class="home_callout_continue"><img class="homeIcon" src="chrome://testpilot/skin/images/home_computer.png"> <span id="upload-status"><a onclick="uploadData();">Submit your data &raquo;</a></span></div> \
    <p>&nbsp;</p> \
    <p>We will analyze the data submitted by all Test Pilots in order to to detect patterns that will help us build a better browser.  When the analysis is done, we will let you know where you can see the results.</p>      <p><a onclick="showRawData(1);">Click here</a> to see a display of all the collected data in its raw form, exactly as it will be sent. If there is anything there that you are not comfortable with sending to us, you can <a href="chrome://testpilot/content/status-quit.html?eid=1">click here to delete the data without sending it</a>.</p> \
    <h3>The fine print:</h3> \
    <ul> \
      <li>The websites (URLs) that you visit have not been recorded.</li> \
      <li>All test data you submit will be anonymized and will not be personally identifiable.</li> \
      <li>After you submit the data, it will be deleted from your computer.</li> \
    </ul> \
    <div class="dataBox"> \
    <h3>View Your Data:</h3>\
    <p>You are using the <span id="md-locale"></span> language version of Firefox <span id="md-version"></span> on <span id="md-os"></span> with <span id="md-num-ext"></span> installed.</p> \
    <p>1. How many tabs did you have open at a time? <a href="https://testpilot.mozillalabs.com/testcases/tab-open-close.html">(More info...)</a></p> \
    <canvas id="tabs-over-time-canvas" width="450" height="220"></canvas> \
    <p>2. When you closed a tab, did you stay on the default tab or did you switch to another one immediately? <a href="https://testpilot.mozillalabs.com/testcases/tab-open-close.html">(More info...)</a></p> \
    <canvas id="tab-close-pie-chart-canvas" width="350" height="250"></canvas> \
    </div>',

  upcomingHtml: "",    // For tests which don't start automatically, this gets
                       // displayed in status page before test starts.

  _drawNumTabsTimeSeries: function(rawData, canvas, graphUtils) {
    let data = [];
    let row;
    let boundingRect = { originX: 40,
                         originY: 210,
                         width: 400,
                         height: 200 };
    // Time Series plot of tabs over time:
    let firstTimestamp = null;
    let maxTabs = 0;
    for (row = 0; row < rawData.length; row++) {
      if (row == 0) {
        firstTimestamp = rawData[row].timestamp;
      }
      if (rawData[row].num_tabs > maxTabs) {
        maxTabs = rawData[row].num_tabs;
      }
      if (row > 0) {
        data.push( [rawData[row].timestamp - firstTimestamp,
	            rawData[row-1].num_tabs] );
      }
      data.push( [ rawData[row].timestamp - firstTimestamp,
                   rawData[row].num_tabs ] );
    }

    let lastTimestamp = data[data.length - 1][0];

    let red = "rgb(200,0,0)";
    let axes = {xScale: boundingRect.width / lastTimestamp,
                yScale: boundingRect.height / maxTabs,
                xMin: firstTimestamp,
                xMax: lastTimestamp,
                yMin: 0,
                yMax: maxTabs };
    // drawTimeSeriesGraph is defined in client-side graphs.js
    graphUtils.drawTimeSeriesGraph(canvas, data, boundingRect, axes, red);
  },

  _drawTabClosePieChart: function(rawData, canvas, graphUtils) {
    let origin = {x: 125, y: 125};
    let radius = 100;
    let row;

    // Pie chart of close-and-switch vs. close-and-don't-switch
    let minTimeDiff = 5000; // 5 seconds

    let numCloseEvents = 0;
    let numSwitchEvents = 0;
    let numClosedAndSwitched = 0;
    let lastCloseEventTime = 0;

    // TODO should we interpret it differently if you close a tab that
    // is not the one you're looking at?
    for (row=0; row < rawData.length; row++) {
      if ( rawData[row].event_code == TabsExperimentConstants.CLOSE_EVENT ) {
        numCloseEvents ++;
        numSwitchEvents = 0;
        lastCloseEventTime = rawData[row].timestamp;
      }
      if (rawData[row].event_code == TabsExperimentConstants.SWITCH_EVENT ) {
       numSwitchEvents ++;
        if (numSwitchEvents == 2 &&
           (rawData[row].timestamp - lastCloseEventTime) <= minTimeDiff) {
          numClosedAndSwitched ++;
        }
      }
    }

    if (numCloseEvents > 0) {
      let data = [numClosedAndSwitched,
                  numCloseEvents - numClosedAndSwitched];
      graphUtils.drawPieChart(canvas, data, origin, radius,
                   ["rgb(200, 0, 0)", "rgb(0, 0, 200)"],
                   ["Switched", "Stayed"]);
    }
  },

  onPageLoad: function(experiment, document, graphUtils) {
    // Get raw data:
    let rawData = experiment.dataStoreAsJSON;
    // Graph it:
    if (rawData.length > 0) {
      let canvas1 = document.getElementById("tabs-over-time-canvas");
      let canvas2 = document.getElementById("tab-close-pie-chart-canvas");
      this._drawNumTabsTimeSeries(rawData, canvas1, graphUtils);
      this._drawTabClosePieChart(rawData, canvas2, graphUtils);
      return;
    } // Otherwise, there's nothing to graph.
  }
};