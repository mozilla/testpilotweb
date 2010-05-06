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
  THROBBER: 8,
  DOWNLOADS_BUTTON: 9,
  PRINT_BUTTON: 10,
  BOOKMARKS_BUTTON: 11,
  HISTORY_BUTTON: 12,
  NEW_TAB_BUTTON: 13,
  NEW_WINDOW_BUTTON: 14,
  CUT_BUTTON: 15,
  COPY_BUTTON: 16,
  PASTE_BUTTON: 17,
  FULLSCREEN_BUTTON: 18,
  MENU_BAR: 19,

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
};

// Use for interaction_type field
const ToolbarAction = {
  // for customize events -- what toolbar is the item in?
  CUST_IN_NAVBAR: 0,
  CUST_IN_CUSTOM_TOOLBAR: 1,
  CUST_IN_PERSONAL: 2,
  CUST_IN_MENUBAR: 3,

  // for interaction events -- what did you do to the item?
  CLICK: 0,
  FOCUS: 1,
  ENTER_URL: 2,
  SEARCH: 3,
  CLICK_SUGGESTION: 4,
  EXPLORE_SUGGESTIONS: 5,
  SWITCH_SEARCH_ENGINE: 6
  // More?
};

// Use for event field
const ToolbarEvent = {
  ACTION: 0,
  CUSTOMIZE: 1,
  STUDY: 2
};


function getNumberCodeForWidget(elem) {
  let id = elem.getAttribute("id");
  let tagName = elem.tagName;
  switch (tagName) {
  case "toolbarspacer", "toolbarspring", "toolbarseparator", "splitter", "hbox":
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
    }
    break;
  }
  return ToolbarWidget.UNKNOWN; // should never happen.
}

function getNumberCodeForToolbarId(id) {
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
}

const TOOLBAR_EXPERIMENT_FILE = "testpilot_toolbar_study_results.sqlite";
const TOOLBAR_TABLE_NAME = "testpilot_toolbar_study";

/* On expeirment startup, if the user has customized their toolbars,
 * then we'll record a CUSTOMIZE event for each item the have in their
 * toolbar.
 */

