BaseClasses = require("study_base_classes.js");

const ToolbarWidget = {
  // Customization ids:
  UNKNOWN: -1,
  UNIFIED_BACK_FWD: 0,
  RELOAD: 1,
  STOP: 2,
  HOME: 3,
  URLBAR: 4,
  SPACER: 5, // also covers splitters, flex, etc
  SEARCH: 6,
  PERSONAL_BOOKMARKS: 7,
  MENU_BAR: 8,

  // These are things that aren't normally in the toolbar but can be added:
  THROBBER: 9,
  DOWNLOADS_BUTTON: 10,
  PRINT_BUTTON: 11,
  BOOKMARKS_BUTTON: 12,
  HISTORY_BUTTON: 13,
  NEW_TAB_BUTTON: 14, // not to be confused with TABBAR_NEW_BTN below
  NEW_WINDOW_BUTTON: 15,
  CUT_BUTTON: 16,
  COPY_BUTTON: 17,
  PASTE_BUTTON: 18,
  FULLSCREEN_BUTTON: 19,

  // Stuff that can't be individually customized but still takes events:
  BACK: 20,
  FORWARD: 21,
  DROP_DOWN_RECENT_PAGE: 22,
  TOP_LEFT_ICON: 23, // Windows Only
  SITE_ID_BUTTON: 24,
  SITE_ID_MORE_INFO: 25,
  RSS_ICON: 26,
  BOOKMARK_STAR: 27,
  GO_BUTTON: 28,
  DROP_DOWN_MOST_VISITED: 29,
  SEARCH_ENGINE_DROP_DOWN: 30,
  SEARCH_GO_BUTTON: 31,
  EDIT_BOOKMARK_PANEL: 32,
  TABBAR_SCROLL: 33,
  TABBAR_NEW_BTN: 34, // not to be confused with NEW_TAB_BUTTON under customize
  TABBAR_DROP_DOWN: 36,
  VERTICAL_SCROLLBAR: 37,
  HORIZONTAL_SCROLLBAR: 38,
  STATUS_BAR: 41,
  STATUS_BAR_LOCK: 42,
  CUSTOMIZE_TOOLBAR_MENU: 43

};

// Use for interaction_type field
const ToolbarAction = {
  // for customize events -- what toolbar is the item in?
  CUST_IN_NAVBAR: 0,
  CUST_IN_CUSTOM_TOOLBAR: 1,
  CUST_IN_PERSONAL: 2,
  CUST_IN_MENUBAR: 3,

  // for interaction events -- what did you do to the item?
  CLICK: 4,
  MENU_PICK: 5,
  ENTER_KEY: 6,

  REPEATED_SEARCH_SAME_ENGINE: 7,
  REPEATED_SEARCH_DIFF_ENGINE: 8,

  // For status bar hidden/shown and bookmark toolbar count:
  PRESENT: 9,
  ABSENT: 10,

  // For edit bookmark panel

  // What's all this then?
  /*FOCUS: 5,
  ENTER_URL: 6,
  SEARCH: 7,
  CLICK_SUGGESTION: 8,
  EXPLORE_SUGGESTIONS: 9,
  SWITCH_SEARCH_ENGINE: 10,*/

  // More?

  // For clicks on site id:
  SITE_ID_SSL: 12,
  SITE_ID_EV: 13,
  SITE_ID_NONE: 14,

  // For scroll bars:
  SCROLL_BTN_UP: 15, // or left
  SCROLL_BTN_DOWN: 16, // or right
  SCROLL_SLIDER: 17,
  SCROLL_TRACK: 18,

  // For URL bar:
  MOUSE_DOWN: 19,
  MOUSE_UP: 20,
  MOUSE_DRAG: 21,
  SEARCH_TERM_IN_URL_BAR: 22
};

// Use for event field
const ToolbarEvent = {
  ACTION: 0,
  CUSTOMIZE: 1,
  STUDY: 2
};

const TOOLBAR_EXPERIMENT_FILE = "testpilot_toolbar_study_results.sqlite";
const TOOLBAR_TABLE_NAME = "testpilot_toolbar_study";

