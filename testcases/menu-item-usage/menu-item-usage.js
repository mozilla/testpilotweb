const TYPE_INT_32 = 0;
const TYPE_DOUBLE = 1;

exports.experimentInfo = {
  startDate: null,
  duration: 7,
  testName: "Menu Item Usage Study",
  testId: 4,
  testInfoUrl: "",
  testResultsUrl: "",
  optInRequired: false,
  recursAutomatically: false,
  recurrenceInterval: 0,
  versionNumber: 1
};

// How did the user activate the menu item?
const UI_METHOD_MOUSE = 0; // clicking through menus with mouse
const UI_METHOD_SHORTCUT = 1; // using shortcut key to activate directly
const UI_METHOD_ALT_NAV = 2; // navigation using alt key and choosing an item

const MENU_INTERACTION_ABORTED = -1;

var COLUMNS = [
  {property: "ui_method", type: TYPE_INT_32, displayName: "UI Method",
   displayValue: ["Mouse", "Keyboard shortcut", "Alt key navigation"]},
  {property: "start_menu_id", type: TYPE_INT_32,
   displayName: "Starting Menu"},
  {property: "explore_ms", type: TYPE_INT_32, displayName: "Milliseconds to find"},
  {property: "explore_num", type: TYPE_INT_32, displayName: "Number of menus explored"},
  {property: "menu_id", type: TYPE_INT_32, displayName: "Menu Chosen"},
  {property: "item_id", type: TYPE_INT_32, displayName: "Item Chosen"},
  {property: "timestamp", type: TYPE_DOUBLE, displayName: "Time of Menu Choice",
   displayValue: function(value) {return new Date(value).toLocaleString();}}];

exports.dataStoreInfo = {
  fileName: "testpilot_menu_item_usage_results.sqlite",
  tableName: "menu_item_usage_experiment",
  columns: COLUMNS
};

exports.handlers = {
  _dataStore: null,
  _registeredListeners: [],
  _listen: function(window, container, eventName, method, catchCap) {
    // Keep a record of this so that we can automatically unregister during
    // uninstall:
    let self = this;
    let handler = function(event) {
      method.call(self, event);
    };
    container.addEventListener(eventName, handler, catchCap);

    this._registeredListeners.push(
      {window: window, container: container, eventName: eventName,
       handler: handler, catchCap: catchCap});
  },

  onCmdMainSet: function(evt) {
    let tag = evt.sourceEvent.target;
    if (tag.tagName == "menuitem") {
      console.info("You picked a menu item with the mouse.");
      console.info("Command ID: " + tag.command);
    } else if (tag.tagName == "key") {
      console.info("You picked a menu item with the keyboard.");
      console.info("Command ID: " + tag.command);
    }
    // Other properties of interest:  tag.label, evt.sourceEvent.type,
    // evt.sourceEvent.keyCode
  },

  onCmdMenuBar: function(evt) {
    console.info("You used a menu item! (bar)");
    console.info("Source event is " + evt.sourceEvent);
  },

  /* Commands detected in the set:
   *
   *
   * Commands detected in the bar:
   *   "Firefox:About Mozilla Firefox", "Firefox:Preferences" (Mac)
   *
   * Commands not detected:
   *    Rest of the Firefox menu (Mac)
   *    Select All if by keyboard shortcut
   *    Copy if by keyboard shortcut
   */

  onMenuBarMouseDown: function(evt) {
    // Adding a mouseDown event listener to the mainMenuBar does not work
    // (on Mac) -- is this because the menu bar is outside the XUL window
    // and is owned by the OS?  Let's try it on Windows and see if it works...
    console.info("You mousedowned on menu bar!");
  },

  onNewWindow: function(window) {
    // Register listeners.

    let mainCommandSet = window.document.getElementById("mainCommandSet");
    let mainMenuBar = window.document.getElementById("main-menubar");
    this._listen(window, mainMenuBar, "mousedown", this.onMenuBarMouseDown, true);
    this._listen(window, mainMenuBar, "command", this.onCmdMenuBar, true);
    this._listen(window, mainCommandSet, "command", this.onCmdMainSet, true);
  },

  onWindowClosed: function(window) {
    // Unregister all registered listeners for this window.

    for (let i = 0; i < this._registeredListeners.length; i++) {
      let rl = this._registeredListeners[i];
      if (rl.window == window) {
        rl.container.removeEventListener(rl.eventName, rl.handler, rl.catchCap);
      }
    }
  },
  onAppStartup: function() {},
  onAppShutdown: function() {},
  onExperimentStartup: function(store) {
    this._dataStore = store;
  },
  onExperimentShutdown: function() {},
  onEnterPrivateBrowsing: function() {},
  onExitPrivateBrowsing: function() {}
};

exports.webContent = {
  inProgressHtml: 'You are running menu item usage study.',

  completedHtml: 'Thanks for completing menu item usage study.',

  upcomingHtml: "",

  onPageLoad: function(experiment, document, graphUtils) {
  }
};

//http://www.rgraph.net/