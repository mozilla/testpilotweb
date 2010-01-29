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

const UNDETECTABLE = -1; // Means there's a keyboard shortcut we can't detect

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

var CMD_ID_STRINGS = [
     // File menu:
  {name: "New Window", mouse: "cmd_newNavigator", key: "key_newNavigator"},
  {name: "New Tab", mouse: "cmd_newNavigatorTab", key: "key_newNavigatorTab"},
  {name: "Open Location", mouse: "Browser:OpenLocation", key: "focusURLBar"},
  {name: "Open File", mouse: "Browser:OpenFile", key: "openFileKb"},
  {name: "Close Window", mouse: "cmd_closeWindow", key: "key_closeWindow"},
  {name: "Close Tab", mouse: "cmd_close", key: "key_close"},
  {name: "Save Page As", mouse: "Browser:SavePage", key: "key_savePage"},
  {name: "Send Link", mouse: "Browser:SendLink", key: null},
  {name: "Page Setup", mouse: "cmd_pageSetup", key: null},
  {name: "Print Preview", mouse: "cmd_printPreview", key: null}, // Win only
  {name: "Print", mouse: "cmd_print", key: "printKb"},
  {name: "Import", mouse: "menu_import", key: null},
  {name: "Work Offline", mouse: "goOfflineMenuitem", key: null},
  {name: "Exit", mouse: "cmd_quitApplication", key: "key_quitApplication"},
  // On Mac this is in the Firefox menu and called Quit Firefox

  // Edit menu:
  {name: "Undo", mouse: "cmd_undo", key: UNDETECTABLE},
  {name: "Redo", mouse: "cmd_redo", key: UNDETECTABLE},
  {name: "Cut", mouse: "cmd_cut", key: UNDETECTABLE},
  {name: "Paste", mouse: "cmd_paste", key: UNDETECTABLE},
  {name: "Copy", mouse: "cmd_copy", key: UNDETECTABLE},
  {name: "Delete", mouse: "cmd_delete", key: UNDETECTABLE},
  {name: "Select All", mouse: "cmd_selectAll", key: UNDETECTABLE},
  {name: "Find", mouse: "cmd_find", key: "key_find"},
  {name: "Find Again", mouse: "cmd_findAgain", key: "key_findAgain"},
  {name: "Special Characters", mouse: UNDETECTABLE, key: UNDETECTABLE}, //Mac only

  //View menu:
  {name: "Toolbars/Menu Bar", mouse: UNDETECTABLE, key: UNDETECTABLE},
  {name: "Toolbars/Navigation Toolbar", mouse: UNDETECTABLE, key: UNDETECTABLE},
  {name: "Toolbars/Bookmarks Toolbar", mouse: UNDETECTABLE, key: UNDETECTABLE},
  {name: "Toolbars/Customize", mouse: "cmd_CustomizeToolbars", key: null},
  {name: "Status Bar", mouse: "cmd_toggleTaskbar", key: null},
  {name: "Sidebar/Bookmarks", mouse: "menu_bookmarksSidebar", key: UNDETECTABLE},
  {name: "Sidebar/History", mouse: "menu_historySidebar", key: UNDETECTABLE},
  {name: "Stop", mouse: "Browser:Stop", key: UNDETECTABLE},
  {name: "Reload", mouse: "Browser:ReloadOrDuplicate", key: "key_reload"},
  {name: "Zoom In", mouse: "cmd_fullZoomEnlarge", key: "key_fullZoomEnlarge"},
  {name: "Zoom Out", mouse: "cmd_fullZoomReduce", key: "key_fullZoomReduce"},
  {name: "Zoom/Reset", mouse: "cmd_fullZoomReset", key: "key_fullZoomReset"},
  {name: "Zoom Text Only", mouse: "cmd_fullZoomToggle", key: null},
  {name: "Page Style/No Style", mouse: "menu_pageStyleNoStyle", key: null},
  {name: "Page Style/Basic Page Style", mouse: "menu_pageStylePersistentOnly", key: null},
  {name: "Character Encoding/Autodetect/*", mouse: "chardet.*", key: null},
  {name: "Character Encoding/More Encodings/*", mouse: "charset.*", key: null},
  {name: "Character Encoding/Customize List", mouse: UNDETECTABLE, key: UNDETECTABLE},
  {name: "Character Encoding/Western", mouse: "charset.ISO-8859-1", key: null},
  {name: "Character Encoding/UTF-16", mouse: "UTF-16", key: null},
  {name: "View Source", mouse: "View:PageSource", key: "key_viewSource"},
  {name: "Full Screen", mouse: "fullScreenItem", key: "key_fullScreen"},

  //History menu:
  {name: "Back", mouse: "Browser:BackOrBackDuplicate", key: "goBackKb"},
  {name: "Forward", mouse: "Browser:ForwardOrForwardDuplicate", key:"goForwardKb"},
  {name: "Home", mouse: "historyMenuHome", key: "goHome"},
  {name: "Show All History", mouse: UNDETECTABLE, key: UNDETECTABLE},
  {name: "(User History Item)", mouse: INDISTINCT, key: null},
  {name: "Recently Closed Tab", mouse: INDISTINCT, key: null},
  {name: "Restore All Tabs", mouse: "menu_restoreAllTabs", key: null},
  {name: "Recently Closed Window", mouse: INDISTINCT, key: null},
  {name: "Restore All Windows", mouse: "menu_restoreAllWindows", key: null},

  //Bookmarks menu:
  {name: "Bookmark This Page", mouse: "Browser:AddBookmarkAs", key: "addBookmarkAsKb"},
  {name: "Subscribe to This Page", mouse: "subscribeToPageMenuitem", key: null},
  {name: "Bookmark All Tabs", mouse: "Browser:BookmarkAllTabs", key: "bookmarkAllTabsKb"},
  {name: "Organize Bookmarks", mouse: UNDETECTABLE, key: UNDETECTABLE},
  {name: "(User Bookmark Item)", mouse: INDISTINCT, key: null},

  //Tools menu:
  {name: "Web Search", mouse: "Tools:Search", key: "key_search"},
  {name: "Downloads", mouse: "Tools:Downloads", key: "key_openDownloads"},
  {name: "Add-Ons", mouse: "Tools:Addons", key: null},
  // TODO: how to handle menus added here by individual add-ons?
  {name: "Error Console", mouse: "javascriptConsole", key: UNDETECTABLE},
  {name: "Page Info", mouse: "View:PageInfo", key: "key_viewInfo"}, // No key on Windows
  {name: "Private Browsing", mouse: "Tools:PrivateBrowsing", key: "key_privatebrowsing"},
  {name: "Clear Recent History", mouse: "Tools:Sanitize", key: null},
  {name: "Options", mouse: "menu_preferences", key: null },
  // On Mac this is in the Firefox menu and called Preferences, and it has
  // a key (cmd-,) but we are notified as if it were a mouse event.

  //Windows menu (Mac Only):
  {name: "Minimize", mouse: UNDETECTABLE, key: UNDETECTABLE},
  {name: "Zoom", mouse: UNDETECTABLE, key: null},
  {name: "(User Window)", mouse: "window-*", key: null},

  //Help menu:
  {name: "Firefox Help", mouse: "menu_openHelp", key: UNDETECTABLE},
  {name: "For Internet Explorer Users", mouse: INDISTINCT, key: null}, // Windows only
  {name: "Troubleshooting Information", mouse: "troubleShooting", key: null},
  {name: "Release Notes", mouse: "releaseNotes", key: null},
  {name: "Report Broken Web Site", mouse: "menu_HelpPopup_reportertoolmenu", key: null},
  {name: "Report Web Forgery", mouse: "menu_HelpPopup_reportPhishingtoolmenu", key: null},
  {name: "Check for Updates", mouse: "checkForUpdates", key: null},
  {name: "About Mozilla Firefox", mouse: "aboutName", key: null}
  // On Mac this is in the Firefox menu.

];