/* On expeirment startup, if the user has customized their toolbars,
 * then we'll record a CUSTOMIZE event for each item the have in their
 * toolbar.
 */

function widgetIdToString(id) {
  for (let x in ToolbarWidget) {
    if (ToolbarWidget[x] == id) {
      return x;
    }
  }
  return id;
}

function actionIdToString(id) {
  for (let x in ToolbarAction) {
    if (ToolbarAction[x] == id) {
      return x;
    }
  }
  return id;
}

var TOOLBAR_EXPERIMENT_COLUMNS =  [
  {property: "event", type: BaseClasses.TYPE_INT_32, displayName: "Event",
   displayValue: ["Action", "Customization", "Study Metadata"]},
  {property: "item_id", type: BaseClasses.TYPE_INT_32, displayName: "Widget",
   displayValue: widgetIdToString},
  {property: "interaction_type", type: BaseClasses.TYPE_INT_32,
   displayName: "Interaction", displayValue: actionIdToString},
  {property: "timestamp", type: BaseClasses.TYPE_DOUBLE, displayName: "Time",
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
  versionNumber: 3,
  minTPVersion: "1.0a1"
};

exports.dataStoreInfo = {
  fileName: TOOLBAR_EXPERIMENT_FILE,
  tableName: TOOLBAR_TABLE_NAME,
  columns: TOOLBAR_EXPERIMENT_COLUMNS
};

// The per-window observer class:
function ToolbarWindowObserver(window) {
  ToolbarWindowObserver.baseConstructor.call(this, window);
  dump("ToolbarWindowObserver constructed for " + window + "\n");
};
BaseClasses.extend(ToolbarWindowObserver, BaseClasses.GenericWindowObserver);
ToolbarWindowObserver.prototype.urlLooksMoreLikeSearch = function(url) {
  // How to tell when a URL looks more like a search?  First approximation:
  // if there are spaces in it.  Second approximation: No periods.
  return ( (url.indexOf(" ") > -1) || (url.indexOf(".") == -1) );
};
ToolbarWindowObserver.prototype.compareSearchTerms = function(searchTerm, searchEngine) {
  if (searchTerm == this._lastSearchTerm) {
    if (searchEngine == this._lastSearchEngine) {
      dump("Repeated Search, Same Engine!\n");
      exports.handlers.record(ToolbarEvent.ACTION,
                              ToolbarWidget.SEARCH,
                              ToolbarAction.REPEATED_SEARCH_SAME_ENGINE);
    } else {
      dump("Repeated Search, Different Engine!\n");
      exports.handlers.record(ToolbarEvent.ACTION,
                              ToolbarWidget.SEARCH,
                              ToolbarAction.REPEATED_SEARCH_DIFF_ENGINE);
    }
  }
  this._lastSearchTerm = searchTerm;
  this._lastSearchEngine = searchEngine;
};
ToolbarWindowObserver.prototype.install = function() {
  // Here are the IDs of objects to listen on:

  let record = function( widget, interaction ) {
    exports.handlers.record(ToolbarEvent.ACTION, widget, interaction);
  };

  let buttonIds = ["back-button", "forward-button", "reload-button", "stop-button",
                   "home-button", "identity-box", "feed-button", "star-button",
                   "identity-popup-more-info-button",
                   "back-forward-dropmarker", "security-button",
                   "downloads-button", "print-button", "bookmarks-button",
                   "history-button", "new-tab-button", "new-window-button",
                   "cut-button", "copy-button", "paste-button", "fullscreen-button"];

  dump("Starting to register stuff...\n");
  for (let i = 0; i < buttonIds.length; i++) {
    let id = buttonIds[i];
    let elem = this.window.document.getElementById(id);
    if (!elem) {
      dump("There is no such element as " + id + "\n");
      continue;
    }
    this._listen(elem, "mouseup",
                 function(evt) {
                   // only count left button clicks and only on the element itself:
                     // (evt.button = 2 for right-click)
                   if (evt.target == elem && evt.button == 0) {
                     let code = exports.handlers._getNumberCodeForWidget(evt.target);
                     record( code, ToolbarAction.CLICK );
                   }
                 }, false);
    // Problem with just listening for "mouseup" is that it triggers even
    // if you clicked a greyed-out button... we really want something more
    // like "button clicked".  Try listening for "command"?
  }


  // TODO Look out for problems where multiple windows are open and events
  // get recorded multiple times?  May be a problem with the underlying window
  // open/close / experiment startup/shutdown handling logic??

  // Yeah, opening an "inspect chrome" window certainly seems to double up
  // my handlers for the regular window - and this persists even after I close
  // the "inspect chrome" window.

  let self = this;
  let register = function(elemId, event, widgetCode, actionCode) {
    self._listen( self.window.document.getElementById(elemId), event, function() {
                    record(widgetCode, actionCode);}, false);
  };

  register( "feed-menu", "command", ToolbarWidget.RSS_ICON, ToolbarAction.MENU_PICK);

  let bkFwdMenu = this.window.document.getElementById("back-forward-dropmarker").getElementsByTagName("menupopup").item(0);
  this._listen( bkFwdMenu, "command", function() {
                  record(ToolbarWidget.DROP_DOWN_RECENT_PAGE, ToolbarAction.MENU_PICK);
                }, false);

  register( "search-container", "popupshown", ToolbarWidget.SEARCH_ENGINE_DROP_DOWN,
            ToolbarAction.CLICK);
  register( "search-container", "command", ToolbarWidget.SEARCH_ENGINE_DROP_DOWN,
            ToolbarAction.MENU_PICK);
  // TODO: this listener below doesn't work.
  register("back-button", "command",ToolbarWidget.BACK, ToolbarAction.MENU_PICK);

  let bkmkToolbar = this.window.document.getElementById("bookmarksBarContent");
  this._listen(bkmkToolbar, "mouseup", function(evt) {
                 if (evt.button == 0 && evt.target.tagName == "toolbarbutton") {
                   record(ToolbarWidget.PERSONAL_BOOKMARKS, ToolbarAction.CLICK);
                 }}, false);

  let searchBar = this.window.document.getElementById("searchbar");
  this._listen(searchBar, "keydown", function(evt) {
                 if (evt.keyCode == 13) { // Enter key
                   record(ToolbarWidget.SEARCH, ToolbarAction.ENTER_KEY);
                   dump("Selected search engine is " + searchBar.searchService.currentEngine.name + "\n");
                   self.compareSearchTerms(searchBar.value,
                                          searchBar.searchService.currentEngine.name);
                 }
               }, false);


  this._listen(searchBar, "mouseup", function(evt) {
                 if (evt.originalTarget.getAttribute("anonid") == "search-go-button") {
                   record(ToolbarWidget.SEARCH_GO_BUTTON, ToolbarAction.CLICK);
                   dump("Selected search engine is " + searchBar.searchService.currentEngine.name + "\n");
                   self.compareSearchTerms(searchBar.value,
                                          searchBar.searchService.currentEngine.name);
                 }
               }, false);

  /* click in search box results in a focus event followed by a select event.
   * If you edit, then when you do a search OR unfocus the box, you get a "changed" event.
   * If you search without editing, you don't get a "changed" event.  We may
   * need to track what input is focused and listen for the enter key to be hit
   * or the search button to be clicked. */

  // TODO turn these low-level events into the advanced behavior we want.
  let urlBar = this.window.document.getElementById("urlbar");
  this._listen(urlBar, "keydown", function(evt) {
                 if (evt.keyCode == 13) { // Enter key
                   dump("Hit Enter with URL = " + evt.originalTarget.value + "\n");
                   record(ToolbarWidget.URLBAR, ToolbarAction.ENTER_KEY);
                   if (self.urlLooksMoreLikeSearch(evt.originalTarget.value)) {
                     record(ToolbarWidget.URLBAR, ToolbarAction.SEARCH_TERM_IN_URL_BAR);
                   }
                 }
               }, false);

  let urlGoButton = this.window.document.getElementById("go-button");
  dump("urlGoBUtton is " + urlGoButton + "\n");
  this._listen(urlGoButton, "mouseup", function(evt) {
                 record(ToolbarWidget.GO_BUTTON, ToolbarAction.CLICK);
                 dump("Clicked GO button with URL = " + urlBar.value + "\n");
                 if (self.urlLooksMoreLikeSearch(urlBar.value)) {
                   record(ToolbarWidget.URLBAR, ToolbarAction.SEARCH_TERM_IN_URL_BAR);
                 }
               }, false);
  // TODO with urlbar:
  // -- distinguish click from 2 clicks together from click-and-drag
  // (or ensure that we can distinguish this in analysis)
  // so what if on any mouseup inside the urlbar, we check urlbar selection
  // and see whether it's all selected, none selected, or some subchunk selected?
  // those correspond to the three behaviors...
  //
  // Get clicks on items in URL bar drop-down (or whether an awesomebar
  // suggestion was hilighted when you hit enter?)


  this._listen(urlBar, "popupshown", function(evt) {
                 // TODO this doesn't seem to work.
                 dump("A popup was shown from the url bar...\n");
                 dump("tagname " + evt.originalTarget.tagName + "\n");
                 dump("anonid " + evt.originalTarget.getAttribute("anonid") + "\n");
               }, false);
  this._listen(urlBar, "command", function(evt) {
                 if (evt.originalTarget.getAttribute("anonid") == "historydropmarker") {
                   record(ToolbarWidget.DROP_DOWN_MOST_VISITED, ToolbarAction.CLICK);
                 } else {
                   // TODO how do we get the clicks on the actual items in it though?
                   dump("A command came from the url bar...\n");
                   dump("tagname " + evt.originalTarget.tagName + "\n");
                   dump("anonid " + evt.originalTarget.getAttribute("anonid") + "\n");
                 }
               }, false);

  // tabbrowser id="content" contains XBL children anonid="scrollbutton-up"
  // and "scrollbutton-down-stack" and anonid="newtab-button"

  let tabBar = this.window.document.getElementById("content");
  this._listen(tabBar, "mouseup", function(evt) {
                 if (evt.button == 0) {
                   switch (evt.originalTarget.getAttribute("anonid")) {
                   case "scrollbutton-up":
                     record(ToolbarWidget.TABBAR_SCROLL, ToolbarAction.SCROLL_BTN_UP);
                     break;
                   case "scrollbutton-down":
                     record(ToolbarWidget.TABBAR_SCROLL, ToolbarAction.SCROLL_BTN_DOWN);
                     break;
                   case "newtab-button":
                     record(ToolbarWidget.TABBAR_NEW_BTN, ToolbarAction.CLICK);
                     break;
                   default:
                     let parent = evt.originalTarget.parentNode;
                     if (parent.tagName == "scrollbar") {
                       if (parent.parentNode.tagName == "HTML") {
                         let widget;
                         let orientation = parent.getAttribute("orient");
                         if (orientation == "horizontal") { // vs "vertical"
                           widget = ToolbarWidget.HORIZONTAL_SCROLLBAR;
                         } else {
                           widget = ToolbarWidget.VERTICAL_SCROLLBAR;
                         }
                         let part = evt.originalTarget.tagName;
                         if (part == "xul:slider") {
                           // TODO can't distinguish slider from track...
                           record(widget, ToolbarAction.SCROLL_SLIDER);
                         } else if (part == "xul:scrollbarbutton") {
                           let upOrDown = evt.originalTarget.getAttribute("type");
                           if (upOrDown == "increment") { // vs. "decrement"
                             record(widget, ToolbarAction.SCROLL_BTN_UP);
                           } else {
                             record(widget, ToolbarAction.SCROLL_BTN_DOWN);
                           }
                         }
                       }
                     }
                   }
                 }
               }, false);

   this._listen(tabBar, "popupshown", function(evt) {
                 if (evt.originalTarget.getAttribute("anonid") =="alltabs-popup") {
                   record( ToolbarWidget.TABBAR_DROP_DOWN, ToolbarAction.CLICK);
                 }
               }, false);
    this._listen(tabBar, "command", function(evt) {
                   if (evt.originalTarget.tagName == "menuitem") {
                     record( ToolbarWidget.TABBAR_DROP_DOWN, ToolbarAction.MENU_PICK);
                   }
               }, false);
  /* Note we also get command events when you hit the tab scroll bars and
   * they actually scroll (the tagName will be "xul:toolbarbutton") -- as
   * opposed to moseup which triggers even if there's nowhere to scroll, this
   * might be a more precise way to get that event.  In fact look at using
   * more command events on all the toolbar buttons...*/


  let bkmkPanel = this.window.document.getElementById("editBookmarkPanel");
  this._listen(bkmkPanel, "popupshown", function(evt) {
                 dump("You opened the edit-bookmark panel.\n");
               }, false);

  this._listen(bkmkPanel, "command", function(evt) {
                 switch (evt.originalTarget.getAttribute("id")) {
                 case "editBookmarkPanelRemoveButton":
                   dump("You clicked the remove bookmark button.\n");
                   break;
                 }
                 // Other buttons we can get here:
                 //editBMPanel_foldersExpander
                 //editBMPanel_tagsSelectorExpander
                 //editBookmarkPanelDeleteButton
                 //editBookmarkPanelDoneButton
               }, false);


  // also look at id="FindToolbar" and whether it has hidden = true or not.
};

function GlobalToolbarObserver()  {
  dump("GlobalToolbarObserver is calling baseConstructor...\n");
  GlobalToolbarObserver.baseConstructor.call(this, ToolbarWindowObserver);
}
BaseClasses.extend(GlobalToolbarObserver, BaseClasses.GenericGlobalObserver);
GlobalToolbarObserver.prototype.onExperimentStartup = function(store) {
  GlobalToolbarObserver.superClass.onExperimentStartup.call(this, store);
  // Record study version on startup:
  this.record(ToolbarEvent.STUDY, 0, exports.experimentInfo.versionNumber);

  // Look at the front window and see if its toolbars have been customized;
  // if they have, then record all toolbar customization.
  let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                        .getService(Ci.nsIWindowMediator);
  let frontWindow = wm.getMostRecentWindow("navigator:browser");
  if (this.toolbarsAreCustomized(frontWindow)) {
    this.recordToolbarCustomizations(frontWindow);
  }

  // How many bookmarks in the bookmark toolbar, and is status bar shown?
  let bkmkToolbar = frontWindow.document.getElementById("bookmarksBarContent");
  let bkmks = bkmkToolbar.getElementsByClassName("bookmark-item");
  for (let b = 0; b < bkmks.length; b++) {
    this.record(ToolbarEvent.CUSTOMIZE, ToolbarWidget.PERSONAL_BOOKMARKS, ToolbarAction.PRESENT);
  }

  let statusBar = frontWindow.document.getElementById("status-bar");
  if (statusBar.getAttribute("hidden") == "true") {
    this.record(ToolbarEvent.CUSTOMIZE, ToolbarWidget.STATUS_BAR, ToolbarAction.ABSENT);
  } else {
    this.record(ToolbarEvent.CUSTOMIZE, ToolbarWidget.STATUS_BAR, ToolbarAction.PRESENT);
  }

  dump("GlobalToolbarObserver.onExperimentStartup.\n");
};

GlobalToolbarObserver.prototype.record = function(event, itemId,
                                                  interactionType) {
  if (!this.privateMode) {
    this._store.storeEvent({
      event: event,
      item_id: itemId,
      interaction_type: interactionType,
      timestamp: Date.now()
    });
  }
};

GlobalToolbarObserver.prototype._getNumberCodeForWidget = function(elem) {
  let id = elem.getAttribute("id");
  let tagName = elem.tagName;
  dump("Getting number code for widget tag " + tagName + " id " + id + "\n");
  switch (tagName) {
  case "toolbarspacer": case "toolbarspring": case "toolbarseparator":
  case "splitter": case "hbox":
    return ToolbarWidget.SPACER;
    break;
  case "toolbaritem":
    switch(id) {
    case "unified-back-forward-button": return ToolbarWidget.UNIFIED_BACK_FWD;
    case "urlbar-container": return ToolbarWidget.URLBAR;
    case "search-container": return ToolbarWidget.SEARCH;
    case "navigator-throbber": return ToolbarWidget.THROBBER;
    case "personal-bookmarks": return ToolbarWidget.PERSONAL_BOOKMARKS;
    case "menubar-items": return ToolbarWidget.MENU_BAR;
    }
    break;
  case "toolbarbutton":
    switch (id) {
    case "downloads-button": return ToolbarWidget.DOWNLOADS_BUTTON;
    case "print-button": return ToolbarWidget.PRINT_BUTTON;
    case "bookmarks-button": return ToolbarWidget.BOOKMARKS_BUTTON;
    case "history-button": return ToolbarWidget.HISTORY_BUTTON;
    case "new-tab-button": return ToolbarWidget.NEW_TAB_BUTTON;
    case "new-window-button":return ToolbarWidget.NEW_WINDOW_BUTTON;
    case "cut-button":return ToolbarWidget.CUT_BUTTON;
    case "copy-button":return ToolbarWidget.COPY_BUTTON;
    case "paste-button":return ToolbarWidget.PASTE_BUTTON;
    case "fullscreen-button":return ToolbarWidget.FULLSCREEN_BUTTON;
    case "reload-button":return ToolbarWidget.RELOAD;
    case "stop-button":return ToolbarWidget.STOP;
    case "home-button":return ToolbarWidget.HOME;
    case "back-button":return ToolbarWidget.BACK;
    case "forward-button":return ToolbarWidget.FORWARD;
    case "back-forward-dropmarker":return ToolbarWidget.DROP_DOWN_RECENT_PAGE;
    }
    break;
  case "box":
    switch (id) {
    case "identity-box": return ToolbarWidget.SITE_ID_BUTTON;
    }
    break;
  case "image":
    switch (id) {
    case "star-button": return ToolbarWidget.BOOKMARK_STAR;
    case "go-button": return ToolbarWidget.GO_BUTTON;
    }
    break;
  case "statusbarpanel":
    switch (id) {
    case "security-button": return ToolbarWidget.STATUS_BAR_LOCK;
    }
    break;
  case "button":
    switch (id) {
    case "feed-button": return ToolbarWidget.RSS_ICON;
    case "identity-popup-more-info-button": return ToolbarWidget.SITE_ID_MORE_INFO;
    }
    break;
  }
  return ToolbarWidget.UNKNOWN; // should never happen.
};

GlobalToolbarObserver.prototype._getNumberCodeForToolbarId = function(id) {
  switch(id) {
  case "nav-bar":
    return ToolbarAction.CUST_IN_NAVBAR;
  case "PersonalToolbar":
    return ToolbarAction.CUST_IN_PERSONAL;
  case "toolbar-menubar":
    return ToolbarAction.CUST_IN_MENUBAR;
  default:
    return ToolbarAction.CUST_IN_CUSTOM_TOOLBAR;
  }
};

GlobalToolbarObserver.prototype.toolbarsAreCustomized = function(win) {

  // TODO figure out how to tell if toolbars are set to "icons",
  // "Icons and text", or "text" and whether "small icons" is on or not.

  let navBar = win.document.getElementById("nav-bar");
  let expectedChildren = ["unified-back-forward-button", "reload-button",
                          "stop-button", "home-button", "urlbar-container",
                          "urlbar-search-splitter", "search-container",
                          "fullscreenflex", "window-controls"];
  dump("Attempting to read children of navBar...\n");
  if (navBar.childNodes.length != expectedChildren.length) {
    dump("Navbar modified (different number of children).\n");
    return true;
  } else {
    for (let i = 0; i < expectedChildren.length; i++) {
      if (navBar.childNodes[i].getAttribute("id") != expectedChildren[i]) {
        dump("Navbar modified (different children item).\n");
        return true;
      }
    }
  }
  dump("Read children of navBar.\n");

  let expectedBars = ["toolbar-menubar", "nav-bar", "customToolbars",
                      "PersonalToolbar"];
  let toolbox = win.document.getElementById("navigator-toolbox");
  if (toolbox.childNodes.length != expectedChildren.length) {
    dump("Toolbars modified (different number of toolbars).\n");
    return true;
  } else {
    for (let i = 0; i < expectedBars.length; i++) {
      if (toolbox.childNodes[i].getAttribute("id") != expectedBars[i]) {
        dump("Toolbars modified (different toolbar item).\n");
        return true;
      }
    }
  }

  // Expect PersonalToolbar to contain personal-bookmarks and nothing else
  let personalToolbar = win.document.getElementById("PersonalToolbar");
  if (personalToolbar.childNodes.length != 1 ||
      personalToolbar.childNodes[0].getAttribute("id") != "personal-bookmarks") {
    dump("Personal Toolbar modified.\n");
    return true;
  }

  return false;
};

GlobalToolbarObserver.prototype.recordToolbarCustomizations = function(win) {
  dump("Recording customized toolbars!\n");
  let toolbox = win.document.getElementById("navigator-toolbox");
  for (let i = 0; i < toolbox.childNodes.length; i++) {
    let toolbar = toolbox.childNodes[i];
    let toolbarId = toolbar.getAttribute("id");
    let toolbarItems = toolbar.childNodes;
    for (let j = 0; j < toolbarItems.length; j++) {
      let itemId = toolbarItems[j].getAttribute("id");
      dump("Toolbar " + toolbarId + " item " + itemId + "\n");
      let widgetCode = this._getNumberCodeForWidget(toolbarItems[j]);
      let toolbarCode = this._getNumberCodeForToolbarId(toolbarId);
      dump("Got widget code " + widgetCode + "\n");
      this.record(ToolbarEvent.CUSTOMIZE, widgetCode, toolbarCode);
    }
  }
};


exports.handlers = new GlobalToolbarObserver();

require("unload").when(
  function myDestructor() {
    dump("Calling myDestructor.\n");
    exports.handlers.uninstallAll();
  });


const DATA_CANVAS = '<div class="dataBox"> \
</div>';

exports.webContent = {
  inProgressHtml: '<h2>Thank you, Test Pilot!</h2>\
<p>You are currently in a study to find out how the Firefox toolbars are used.</p>\
 ' + BaseClasses.rawDataLink(6) + BaseClasses.STD_FINE_PRINT + DATA_CANVAS,

  completedHtml: '<h2>Excellent! You just finished the Toolbar Study!</h2>\
</p>All test data you submit will be anonymized and will not be personally identifiable.\
<b>After we analyze the data from all submissions, you will be able to see \
all new study findings by clicking on the Test Pilot icon on the bottom-right corner \
and choosing "All your studies".</b></p>'
    + BaseClasses.optOutLink(6) +
    + BaseClasses.rawDataLink(6) + BaseClasses.UPLOAD_DATA
    + BaseClasses.STD_FINE_PRINT + DATA_CANVAS,

  upcomingHtml: "",

  remainDataHtml: "",

  onPageLoad: function(experiment, document, graphUtils) {
  }
};


/*
TODO:
 Back	Mac only	click, hold, select from drop-down
 site ID button 	Is site id ssl, EV, or nothing?
 Reload -                                Is the page currently loading?

 top left icon	win		clicks on it	right/left click on it
 window menu (after left click on the top icon)	win		clicks on each menu item
 menu bar	win/mac	?

bookmark star - single click on already bookmarked star to get popup
                 VS double click on not yet bookmarked star to get popup
               record clicks on buttons inside the popup (already detected)

location bar	win/mac- 1 click
- 2 clicks together
- 1 click&drag
-any clicks on the items in the URL bar drop-down list?

- only tr track when the focus in in the loca URL bar

Scroll bar: Track vs. slider?

drag to resize the window	win/mac
right click on the Chrome to see the "customize toolbar"	win/mac	P2	clicks on it	choices on this customization window
 */