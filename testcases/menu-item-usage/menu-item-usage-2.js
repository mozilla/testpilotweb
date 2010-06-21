var BaseClasses = require("study_base_classes.js");

exports.experimentInfo = {
  startDate: null,
  duration: 1,
  testName: "Menu Item Usage v2",
  testId: 7,
  testInfoUrl: "https://testpilot.mozillalabs.com/testcases/menuitemusage",
  summary: "An improved version of the menu study",
  thumbnail: "https://testpilot.mozillalabs.com/testcases/menu-item-usage/menu-study-thumbnail.png",
  optInRequired: false,
  recursAutomatically: false,
  recurrenceInterval: 0,
  versionNumber: 2,
  minTPVersion: "1.0b4"
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
  {property: "ui_method", type: BaseClasses.TYPE_INT_32, displayName: "UI Method",
   displayValue: ["Mouse", "Keyboard shortcut", "Alt key navigation"]},
  {property: "start_menu_id", type: BaseClasses.TYPE_INT_32,
   displayName: "Starting Menu", displayValue: interpretMenuName},
  {property: "explore_ms", type: BaseClasses.TYPE_INT_32, displayName: "Milliseconds to find"},
  {property: "explore_num", type: BaseClasses.TYPE_INT_32, displayName: "Menus explored"},
  {property: "menu_id", type: BaseClasses.TYPE_INT_32, displayName: "Menu Chosen",
   displayValue: interpretMenuName},
  {property: "item_id", type: BaseClasses.TYPE_INT_32, displayName: "Item Chosen",
   displayValue: interpretItemName},
  {property: "unknown_id", type: BaseClasses.TYPE_STRING, displayName: "unknown_id"},
  {property: "timestamp", type: BaseClasses.TYPE_DOUBLE, displayName: "Time of Menu Choice",
   displayValue: function(val) {return new Date(val).toLocaleString();}}];


exports.dataStoreInfo = {
  fileName: "testpilot_menu_item_usage_2.sqlite",
  tableName: "menu_item_usage_experiment",
  columns: COLUMNS
};


function MenuWindowObserver(window) {
  MenuWindowObserver.baseConstructor.call(this, window);
};
BaseClasses.extend(MenuWindowObserver, BaseClasses.GenericWindowObserver);

MenuWindowObserver.prototype.install = function() {
    // Register listeners.
  let window = this.window;
  let mainCommandSet = window.document.getElementById("mainCommandSet");
  let mainMenuBar = window.document.getElementById("main-menubar");
  this._listen(mainMenuBar, "command", function(evt) {
                 exports.handlers.onCmdMenuBar(evt); }, true);
  this._listen(mainCommandSet, "command", function(evt) {
                 exports.handlers.onCmdMainSet(evt); }, true);

  for (let item in CMD_ID_STRINGS_BY_MENU) {
    // Currently trying: just attach it to toplevel menupopups, not
    // taskbar menus, context menus, or other
    // weird things like that.

    let popupId = CMD_ID_STRINGS_BY_MENU[item].popupId;
    let popup = window.document.getElementById(popupId);
    if (popup) {
      this._listen(popup, "popuphidden", function(evt) {
                     exports.handlers.onPopupHidden(evt); }, true);
      this._listen(popup, "popupshown", function(evt) {
                     exports.handlers.onPopupShown(evt); }, true);
    }
    // TODO include Mac's Firefox menu, if we can figure out what its
    // popup id is.
  }
};