exports.dataStoreInfo = {
  fileName: "testpilot_menu_item_usage_results.sqlite",
  tableName: "menu_item_usage_experiment",
  columns: COLUMNS
};

exports.handlers = {
  _dataStore: null,
  _registeredListeners: [],
  _popupCounter: 0,
  _huntingState: false,
  _startMenuHuntingTime: 0,
  _huntingNumMenus: 0,
  _tempStorage: [],
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
      this._tempStorage.push( "CmdSet - Mouse - " + tag.command);
    } else if (tag.tagName == "key") {
      console.info("You picked a menu item with the keyboard.");
      if (tag.command) {
        console.info("Command: " + tag.command);
        this._tempStorage.push( "CmdSet - Key - " + tag.command);
      } else {
        console.info("ID: " + tag.id);
        this._tempStorage.push( "CmdSet - Key - " + tag.id);
      }
      // TODO tag.command is undefined!!!
      // console.info("Command ID: " + tag.command);
      // Dump out the guts of the object:
      /*for (let x in tag) {
        console.info("Tag[" + x + "] = " + tag[x]);
      }*/
    }
    // Other properties of interest:  tag.label, evt.sourceEvent.type,
    // evt.sourceEvent.keyCode
  },

  onCmdMenuBar: function(evt) {
    console.info("You used a menu item! (bar)");
    this._tempStorage.push( "MenuBar - Unknown - " + evt.target.id);
    // TODO: evt.target (or originalTarget etc) is always <menuitem>
    // evt.sourceEvent is null, and all other fields seem to be the
    // same no matter whether it's keyboard or mouse... how can we
    // distinguish???
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

  onPopupHidden: function(evt) {
    this._popupCounter--;
    console.info("Popups: " + this._popupCounter);
    if (this._popupCounter == 0) {
      // start a timer for a couple seconds before we declare that this was an
      // abort?  What, like 1 second?  And if another popup is shown or a
      // command is picked, then we cancel the timer, but if the timer runs
      // out then we count it as an abort.
      let endTime = Date.now();
      this._huntingState = false;
      console.info("You stopped hunting through menus.");
      console.info("You hunted through " + this._huntingNumMenus + " menus.");
      let huntingTime = endTime - this._startMenuHuntingTime;
      console.info("For " + huntingTime + " ms.");
    }
  },

  onHuntTimeout: function(evt) {
  },

  onPopupShown: function(evt) {
    this._popupCounter++;
    console.info("Popups: " + this._popupCounter);
    if (!this._huntingState) {
      this._huntingState = true;
      this._startMenuHuntingTime = Date.now();
      this._huntingNumMenus = 1;
    } else {
      this._huntingNumMenus++;
    }
  },

  onNewWindow: function(window) {
    // Register listeners.

    let mainCommandSet = window.document.getElementById("mainCommandSet");
    let mainMenuBar = window.document.getElementById("main-menubar");
    this._listen(window, mainMenuBar, "command", this.onCmdMenuBar, true);
    this._listen(window, mainCommandSet, "command", this.onCmdMainSet, true);

    let popups = mainMenuBar.getElementsByTagName("menupopup");
    for (let i = 0; i < popups.length; i++) {
      this._listen(window, popups[i], "popuphidden", this.onPopupHidden, true);
      this._listen(window, popups[i], "popupshown", this.onPopupShown, true);
    }
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
  inProgressHtml: '<p>You are running menu item usage study.</p><div id="displaydiv"></div>',

  completedHtml: 'Thanks for completing menu item usage study.',

  upcomingHtml: "",

  onPageLoad: function(experiment, document, graphUtils) {
    let div = document.getElementById("displaydiv");
    let str = "";
    let tmpStorage = exports.handlers._tempStorage;
    for (let x in tmpStorage) {
      str += tmpStorage[x] + "<br/>";
    }
    div.innerHTML = str;
  }
};

//http://www.rgraph.net/