var TOOLBAR_EXPERIMENT_COLUMNS =  [
  {property: "event", type: BaseClasses.TYPE_INT_32, displayName: "Event",
   displayValue: ["Action", "Customization", "Study Metadata"]},
  {property: "item_id", type: BaseClasses.TYPE_INT_32, displayName: "Widget"},
  {property: "interaction_type", type: BaseClasses.TYPE_INT_32,
   displayName: "Interaction"},
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
  versionNumber: 1,
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
ToolbarWindowObserver.prototype.install = function() {
  if (this.toolbarsAreCustomized()) {
    this.recordToolbarCustomizations();
  }
  this.addListeners();
};

ToolbarWindowObserver.prototype.addListeners = function() {
  // Here are the IDs of objects to listen on:

  let buttonIds = ["back-button", "forward-button", "reload-button", "stop-button",
             "home-button", "identity-box", "feed-button", "star-button",
             "go-button", "identity-popup-more-info-button",
                   "back-forward-dropmarker", "security-button"];

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
                   if (evt.target == elem) {
                     switch (evt.button) {
                       case 0:
                         dump("You left-clicked on " + id + "\n");
                       break;
                       case 2:
                         dump("You right-clicked on " + id + "\n");
                       break;
                     }
                   } else {
                     //dump("Click off target.\n");
                   }
                 }, false);
    // Problem with just listening for "mouseup" is that it triggers even
    // if you clicked a greyed-out button... we really want something more
    // like "button clicked".
  }


  // TODO Look out for problems where multiple windows are open and events
  // get recorded multiple times?  May be a problem with the underlying window
  // open/close / experiment startup/shutdown handling logic??

  // Yeah, opening an "inspect chrome" window certainly seems to double up
  // my handlers for the regular window - and this persists even after I close
  // the "inspect chrome" window.

  this._listen( this.window.document.getElementById("feed-menu"),
                "command", function() {dump("U PICKED FEED!\n");}, false);

  let bkFwdMenu = this.window.document.getElementById("back-forward-dropmarker").getElementsByTagName("menupopup").item(0);
  dump( "Registering listener to " + bkFwdMenu + "\n");
  this._listen( bkFwdMenu,
                "command", function() {dump("U PICKED RECENT HISTORY!\n");}, false);


  this._listen(this.window.document.getElementById("search-container"),
               "popupshown", function() {dump("U LOOKD SRCH ENJIN MENU\n");}, false);

  this._listen(this.window.document.getElementById("search-container"),
               "command", function() {dump("U PIKD SRCH ENJIN\n");}, false);

  // Note: this one don't work.
  this._listen(this.window.document.getElementById("back-button"),
               "command", function() {dump("U PIKD RESINT HISTERY FRUM BAK BUTN.\n");}, false);
  // can also listen for "popupshown", "popuphidden".


  let bkmkToolbar = this.window.document.getElementById("bookmarksBarContent");
  this._listen(bkmkToolbar, "mouseup", function(evt) {
                 if (evt.button == 0 && evt.target.tagName == "toolbarbutton") {
                   dump("U KLIKD BUKMARK IN BUKMARK TULBAR\n");
                 }}, false);

  let bkmks = bkmkToolbar.getElementsByClassName("bookmark-item");
  dump("U HAS " + bkmks.length + " TULBAR BKMKS.\n");

  let searchBar = this.window.document.getElementById("searchbar");
  this._listen(searchBar, "select", function(evt) {
                 dump("U SELEKTID SRCH TXT\n");
               }, false);
  this._listen(searchBar, "change", function(evt) {
                 dump("U CHAINJD SRCH TXT\n");
               }, false);
  this._listen(searchBar, "focus", function(evt) {
                 dump("U FOAKUST SRCH TXT\n");
               }, false);

  this._listen(searchBar, "mouseup", function(evt) {
                 if (evt.originalTarget.getAttribute("anonid") == "search-go-button") {
                   dump("U CLICKD SRCH GO BTN\n");
                 }
               }, false);


  /* click in search box results in a focus event followed by a select event.
   * If you edit, then when you do a search OR unfocus the box, you get a "changed" event.
   * If you search without editing, you don't get a "changed" event.  We may
   * need to track what input is focused and listen for the enter key to be hit
   * or the search button to be clicked. */

  let urlBar = this.window.document.getElementById("urlbar");
  this._listen(urlBar, "select", function(evt) {
                 dump("U SELEKTID URL TXT\n");
               }, false);
  this._listen(urlBar, "change", function(evt) {
                 dump("U CHAINJD URL TXT\n");
               }, false);
  this._listen(urlBar, "focus", function(evt) {
                 dump("U FOAKUST URL TXT\n");
               }, false);

  this._listen(urlBar, "popupshown", function(evt) {
                 dump("A popup was shown from the url bar...\n");
                 dump("tagname " + evt.originalTarget.tagName + "\n");
                 dump("anonid " + evt.originalTarget.getAttribute("anonid") + "\n");
               }, false);
  this._listen(urlBar, "command", function(evt) {
                 if (evt.originalTarget.getAttribute("anonid") == "historydropmarker") {
                   dump("You clicked on the history drop down marker.\n");
                 } else {
                   dump("A command came from the url bar...\n");
                   dump("tagname " + evt.originalTarget.tagName + "\n");
                   dump("anonid " + evt.originalTarget.getAttribute("anonid") + "\n");
                 }
               }, false);
  //watch for command with anonid = historydropmarker

  // tabbrowser id="content" contains XBL children anonid="scrollbutton-up"
  // and "scrollbutton-down-stack" and anonid="newtab-button"

  let tabBar = this.window.document.getElementById("content");
  this._listen(tabBar, "mouseup", function(evt) {
                 if (evt.button == 0) {
                   switch (evt.originalTarget.getAttribute("anonid")) {
                   case "scrollbutton-up":
                     dump("You clicked on left tab scrollbutton.\n");
                     break;
                   case "scrollbutton-down":
                     dump("You clicked on right tab scrollbutton.\n");
                     break;
                   case "newtab-button":
                     dump("You clicked on new tab button.\n");
                     break;
                   default:
                     let parent = evt.originalTarget.parentNode;
                     if (parent.tagName == "scrollbar") {
                       if (parent.parentNode.tagName == "HTML") {
                         let orientation = parent.getAttribute("orient");
                         let part = evt.originalTarget.tagName;
                         if (part == "xul:slider") {
                           dump("You clicked the slider of the ");
                           dump(orientation + " scrollbar.\n");
                         } else if (part == "xul:scrollbarbutton") {
                           let upOrDown = evt.originalTarget.getAttribute("type");
                           // type is "increment" or "decrement".
                           dump("You clicked the " + upOrDown + " button of the ");
                           dump(orientation + " scrollbar.\n");
                         }
                       }
                     }
                   }
                 }
               }, false);

   this._listen(tabBar, "popupshown", function(evt) {
                 if (evt.originalTarget.getAttribute("anonid") =="alltabs-popup") {
                   dump("You popped open the all tabs menu.\n");
                 }
               }, false);
    this._listen(tabBar, "command", function(evt) {
                   if (evt.originalTarget.tagName == "menuitem") {
                     dump("You picked an item from the all tabs menu.\n");
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

  let statusBar = this.window.document.getElementById("status-bar");
  if (statusBar.getAttribute("hidden") == "true") {
    dump("Status bar is hidden.\n");
  } else {
    dump("Status bar is shown.\n");
  }

  // also look at id="FindToolbar" and whether it has hidden = true or not.
};

ToolbarWindowObserver.prototype.toolbarsAreCustomized = function() {

  // TODO figure out how to tell if toolbars are set to "icons",
  // "Icons and text", or "text" and whether "small icons" is on or not.

  let navBar = this.window.document.getElementById("nav-bar");
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
  let toolbox = this.window.document.getElementById("navigator-toolbox");
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
  let personalToolbar = this.window.document.getElementById("PersonalToolbar");
  if (personalToolbar.childNodes.length != 1 ||
      personalToolbar.childNodes[0].getAttribute("id") != "personal-bookmarks") {
    dump("Personal Toolbar modified.\n");
    return true;
  }

  return false;
};

ToolbarWindowObserver.prototype.recordToolbarCustomizations = function() {
  dump("Recording customized toolbars!\n");
  let toolbox = this.window.document.getElementById("navigator-toolbox");
  for (let i = 0; i < toolbox.childNodes.length; i++) {
    let toolbar = toolbox.childNodes[i];
    let toolbarId = toolbar.getAttribute("id");
    let toolbarItems = toolbar.childNodes;
    for (let j = 0; j < toolbarItems.length; j++) {
      let itemId = toolbarItems[j].getAttribute("id");
      dump("Toolbar " + toolbarId + " item " + itemId + "\n");
      exports.handlers.record(ToolbarEvent.CUSTOMIZE,
                              getNumberCodeForWidget(toolbarItems[j]),
                              getNumberCodeForToolbarId(toolbarId));
    }
  }
};


function GlobalToolbarObserver()  {
  dump("GlobalToolbarObserver is calling baseConstructor...\n");
  GlobalToolbarObserver.baseConstructor.call(this, ToolbarWindowObserver);
}
BaseClasses.extend(GlobalToolbarObserver, BaseClasses.GenericGlobalObserver);
GlobalToolbarObserver.prototype.onExperimentStartup = function(store) {
  GlobalToolbarObserver.superClass.onExperimentStartup.call(this, store);
  // TODO record study version.

  // TODO if there is customization, record the customized toolbar
  // order now.... we don't need to record it on every window open so it
  // really makes more sense to be here than in the per-window class.
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
search box	win/mac		same query, but different engine

bookmark star - single click on already bookmarked star to get popup
                 VS double click on not yet bookmarked star to get popup

location bar	win/mac- 1 click
- 2 clicks together
- 1 click&drag
-any clicks on the items in the URL bar drop-down list?
content in URL bar	win/mac		- content in URL that is a search rather than a url (if user hit enter after typing something that's not url, e.g. it has a space: browse by name) - only tr track when the focus in in the loca URL bar

Scroll bar: Track vs. slider?

drag to resize the window	win/mac
right click on the Chrome to see the "customize toolbar"	win/mac	P2	clicks on it	choices on this customization window
 */