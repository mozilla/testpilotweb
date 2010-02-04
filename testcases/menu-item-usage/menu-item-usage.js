const TYPE_INT_32 = 0;
const TYPE_DOUBLE = 1;

exports.experimentInfo = {
  startDate: null,
  duration: 5,
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

const MENU_ABORT = -1;
const MENU_UNKNOWN_ITEM = -3;

const UNDETECTABLE = -1; // Means there's a keyboard shortcut we can't detect

var CMD_ID_STRINGS_BY_MENU = [
  {menuName: "File", menuId: 0, popupId: "menu_FilePopup", menuItems: [
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
  {menuName: "Edit", menuId: 1, popupId: "menu_EditPopup", menuItems: [
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
  {menuName: "View", menuId: 2, popupId: "menu_viewPopup", menuItems: [
  {name: "Toolbars", mouse: "viewToolbarsMenu", key: null},
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
  {name: "Character Encoding/Autodetect/*", mouse: /chardet\.*/, key: null},
  {name: "Character Encoding/More Encodings/*", mouse: /charset\*/, key: null},
  {name: "Character Encoding/Customize List", mouse: UNDETECTABLE, key: UNDETECTABLE},
  {name: "Character Encoding/Western", mouse: "charset.ISO-8859-1", key: null},
  {name: "Character Encoding/UTF-16", mouse: "UTF-16", key: null},
  {name: "View Source", mouse: "View:PageSource", key: "key_viewSource"},
  {name: "Full Screen", mouse: "fullScreenItem", key: "key_fullScreen"}
   ]},

  //History menu:
  {menuName: "History", menuId: 3, popupId: "goPopup", menuItems: [
  {name: "Back", mouse: "Browser:BackOrBackDuplicate", key: "goBackKb"},
  {name: "Forward", mouse: "Browser:ForwardOrForwardDuplicate", key:"goForwardKb"},
  {name: "Home", mouse: "historyMenuHome", key: "goHome"},
  {name: "Show All History", mouse: UNDETECTABLE, key: UNDETECTABLE},
  {name: "(User History Item)", mouse: "goPopup", key: null},
  {name: "Recently Closed Tab", mouse: "historyUndoPopup", key: null},
  {name: "Restore All Tabs", mouse: "menu_restoreAllTabs", key: null},
  {name: "Recently Closed Window", mouse: "historyUndoWindowPopup", key: null},
  {name: "Restore All Windows", mouse: "menu_restoreAllWindows", key: null}
   ]},

  //Bookmarks menu:
  {menuName: "Bookmarks", menuId: 4, popupId: "bookmarksMenuPopup", menuItems: [
  {name: "Bookmark This Page", mouse: "Browser:AddBookmarkAs", key: "addBookmarkAsKb"},
  {name: "Subscribe to This Page", mouse: "subscribeToPageMenuitem", key: null},
  {name: "Bookmark All Tabs", mouse: "Browser:BookmarkAllTabs", key: "bookmarkAllTabsKb"},
  {name: "Organize Bookmarks", mouse: UNDETECTABLE, key: UNDETECTABLE},
  {name: "(User Bookmark Item)", mouse: "bookmarksMenuPopup", key: null}
   ]},

  //Tools menu:
  {menuName: "Tools", menuId: 5, popupId: "menu_ToolsPopup", menuItems: [
  {name: "Web Search", mouse: "Tools:Search", key: "key_search"},
  {name: "Downloads", mouse: "Tools:Downloads", key: "key_openDownloads"},
  {name: "Add-Ons", mouse: "Tools:Addons", key: null},
  {name: "Error Console", mouse: "javascriptConsole", key: UNDETECTABLE},
  {name: "Page Info", mouse: "View:PageInfo", key: "key_viewInfo"}, // No key on Windows
  {name: "Private Browsing", mouse: "Tools:PrivateBrowsing", key: "key_privatebrowsing"},
  {name: "Clear Recent History", mouse: "Tools:Sanitize", key: "key_sanitize"},
  {name: "Options", mouse: "menu_preferences", key: null }
  // On Mac this is in the Firefox menu and called Preferences, and it has
  // a key (cmd-,) but we are notified as if it were a mouse event.
   ]},

  //Windows menu (Mac Only):
  {menuName: "Windows", menuId: 6, popupId: "windowPopup", menuItems: [
  {name: "Minimize", mouse: UNDETECTABLE, key: UNDETECTABLE},
  {name: "Zoom", mouse: UNDETECTABLE, key: null},
  {name: "(User Window)", mouse: /window-*/, key: null}
   ]},

  //Help menu:
  {menuName: "Help", menuId: 7, popupId: "menu_HelpPopup", menuItems: [
  {name: "Firefox Help", mouse: "menu_openHelp", key: UNDETECTABLE},
  {name: "For Internet Explorer Users", mouse: "menu_HelpPopup", key: null}, // Windows only
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

function interpretMenuName(id) {
  if (id == MENU_ABORT) {
    return "Aborted";
  } else if (id == MENU_UNKNOWN_ITEM) {
    return "Unknown";
  } else {
    if (!CMD_ID_STRINGS_BY_MENU[id]) {
      return "Unknown";
    } else {
      return CMD_ID_STRINGS_BY_MENU[id].menuName;
    }
  }
}

function interpretItemName(id) {
  if (id == MENU_ABORT) {
    return "Aborted";
  } else if (id == MENU_UNKNOWN_ITEM) {
    return "Unknown";
  } else {
    if (!CMD_ID_STRINGS[id]) {
      return "Unknown";
    } else {
      return CMD_ID_STRINGS[id].name;
    }
  }
}

var COLUMNS = [
  {property: "ui_method", type: TYPE_INT_32, displayName: "UI Method",
   displayValue: ["Mouse", "Keyboard shortcut", "Alt key navigation"]},
  {property: "start_menu_id", type: TYPE_INT_32,
   displayName: "Starting Menu", displayValue: interpretMenuName},
  {property: "explore_ms", type: TYPE_INT_32, displayName: "Milliseconds to find"},
  {property: "explore_num", type: TYPE_INT_32, displayName: "Menus explored"},
  {property: "menu_id", type: TYPE_INT_32, displayName: "Menu Chosen",
   displayValue: interpretMenuName},
  {property: "item_id", type: TYPE_INT_32, displayName: "Item Chosen",
   displayValue: interpretItemName},
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
  _startHuntingMenuId: MENU_UNKNOWN_ITEM,
  _huntingNumMenus: 0,
  _finishHuntingTimer: null,
  _inPrivateBrowsing: false,
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
    if (this._inPrivateBrowsing) {
      // Don't record anything the user does in private browsing mode
      return;
    }
    /* TODO: allow for alt-key navigation */

    function matches(pattern, string) {
      // Pattern may be either a string or a regexp;
      // do straight comparison for one, matching for the other
      if (pattern == UNDETECTABLE || pattern == null) {
        return false;
      } else if (typeof(pattern) == "string") {
        return (pattern == string);
      } else if (pattern.test) { //regexp
        return pattern.test(string);
      } else {
        return false;
      }
    }

    let itemId = MENU_UNKNOWN_ITEM;
    let menuId = MENU_UNKNOWN_ITEM;
    // If we find no match (should never happen), then we record MENU_UNKNOWN_ITEM.
    for (let itemNum in CMD_ID_STRINGS) {
      let item = CMD_ID_STRINGS[itemNum];
      if ((isKeyboard && matches(item.key, idString)) ||
        (!isKeyboard && matches(item.mouse, idString))) {
        itemId = itemNum;
        menuId = item.menuId;
        break;
      }
    }

    // Use hunting state to calculate start_menu_id, explore_ms,
    // and explore_num!
    let exploreMs = 0;
    let exploreNum = 0;
    let startMenuId = 0;
    if (this._huntingState && !isKeyboard) {
      exploreMs = Date.now() - this._startMenuHuntingTime;
      exploreNum = this._huntingNumMenus;
      startMenuId = this._startHuntingMenuId;
    }

    this._dataStore.storeEvent({
      ui_method: isKeyboard?UI_METHOD_SHORTCUT:UI_METHOD_MOUSE,
      start_menu_id: startMenuId,
      explore_ms: exploreMs,
      explore_num: exploreNum,
      menu_id: menuId,
      item_id: itemId,
      timestamp: Date.now()
    });

    // If there is a _finishHuntingTimer, cancel it.
    // Restore hunting state to default:
    this.cancelHuntingTimer();
    this._huntingState = false;
    this._startMenuHuntingTime = 0;
    this._startHuntingMenuId = MENU_UNKNOWN_ITEM;
    this._huntingNumMenus = 0;
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

  cancelHuntingTimer: function() {
    if (this._finishHuntingTimer) {
      this._finishHuntingTimer.cancel();
      this._finishHuntingTimer = null;
    }
  },

  onCmdMenuBar: function(evt) {
    if (evt.target.id) {
      this.storeMenuChoice( false, evt.target.id );
    } else {
      // If the item doesn't have an ID, keep going up through its parents
      // until you find one that does.
      let node = evt.target;
      while (! node.id) {
        node = node.parentNode;
        if (!node) {
          this.storeMenuChoice( false, "Unknown Item" );
          return;
        }
      }
      this.storeMenuChoice( false, node.id );
    }
  },

  identifyMenuByPopup: function(popupId) {
    for (let item in CMD_ID_STRINGS_BY_MENU) {
      if (CMD_ID_STRINGS_BY_MENU[item].popupId == popupId) {
        return CMD_ID_STRINGS_BY_MENU[item].menuId;
      }
    }
    return MENU_UNKNOWN_ITEM;
  },

  onPopupShown: function(evt) {
    if (this.identifyMenuByPopup(evt.target.id) == MENU_UNKNOWN_ITEM) {
      return;
    }
    this._popupCounter++;

    if (!this._huntingState) {
      // First popup opens
      this._huntingState = true;
      // Remember the time and the menu where you started hunting...
      this._startHuntingMenuId = this.identifyMenuByPopup(evt.target.id);
      this._startMenuHuntingTime = Date.now();
      this._huntingNumMenus = 1;
    } else {
      // Second or later popup opens...
      this._huntingNumMenus++;
      // If there is a _finishHuntingTimer, cancel it.
      this.cancelHuntingTimer();
    }
  },

  onPopupHidden: function(evt) {
    if (this.identifyMenuByPopup(evt.target.id) == MENU_UNKNOWN_ITEM) {
      return;
    }
    this._popupCounter--;
    let self = this;
    if (this._huntingState == true && this._popupCounter == 0) {
      /* User may be done hunting, or this may just be temporary.
       * Start the _finishHuntingTimer here.  For 1 second.
       * If another popup is shown or a
       * command is picked, then we cancel the timer, but if the timer runs
       * out then we count it as an abort. */
      this.cancelHuntingTimer();
      this._finishHuntingTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
      this._finishHuntingTimer.initWithCallback(
        {notify: function(timer) { self.onHuntTimeout();}},
        1000, Ci.nsITimer.TYPE_ONE_SHOT);
    }
  },

  onHuntTimeout: function() {
    let endTime = Date.now();
    let huntingTime = endTime - this._startMenuHuntingTime;
    let huntingNum = this._huntingNumMenus;
    this._dataStore.storeEvent({
      ui_method: UI_METHOD_MOUSE,
      start_menu_id: this._startHuntingMenuId,
      explore_ms: huntingTime,
      explore_num: huntingNum,
      menu_id: MENU_ABORT,
      item_id: MENU_ABORT,
      timestamp: Date.now()
    });
    this.cancelHuntingTimer();
    this._huntingState = false;
    this._startMenuHuntingTime = MENU_UNKNOWN_ITEM;
  },

  onNewWindow: function(window) {
    // Register listeners.
    let mainCommandSet = window.document.getElementById("mainCommandSet");
    let mainMenuBar = window.document.getElementById("main-menubar");
    this._listen(window, mainMenuBar, "command", this.onCmdMenuBar, true);
    this._listen(window, mainCommandSet, "command", this.onCmdMainSet, true);

    for (let item in CMD_ID_STRINGS_BY_MENU) {
      // Currently trying: just attach it to toplevel menupopups, not
      // taskbar menus, context menus, or other
      // weird things like that.

      let popupId = CMD_ID_STRINGS_BY_MENU[item].popupId;
      let popup = window.document.getElementById(popupId);
      if (popup) {
        this._listen(window, popup, "popuphidden", this.onPopupHidden, true);
        this._listen(window, popup, "popupshown", this.onPopupShown, true);
      }
      // TODO include Mac's Firefox menu, if we can figure out what its
      // popup id is.
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

  onEnterPrivateBrowsing: function() {
    this._inPrivateBrowsing = true;
  },
  onExitPrivateBrowsing: function() {
    this._inPrivateBrowsing = false;
  }
};

const DISPLAY_TABLES = '<h3>Your Most Often Used Menu Items Are:</h3>\
<p><table class="callout" id="most-used-table"><tr><th>Menu</th><th>Item</th>\
<th>Selected with mouse</th><th>Used keyboard shortcut</th></tr></table></p>\
<h3>The Menu Items You Spent The Longest Time Hunting For Are:</h3>\
<p><table class="callout" id="longest-hunt-table"><tr><th>Menu</th><th>Item</th>\
<th>Average Time to Find</th></tr></table></p>';

const APOLOGY = '<p><i>Note:</i> There are some keyboard shortcuts that the study\
 doesn\'t detect due to a\
 <a href="http://groups.google.com/group/mozilla-labs-testpilot/browse_thread/thread/da46fd87fba1dbd3">\
 known bug</a>.  If you use a keyboard shortcut and don\'t see it reflected\
 in the stats, don\'t be alarmed.  We\'re working on a fix for this.  If you\
 have any questions about the study, you can bring them to \
 <a href="http://groups.google.com/group/mozilla-labs-testpilot">the discussion group</a>.</p>';

exports.webContent = {
  inProgressHtml: '\
<h2>The Menu Item Usage study is currently collecting data.</h2>\
<h3>It will finish <span id="test-end-time"></span>.  Thank you for your participation!</h3>\
<p>This study will help us understand how menu items are used in Firefox:  Which items are used most, and which items do users have the most trouble finding?  <a href="https://testpilot.mozillalabs.com/testcases/menu-item-usage.html">Read more about the Menu Item Usage study</a>.</p>'
+ DISPLAY_TABLES + '<h3>The Fine Print</h3>\
<p>The study will end in 5 days. At  the end of it, you will be offered a choice to submit your data or not.  All test data you submit will be anonymized and will not be personally identifiable. This study does not record the names or URLs of any bookarks, history items, tabs, or windows that you select.</p>\
<p>You can also look at the <a onclick="showRawData(4);">Raw Data</a> to see exactly what will be transmitted to Mozilla at the end of the study.</p>\
<p>If you do not want to continue participating in this study, plese <a href="chrome://testpilot/content/status-quit.html?eid=4">click here to quit</a>.</p>\
  ' + APOLOGY,

  completedHtml: '<h2>The Menu Item Usage study has finished collecting data!</h2>\
<h3>The last step is to submit the data.</h3>\
<div class="home_callout_continue"><img class="homeIcon"\ src="chrome://testpilot/skin/images/home_computer.png"> <span\ id="upload-status"><a onclick="uploadData();">Submit your data\ &raquo;</a></span></div>\
<p></p><p>The data you submit will be analyzed as part of the Menu Item Usage study.\ We hope it will lead to better designs for the Firefox menu bars in the future.\
 <a href="https://testpilot.mozillalabs.com/testcases/menu-item-usage.html">\
Read more about the Menu Item Usage study here</a>. We will notify you when the\
 study results are ready to review.</p>\
<p>All test data you submit will be anonymized and will not be personally\ identifiable. This study has not recorded the names or URLs of any bookarks,\ history items, tabs, or windows that you selected.</p>\
<p>You can also look at the <a onclick="showRawData(4);">Raw Data</a> to see\ exactly what will be transmitted to Mozilla if you click "Submit".</p>\
<p>If you do not want to submit your data, for any reason, please \
<a href="chrome://testpilot/content/status-quit.html?eid=4">click here to quit\ the study</a>.</p>\
<p>Thank you very much for your participation!</p>' + DISPLAY_TABLES + APOLOGY,

  upcomingHtml: "",

  onPageLoad: function(experiment, document, graphUtils) {
    // Process raw data: Combine all events on the same menu item
    // into a single object

    // TODO: If there's no data, say "no data"!!
    let rawData = experiment.dataStoreAsJSON;
    let stats = [];
    let item;

    for (let row in rawData) {
      let id = rawData[row].item_id;
      let menuId = rawData[row].menu_id;
      let exploreMs = rawData[row].explore_ms;
      let isMouse = (rawData[row].ui_method == UI_METHOD_MOUSE);
      let mouseBump = isMouse?1:0;
      let keyBump = isMouse?0:1;
      if (id == MENU_ABORT) {
        continue;
      }
      let match = false;
      for (item in stats) {
        if (stats[item].id == id) {
          match = true;
          stats[item].quantity ++;
          stats[item].mouseQuantity += mouseBump;
          stats[item].keyQuantity += keyBump;
          stats[item].exploreMs += exploreMs;
          break;
        }
      }
      if (!match) {
        stats.push( {id: id, menuId: menuId, mouseQuantity: mouseBump,
                     keyQuantity: keyBump, quantity: 1, exploreMs: exploreMs} );
      }
    }
    // Sort by quantity, descending:
    stats.sort(function(a, b) { return b.quantity - a.quantity;});

    // look at ui_method, explore_ms, explore_num, start_menu_id, timestamp

    let table = document.getElementById("most-used-table");
    let rows = 0;
    for (item in stats) {
      rows ++; // max out at ten rows
      if (rows >= 10) {
        break;
      }
      let newRow = document.createElement("tr");
      table.appendChild(newRow);
      let newCell = document.createElement("td");
      newCell.innerHTML = interpretMenuName( stats[item].menuId);
      newRow.appendChild( newCell);
      newCell = document.createElement("td");
      newCell.innerHTML = interpretItemName( stats[item].id);
      newRow.appendChild( newCell);
      newCell = document.createElement("td");
      newCell.innerHTML = stats[item].mouseQuantity + " times";
      newRow.appendChild( newCell);
      newCell = document.createElement("td");
      newCell.innerHTML = stats[item].keyQuantity + " times";
      newRow.appendChild( newCell);
    }


    // Now re-sort by longest average hunt time, descending:
    stats.sort(function(a, b) { return (b.exploreMs / b.quantity) -
                                (a.exploreMs / a.quantity);});
    table = document.getElementById("longest-hunt-table");
    rows = 0;
    for (item in stats) {
      rows ++; // max out at ten rows
      if (rows >= 10) {
        break;
      }

      if (stats[item].exploreMs == 0) {
        continue;
      }
      let newRow = document.createElement("tr");
      table.appendChild(newRow);
      let newCell = document.createElement("td");
      newCell.innerHTML = interpretMenuName( stats[item].menuId);
      newRow.appendChild( newCell);
      newCell = document.createElement("td");
      newCell.innerHTML = interpretItemName( stats[item].id);
      newRow.appendChild( newCell);
      let avgSearchTime = (stats[item].exploreMs / stats[item].quantity);
      newCell = document.createElement("td");
      newCell.innerHTML = Math.round(avgSearchTime / 1000) + " seconds";
      newRow.appendChild( newCell);
    }
  }
};