function GlobalMenuObserver() {
  GlobalMenuObserver.baseConstructor.call(this, MenuWindowObserver);
}
BaseClasses.extend(GlobalMenuObserver, BaseClasses.GenericGlobalObserver);
GlobalMenuObserver.prototype.onExperimentStartup = function(store) {
  GlobalMenuObserver.superClass.onExperimentStartup.call(this, store);

  this._popupCounter = 0;
  this._huntingState = false;
  this._startMenuHuntingTime = 0;
  this._startHuntingMenuId = MENU_UNKNOWN_ITEM; // is this where the
                               // 'unknown' menu records come from?
  this._huntingNumMenus = 0;
  this._finishHuntingTimer = null;
};
GlobalMenuObserver.prototype.storeMenuChoice = function( isKeyboard, idString ) {
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
  let unknownId = "";
  for (let itemNum in CMD_ID_STRINGS) {
    let item = CMD_ID_STRINGS[itemNum];
    if ((isKeyboard && matches(item.key, idString)) ||
      (!isKeyboard && matches(item.mouse, idString))) {
      itemId = itemNum;
      menuId = item.menuId;
      break;
    }
  }

  // If we found no match, we record MENU_UNKNOWN_ITEM, and also record
  // the raw id string that we couldn't identify, for later analysis.
  if ((itemId == MENU_UNKNOWN_ITEM) || (menuId == MENU_UNKNOWN_ITEM)) {
    unknownId = idString;
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

  this.record({
    ui_method: isKeyboard?UI_METHOD_SHORTCUT:UI_METHOD_MOUSE,
    start_menu_id: startMenuId,
    explore_ms: exploreMs,
    explore_num: exploreNum,
    menu_id: menuId,
    item_id: itemId,
    unknown_id: unknownId,
    timestamp: Date.now()
  }, function() {});

  // If there is a _finishHuntingTimer, cancel it.
  // Restore hunting state to default:
  this.cancelHuntingTimer();
  this._huntingState = false;
  this._startMenuHuntingTime = 0;
  this._startHuntingMenuId = MENU_UNKNOWN_ITEM;
  this._huntingNumMenus = 0;
};

GlobalMenuObserver.prototype.onCmdMainSet = function(evt) {
    let tag = evt.sourceEvent.target;
    if (tag.tagName == "menuitem") {
      this.storeMenuChoice(false, tag.command);
    } else if (tag.tagName == "key") {
      this.storeMenuChoice(true, tag.command?tag.command:tag.id );
    }

    // Other properties of interest:  tag.label, evt.sourceEvent.type,
    // evt.sourceEvent.keyCode
};

GlobalMenuObserver.prototype.cancelHuntingTimer = function() {
    if (this._finishHuntingTimer) {
      this._finishHuntingTimer.cancel();
      this._finishHuntingTimer = null;
    }
};

GlobalMenuObserver.prototype.onCmdMenuBar = function(evt) {
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
};

GlobalMenuObserver.prototype.identifyMenuByPopup = function(popupId) {
    for (let item in CMD_ID_STRINGS_BY_MENU) {
      if (CMD_ID_STRINGS_BY_MENU[item].popupId == popupId) {
        return CMD_ID_STRINGS_BY_MENU[item].menuId;
      }
    }
    return MENU_UNKNOWN_ITEM;
};

GlobalMenuObserver.prototype.onPopupShown = function(evt) {
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
};

GlobalMenuObserver.prototype.onPopupHidden = function(evt) {
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
};

GlobalMenuObserver.prototype.onHuntTimeout = function() {
    let endTime = Date.now();
    let huntingTime = endTime - this._startMenuHuntingTime;
    let huntingNum = this._huntingNumMenus;
  let self = this;
    this.record({
      ui_method: UI_METHOD_MOUSE,
      start_menu_id: self._startHuntingMenuId,
      explore_ms: huntingTime,
      explore_num: huntingNum,
      menu_id: MENU_ABORT,
      item_id: MENU_ABORT,
      unknown_id: "",
      timestamp: Date.now()
    }, function() {});
    this.cancelHuntingTimer();
    this._huntingState = false;
    this._startMenuHuntingTime = MENU_UNKNOWN_ITEM;
};

exports.handlers = new GlobalMenuObserver();


// Turn this into subclass of BaseClasses.GenericWebContent.
function MenuStudyWebContent() {
  MenuStudyWebContent.baseConstructor.call(this, exports.experimentInfo);
}
BaseClasses.extend(MenuStudyWebContent, BaseClasses.GenericWebContent);
MenuStudyWebContent.prototype.__defineGetter__("dataCanvas",
  function() {
      return '<div class="dataBox"><h3>View Your Data:</h3>' +
      this.dataViewExplanation +
      this.rawDataLink +
'<h3>Your Most Often Used Menu Items Are:</h3>\
<p><table class="callout" id="most-used-table"><tr><th>Menu</th><th>Item</th>\
<th>Selected with mouse</th><th>Used keyboard shortcut</th></tr></table></p>\
<h3>The Menu Items You Spent The Longest Time Hunting For Are:</h3>\
<p><table class="callout" id="longest-hunt-table"><tr><th>Menu</th><th>Item</th>\
<th>Average Time to Find</th></tr></table></p>' +
      this.saveButtons + '</div>';
  });
MenuStudyWebContent.prototype.__defineGetter__("dataViewExplanation",
  function() {
    return "This study gathers information on which menu items are most"
      + " frequently used, either with the mouse or by keyboard shortcut.";
  });

MenuStudyWebContent.prototype.onPageLoad = function(experiment,
                                                    document,
                                                    graphUtils) {
  // Process raw data: Combine all events on the same menu item
  // into a single object

  // TODO: If there's no data, say "no data"!!
  experiment.getDataStoreAsJSON( function(rawData) {
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
  });
};

exports.webContent = new MenuStudyWebContent();

require("unload").when(
  function myDestructor() {
    console.info("Menu item study destructor called.");
    exports.handlers.uninstallAll();
  });
