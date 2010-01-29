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
const MENU_UNKNOWN_ITEM = -3;

const UNDETECTABLE = -1; // Means there's a keyboard shortcut we can't detect
const INDISTINCT = -2; // Means the item is detected but has no ID

var CMD_ID_STRINGS_BY_MENU = [
  {menuName: "File", menuId: 0, menuItems: [
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
  {name: "Exit", mouse: "cmd_quitApplication", key: "key_quitApplication"}
  // On Mac this is in the Firefox menu and called Quit Firefox
   ]},

  // Edit menu:
  {menuName: "Edit", menuId: 1, menuItems: [
  {name: "Undo", mouse: "cmd_undo", key: UNDETECTABLE},
  {name: "Redo", mouse: "cmd_redo", key: UNDETECTABLE},
  {name: "Cut", mouse: "cmd_cut", key: UNDETECTABLE},
  {name: "Paste", mouse: "cmd_paste", key: UNDETECTABLE},
  {name: "Copy", mouse: "cmd_copy", key: UNDETECTABLE},
  {name: "Delete", mouse: "cmd_delete", key: UNDETECTABLE},
  {name: "Select All", mouse: "cmd_selectAll", key: UNDETECTABLE},
  {name: "Find", mouse: "cmd_find", key: "key_find"},
  {name: "Find Again", mouse: "cmd_findAgain", key: "key_findAgain"},
  {name: "Special Characters", mouse: UNDETECTABLE, key: UNDETECTABLE} //Mac only
   ]},

  //View menu:
  {menuName: "View", menuId: 2, menuItems: [
  {name: "Toolbars/Menu Bar", mouse: INDISTINCT, key: null},
  {name: "Toolbars/Navigation Toolbar", mouse: INDISTINCT, key: null},
  {name: "Toolbars/Bookmarks Toolbar", mouse: INDISTINCT, key: null},
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
  {name: "Full Screen", mouse: "fullScreenItem", key: "key_fullScreen"}
   ]},

  //History menu:
  {menuName: "History", menuId: 3,  menuItems: [
  {name: "Back", mouse: "Browser:BackOrBackDuplicate", key: "goBackKb"},
  {name: "Forward", mouse: "Browser:ForwardOrForwardDuplicate", key:"goForwardKb"},
  {name: "Home", mouse: "historyMenuHome", key: "goHome"},
  {name: "Show All History", mouse: UNDETECTABLE, key: UNDETECTABLE},
  {name: "(User History Item)", mouse: INDISTINCT, key: null},
  {name: "Recently Closed Tab", mouse: INDISTINCT, key: null},
  {name: "Restore All Tabs", mouse: "menu_restoreAllTabs", key: null},
  {name: "Recently Closed Window", mouse: INDISTINCT, key: null},
  {name: "Restore All Windows", mouse: "menu_restoreAllWindows", key: null}
   ]},

  //Bookmarks menu:
  {menuName: "Bookmarks", menuId: 4,  menuItems: [
  {name: "Bookmark This Page", mouse: "Browser:AddBookmarkAs", key: "addBookmarkAsKb"},
  {name: "Subscribe to This Page", mouse: "subscribeToPageMenuitem", key: null},
  {name: "Bookmark All Tabs", mouse: "Browser:BookmarkAllTabs", key: "bookmarkAllTabsKb"},
  {name: "Organize Bookmarks", mouse: UNDETECTABLE, key: UNDETECTABLE},
  {name: "(User Bookmark Item)", mouse: INDISTINCT, key: null}
   ]},

  //Tools menu:
  {menuName: "Tools", menuId: 5, menuItems: [
  {name: "Web Search", mouse: "Tools:Search", key: "key_search"},
  {name: "Downloads", mouse: "Tools:Downloads", key: "key_openDownloads"},
  {name: "Add-Ons", mouse: "Tools:Addons", key: null},
  // TODO: how to handle menus added here by individual add-ons?
  {name: "Error Console", mouse: "javascriptConsole", key: UNDETECTABLE},
  {name: "Page Info", mouse: "View:PageInfo", key: "key_viewInfo"}, // No key on Windows
  {name: "Private Browsing", mouse: "Tools:PrivateBrowsing", key: "key_privatebrowsing"},
  {name: "Clear Recent History", mouse: "Tools:Sanitize", key: "key_sanitize"},
  {name: "Options", mouse: "menu_preferences", key: null }
  // On Mac this is in the Firefox menu and called Preferences, and it has
  // a key (cmd-,) but we are notified as if it were a mouse event.
   ]},

  //Windows menu (Mac Only):
  {menuName: "Windows", menuId: 6, menuItems: [
  {name: "Minimize", mouse: UNDETECTABLE, key: UNDETECTABLE},
  {name: "Zoom", mouse: UNDETECTABLE, key: null},
  {name: "(User Window)", mouse: "window-*", key: null}
   ]},

  //Help menu:
  {menuName: "Help", menuId: 7, menuItems: [
  {name: "Firefox Help", mouse: "menu_openHelp", key: UNDETECTABLE},
  {name: "For Internet Explorer Users", mouse: INDISTINCT, key: null}, // Windows only
  {name: "Troubleshooting Information", mouse: "troubleShooting", key: null},
  {name: "Release Notes", mouse: "releaseNotes", key: null},
  {name: "Report Broken Web Site", mouse: "menu_HelpPopup_reportertoolmenu", key: null},
  {name: "Report Web Forgery", mouse: "menu_HelpPopup_reportPhishingtoolmenu", key: null},
  {name: "Check for Updates", mouse: "checkForUpdates", key: null},
  {name: "About Mozilla Firefox", mouse: "aboutName", key: null}
  // On Mac this is in the Firefox menu.
   ]}
];

