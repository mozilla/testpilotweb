BaseClasses = require("study_base_classes.js");

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
  // Here are the IDs of objects to listen on:

  let buttonIds = ["back-button", "forward-button", "reload-button", "stop-button",
             "home-button", "identity-box", "feed-button", "star-button",
             "go-button", "identity-popup-more-info-button",
                   "back-forward-dropmarker"];

  // TODO despite what DOMInspector says, apparently there is no
  // "search-go-button".

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

  let urlBar = this.window.document.getElementById("searchbar");
  this._listen(urlBar, "select", function(evt) {
                 dump("U SELEKTID URL TXT\n");
               }, false);
  this._listen(urlBar, "change", function(evt) {
                 dump("U CHAINJD URL TXT\n");
               }, false);
  this._listen(urlBar, "focus", function(evt) {
                 dump("U FOAKUST URL TXT\n");
               }, false);

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
  // order now.
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
DONE:
   Back	Mac/win clicks DONE
 Forward	Mac/win		clicks on it  DONE
  reload	win/mac		clicks on it   DONE
  stop	win/mac		clicks on it    DONE
home	win/mac		clicks on it DONE
site ID button win/mac	clicks on it DONE
  site ID button       Click on "More Info" button in popup DONE
 Drop down - recent page	Mac/win		clicks on it  DONE
 drop down - Search Icon	win/mac		clicks  on it DONE
     -any clicks on the search enginesin the drop-down list? DONE
  RSS icon	win/mac		-clicks DONE
  RSS icon 	left clicks on it to see the sub menu window DONE
bookmark toolbar	win/mac	-how many items DONE
                  - how many clicks on bookmarks DONE
bookmark star	win/mac		- sing clicks on it
Search bar = magn glass - search go	win/mac		clicks on it DONE
URL bar/right arrow - Go button	win/mac		clicks on it  DONE



TODO:
 Back	Mac only	click, hold, select from drop-down
 site ID button 	Is site id ssl, EV, or nothing?
 Reload -                                Is the page currently loading?

 top left icon	win		clicks on it	right/left click on it
  window menu (after left click on the top icon)	win		clicks on each menu item
  menu bar	win/mac	?
 search box	win/mac		same query, but different engine


Within the URL bar:


location bar	win/mac		- 1 click
- 2 clicks together
- 1 click&drag

Bookmark star - double clicks on it
Bookmark star- single click and see the menu window	clicks on "remove bookmark"

drop down - recent site 	win/mac		clicks  on it	-any clicks on the items in the drop-down list?
- how many people did that?
-how many times if a person click on it?
content in URL bar	win/mac		- content in URL that is a search rather than a url (if user hit enter after typing something that's not url, e.g. it has a space: browse by name) - only tr track when the focus in in the loca URL bar

left/right button for tab scroll	win/mac		clicks on it
plus button for opening a tab	win/mac		clicks on it
drop down: list of all tabs	win/mac		clicks on it	clicks on items on the list

vertical scroll bar for web page	win/mac		clicks on arrows, the bar,
horizental scroll bar for web page	win/mac

status bar 	win/mac		on or off
status bar - lock	win/mac		clicks on it
drag to resize the window	win/mac		interaction on it
right click on the Chrome to see the "customize toolbar"	win/mac	P2	clicks on it	choices on this customization window

 */