var CMD_ID_STRINGS = [];

var makelist = function() {
  for each (let menu in CMD_ID_STRINGS_BY_MENU) {
    for each (let item in menu.menuItems) {
      item.menuName = menu.menuName;
      item.menuId = menu.menuId;
    }
    CMD_ID_STRINGS = CMD_ID_STRINGS.concat(menu.menuItems);
  }
};

makelist();


var COLUMNS = [
  {property: "ui_method", type: TYPE_INT_32, displayName: "UI Method",
   displayValue: ["Mouse", "Keyboard shortcut", "Alt key navigation"]},
  {property: "start_menu_id", type: TYPE_INT_32,
   displayName: "Starting Menu"},
  {property: "explore_ms", type: TYPE_INT_32, displayName: "Milliseconds to find"},
  {property: "explore_num", type: TYPE_INT_32, displayName: "Menus explored"},
  {property: "menu_id", type: TYPE_INT_32, displayName: "Menu Chosen",
   displayValue: function(val) {return CMD_ID_STRINGS_BY_MENU[val].menuName;}},
  {property: "item_id", type: TYPE_INT_32, displayName: "Item Chosen",
   displayValue: function(val) {return CMD_ID_STRINGS[val].name;}},
  {property: "timestamp", type: TYPE_DOUBLE, displayName: "Time of Menu Choice",
   displayValue: function(val) {return new Date(val).toLocaleString();}}];


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

  storeMenuChoice: function( isKeyboard, idString ) {
    /* TODO: allow for alt-key navigation
     * TODO: record start_menu_id, explore_ms, and explore_num.
     */
    let itemId = MENU_UNKNOWN_ITEM;
    let menuId = MENU_UNKNOWN_ITEM;
    for (let itemNum in CMD_ID_STRINGS) {
      let item = CMD_ID_STRINGS[itemNum];
      if ((isKeyboard && idString == item.key) ||
        (!isKeyboard && idString == item.mouse)) {
        itemId = itemNum;
        menuId = item.menuId;
        break;
      }
    }
    // If we got to here and found no match... this should not happen but
    // we'll record MENU_UNKNOWN_ITEM into menu_id and item_id.
    this._dataStore.storeEvent({
      ui_method: isKeyboard?UI_METHOD_SHORTCUT:UI_METHOD_MOUSE,
      start_menu_id: 0,
      explore_ms: 0,
      explore_num: 0,
      menu_id: menuId,
      item_id: itemId,
      timestamp: Date.now()
    });
  },

  onCmdMainSet: function(evt) {
    let tag = evt.sourceEvent.target;
    if (tag.tagName == "menuitem") {
      this.storeMenuChoice(false, tag.command);
    } else if (tag.tagName == "key") {
      this.storeMenuChoice(true, tag.command?tag.command:tag.id );
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

    // Answer... this almost never catches the event for keyboard
    // shortcuts (only for apple-, ->preferences on mac).  If we
    // catch the event through the MenuBar it usually means there's no
    // keyboard equivalent OR the keyboard equivalent cannot be caught.

    if (evt.target.id) {
      this.storeMenuChoice( false, evt.target.id );
    } else {
      // TODO:  Debug INDISTINCT items here.
    }
  },

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
  inProgressHtml: '<p>The menu item usage study is collecting data.</p>'
  + '<p><a onclick="showRawData(4);">Raw Data</a></p>'
  + '<h3>Your Most Often Used Menu Items Are:</h3>'
  + '<div id="displaydiv"></div>',

  completedHtml: 'Thanks for completing menu item usage study.',

  upcomingHtml: "",

  onPageLoad: function(experiment, document, graphUtils) {
    let rawData = experiment.dataStoreAsJSON;
    let stats = [];
    for (let row in rawData) {
      let id = rawData[row].item_id;
      let match = false;
      for (let item in stats) {
        if (stats[item].id == id) {
          match = true;
          stats[item].quantity ++;
          break;
        }
      }
      if (!match) {
        stats.push( {id: id, quantity: 1} );
      }
    }
    // Sort by quantity, descending:
    stats.sort(function(a, b) { return b.quantity - a.quantity;});

    // look at ui_method, explore_ms, explore_num, start_menu_id, timestamp

    let div = document.getElementById("displaydiv");
    let str = "";
    for (let item in stats) {
      //console.info("Stats[" + item + "] = " + stats[item]);
      let id = stats[item].id;
      str += CMD_ID_STRINGS[id].menuName + " &gt; " + CMD_ID_STRINGS[id].name + ": " + stats[item].quantity + "<br/>";
    }
    /*let tmpStorage = exports.handlers._tempStorage;
    for (let x in tmpStorage) {
      str += tmpStorage[x] + "<br/>";
    }*/
    div.innerHTML = str;
  }
};

//http://www.rgraph.net/