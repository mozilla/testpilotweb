BaseClasses = require("study_base_classes.js");

const ORIGINAL_TEST_ID = 100;
const MY_TEST_ID = 101; // We are on second run
/* Non-numeric IDs would be nicer but this is not supported in the extension
 * yet. */

/* Explanation of the schema:
 * Schema is highly generic so that it can handle everything from toolbar
 * customizations to mouse events to menu selections.
 *
 * Column name        Meaning
 * Event        =     study metadata, customization, or action? (Int code)
 * Item         =     Top-level element: "File menu", "Url bar", "tab bar",
 *                    etc.  (String)
 * Sub-item     =     Menu item name, or like "right scroll button", etc.
 *                    (String)
 * Interaction  =     Click, menu-pick, right-click, click-and-hold,
 *                          keyboard shortcut, etc. (String)
 * Timestamp    =     Milliseconds since epoch. (Long int)
 */

const EVENT_CODES = {
  METADATA: 0,
  ACTION: 1,
  MENU_HUNT: 2,
  CUSTOMIZE: 3
};

var COMBINED_EXPERIMENT_COLUMNS =  [
  {property: "event", type: BaseClasses.TYPE_INT_32, displayName: "Event",
   displayValue: ["Study Metadata", "Action", "Menu Hunt", "Customization"]},
  {property: "item", type: BaseClasses.TYPE_STRING, displayName: "Element"},
  {property: "sub_item", type: BaseClasses.TYPE_STRING,
   displayName: "Sub-Element"},
  {property: "interaction_type", type: BaseClasses.TYPE_STRING,
   displayName: "Interaction"},
  {property: "timestamp", type: BaseClasses.TYPE_DOUBLE, displayName: "Time",
   displayValue: function(value) {return new Date(value).toLocaleString();}}
];

exports.experimentInfo = {
  startDate: null, // Null start date means we can start immediately.
  duration: 7, // Days
  testName: "Firefox 4 Beta Interface (part 2)",
  testId: MY_TEST_ID,
  testInfoUrl: "https://testpilot.mozillalabs.com/testcases/betaui.html",
  summary: "We are studying how the changes to the toolbar and menu bar in the"
           + " Firefox 4 beta affect usage of the interface.",
  thumbnail: null,
  optInRequired: false,
  recursAutomatically: false,
  recurrenceInterval: 0,
  versionNumber: 2,
  minTPVersion: "1.0rc1",
  minFXVersion: "4.0b1"
};

exports.dataStoreInfo = {
  fileName: "combined_beta_study_results.sqlite",
  tableName: "combined_beta_study_results",
  columns: COMBINED_EXPERIMENT_COLUMNS
};

/* Window observer class - one is instantiated per window; most of what
 * we observe in this study is per-window, so this class registers a LOT
 * of listeners.
 */
function CombinedWindowObserver(window) {
  CombinedWindowObserver.baseConstructor.call(this, window);
};
BaseClasses.extend(CombinedWindowObserver,
                   BaseClasses.GenericWindowObserver);
// Window observer class, helper functions:
CombinedWindowObserver.prototype.compareSearchTerms = function(searchTerm,
                                                               searchEngine) {
  /* Are two successive searches done with the same search term?
   * Are they with the same search engine or not?
   * Don't record the search term or the search engine, just whether it's the
   * same or not. */
  if (searchTerm == this._lastSearchTerm) {
    if (searchEngine == this._lastSearchEngine) {
      exports.handlers.record(EVENT_CODES.ACTION, "search bar", "",
                              "same search same engine");
    } else {
      exports.handlers.record(EVENT_CODES.ACTION, "search bar", "",
                              "same search different engine");
    }
  }
  this._lastSearchTerm = searchTerm;
  this._lastSearchEngine = searchEngine;
};
CombinedWindowObserver.prototype.urlLooksMoreLikeSearch = function(url) {
  /* Trying to tell whether user is inputting searches in the URL bar.
   * Heuristic to tell whether a "url" is reall a search term:
   * If there are spaces in it, and/or it has no periods in it.
   */
  return ( (url.indexOf(" ") > -1) || (url.indexOf(".") == -1) );
};
CombinedWindowObserver.prototype.recordPanoramaState = function() {
  /* Record panorama state - Record number of panorama tab groups, then
   * record number of tabs in each group. */
  if (this.window.TabView._window) {
    let gi = this.window.TabView._window.GroupItems;
    exports.handlers.record(EVENT_CODES.CUSTOMIZE, "Panorama", "Num Groups:",
                gi.groupItems.length);
    for each (let g in gi.groupItems) {
      exports.handlers.record(EVENT_CODES.CUSTOMIZE, "Panorama",
                              "Num Tabs In Group:", g._children.length);
    }
  }
  // TODO this doesn't catch tabs which are not affiliated with any group.
  // Is there a way to do that?
};

// Window observer class, main listener registration
CombinedWindowObserver.prototype.install = function() {
  console.info("Starting to install listeners for combined window observer.");
  let window = this.window;

  // Helper function for recording actions
  let record = function( item, subItem, interaction ) {
    exports.handlers.record(EVENT_CODES.ACTION, item, subItem, interaction);
  };

  /* Register menu listeners:
   * 1. listen for mouse-driven command events on the main menu bar: */
  let mainMenuBar = window.document.getElementById("main-menubar");
  this._listen(mainMenuBar, "command", function(evt) {
    let menuItemId = "unknown";
    let menuId = "unknown";
    if (evt.target.id) {
      menuItemId = evt.target.id;
    }
    let node = evt.target;
    while(node) {
      if (node.tagName == "menupopup") {
        menuId = node.id;
        break;
      }
      if (node.id && menuItemId == "unknown") {
        menuItemId = node.id;
      }
      node = node.parentNode;
    }
    record(menuId, menuItemId, "mouse");
    },
    true);

  /* 2. Listen for keyboard shortcuts and mouse command events on the
   * main command set: */
  let mainCommandSet = window.document.getElementById("mainCommandSet");
  this._listen(mainCommandSet, "command", function(evt) {
    let tag = evt.sourceEvent.target;
    if (tag.tagName == "menuitem") {
      let menuItemId = tag.id?tag.id:tag.command;
      let menuId = "unknown";
      let node = evt.sourceEvent.target;
      while(node) {
        if (node.tagName == "menupopup") {
          menuId = node.id;
          break;
        }
        node = node.parentNode;
      }
      record(menuId, menuItemId, "mouse");
    } else if (tag.tagName == "key") {
      record("menus", tag.command?tag.command:tag.id, "key shortcut");
    }},
    true);
  /* Intentionally omitted the code from the menu study that tracks
   * number of menus hunted through and time spent hunting */

  // Record clicks in tab bar right-click context menu:
  let tabContext = window.document.getElementById("tabContextMenu");
  this._listen(tabContext, "command", function(evt) {
                     if (evt.target && evt.target.id) {
                       record("tab context menu", evt.target.id, "click");
                       if (evt.target.id == "context_pinTab" ||
                           evt.target.id == "context_unpinTab") {
                         /* When you pin or unpin an app tab, record
                          * number of pinned tabs (number recorded is number
                          * BEFORE the change)*/
                         let numAppTabs = window.gBrowser._numPinnedTabs;
                         exports.handlers.record(EVENT_CODES.CUSTOMIZE,
                                                 "Tab Bar", "Num App Tabs",
                                                 numAppTabs);
                       }
                     }
                   }, true);
  // TODO: Other context menus?

  // Register listeners on all the main toolbar buttons we care about:
  let buttonIds = ["back-button", "forward-button", "reload-button",
                   "stop-button", "home-button", "feed-button", "star-button",
                   "identity-popup-more-info-button",
                   "back-forward-dropmarker", "security-button",
                   "downloads-button", "print-button", "bookmarks-button",
                   "history-button", "new-window-button", "tabview-button",
                   "cut-button", "copy-button", "paste-button",
                   "fullscreen-button"];
  for (let i = 0; i < buttonIds.length; i++) {
    let id = buttonIds[i];
    let elem = window.document.getElementById(id);
    if (!elem) {
      // The element might not be there, if user customized it out
      console.info("Can't install listener: no element with id " + id);
      continue;
    }
    this._listen(elem, "mouseup",
                 function(evt) {
                   /* only count left button clicks and only on
                    * the element itself: */
                   if (evt.target == elem && evt.button == 0) {
                     let tagName = evt.target.tagName;
                     /* There are a lot of spacer elements in the toolbar
                      * that we don't care about tracking individually: */
                     if (tagName == "toolbarspacer" ||
                         tagName == "toolbarspring" ||
                         tagName == "toolbarseparator" ||
                         tagName == "splitter" ||
                         tagName == "hbox") {
                       id = "spacer";
                     } else {
                       id = evt.target.id;
                     }
                     record(id, "", "click");
                   }
                 }, false);
    /* LONGTERM TODO:
     * Problem with just listening for "mouseup" is that it triggers even
     * if you clicked a greyed-out button... we really want something more
     * like "button clicked".  Try listening for "command"? */
  }

  /* Listen on site ID button, see if page is SSL, or extended validation,
   * or nothing.  (TODO this is getting double-counted because it triggers
   * again if you click to close; should trigger on popupshown or something.)*/
  let idBox = window.document.getElementById("identity-box");
  this._listen(idBox, "mouseup", function(evt) {
                 let idBoxClass = idBox.getAttribute("class");
                 if (idBoxClass.indexOf("verifiedIdentity") > -1) {
                   record("site-id-button", "", "extended validation");
                 } else if (idBoxClass.indexOf("verifiedDomain") > -1) {
                   record("site-id-button", "", "SSL");
                 } else {
                   record("site-id-button", "", "none");
                 }
               }, false);

  // Helper function for listening miscellaneous toolbar interactions
  let self = this;
  let register = function(elemId, event, item, subItem, interactionName) {
    if (!self.window.document.getElementById(elemId)) {
      console.info("Can't register " + elemId + ", no such element.");
      return;
    }
    self._listen( self.window.document.getElementById(elemId), event,
                  function() {
                    record(item, subItem, interactionName);
                  }, false);
  };

  // Observe item selection in the RSS feed drop down menu:
  register( "feed-menu", "command", "rss icon", "menu item", "mouse pick");

  // Observe item selection in the search engine drop down menu:
  register( "search-container", "popupshown", "search engine dropdown",
            "menu item", "click");
  register( "search-container", "command", "search engine dropdown",
            "menu item", "menu pick");

  /* Observe item selection in recent history menu - which you can get by
   * clicking on the back button, forward button, and also (on Windows but
   * not on Mac) the back-forward-dropmarker. */
  register( "back-forward-dropmarker", "command", "recent page dropdown",
            "menu item", "mouse pick");
  this._listen(window.document.getElementById("back-button"),
               "mouseup", function(evt) {
                 if (evt.originalTarget.tagName == "menuitem") {
                   record("back-button", "dropdown menu", "mouse pick");
                 }
               }, false);
  this._listen(window.document.getElementById("forward-button"),
               "mouseup", function(evt) {
                 if (evt.originalTarget.tagName == "menuitem") {
                   record("forward-button", "dropdown menu", "mouse pick");
                 }
               }, false);

  // Observe clicks on bookmarks in the bookmarks toolbar
  let bkmkToolbar = window.document.getElementById("personal-bookmarks");
  this._listen(bkmkToolbar, "mouseup", function(evt) {
                 if (evt.button == 0 && evt.target.tagName == "toolbarbutton") {
                   if (evt.target.id == "bookmarks-menu-button") {
                     record("bookmarks-menu-button", "", "click");
                   } else {
                     record("bookmark toolbar", "personal bookmark", "click");
                   }
                 }}, false);

  // Observe clicks on the new unified Firefox menu button in the Windows beta
  let firefoxButton = window.document.getElementById("appmenu-button");
  this._listen(firefoxButton, "mouseup", function(evt) {
    let id = evt.target.id;
    if (!id) {
	switch( evt.target.parentNode.id) {
	case "appmenu_bookmarksMenupopup":
	    id = "User boomark item";
	    break;
	case "appmenu_historyMenupopup":
	    id = "User history item";
	    break;
	case "appmenu_recentlyClosedTabsMenupopup":
	    id = "Recently closed tab item";
	    break;
	case "appmenu_recentlyClosedWindowsMenupopup":
	    id = "Recently closed window item";
	    break;
	case "appmenu_developer_popup":
	    id = evt.target.label;
	    break;
	case "appmenu_customizeMenu":
	    id = evt.target.label;
	    break;
	default:
	    dump("Unrecognized parent: " + evt.target.parentNode.id + "\n");
	}
    }
    record("appmenu-button", id, "click");
  }, false);

  // Observe clicks on Feedback button
  // TODO can we fold this into the generic button observer?
  let feedbackToolbar = window.document.getElementById("feedback-menu-button");
  this._listen(feedbackToolbar, "mouseup", function(evt) {
    record("feedback-toolbar", evt.target.id, "click");
  }, false);

  /* Record clicks on new bookmark menu button; record "personal bookmark"
   * rather than the name of the item picked */
  let bmkButton = window.document.getElementById("bookmarks-menu-button");
  this._listen(bmkButton, "mouseup", function(evt) {
    record("bookmarks-menu-button", evt.target.id || "personal bookmark", "click");
  }, false);

  // Listen on search bar ues by mouse and keyboard, including repeated
  // searches (same engine or different engine?)
  let searchBar = window.document.getElementById("searchbar");
  this._listen(searchBar, "keydown", function(evt) {
                 if (evt.keyCode == 13) { // Enter key
                   record("searchbar", "", "enter key");
                   self.compareSearchTerms(searchBar.value,
                                          searchBar.searchService.currentEngine.name);
                 }
               }, false);
  this._listen(searchBar, "mouseup", function(evt) {
                 if (evt.originalTarget.getAttribute("anonid") == "search-go-button") {
                   record("searchbar", "go button", "click");
                   self.compareSearchTerms(searchBar.value,
                                          searchBar.searchService.currentEngine.name);
                 }
               }, false);

  // Listen on URL bar:
  let urlBar = window.document.getElementById("urlbar");
  this._listen(urlBar, "keydown", function(evt) {
                 if (evt.keyCode == 13) { // Enter key
                   if (self.urlLooksMoreLikeSearch(evt.originalTarget.value)) {
                     record("urlbar", "search term", "enter key");
                   } else {
                     record("urlbar", "url", "enter key");
                   }
                 }
               }, false);

  let urlGoButton = window.document.getElementById("go-button");
  this._listen(urlGoButton, "mouseup", function(evt) {
                 if (self.urlLooksMoreLikeSearch(urlBar.value)) {
                   record("urlbar", "search term", "go button click");
                 } else {
                   record("urlbar", "url", "go button click");
                 }
               }, false);

  /* Intentionally omitted: Code for observing individual mouseup/mousedown
   * /change/select events in URL bar to distinguish click-and-insert,
   * select-and-replace, or replace-all URL editing actions. */

  // Observe when the most-frequently-used menu in the URL bar is opened
  this._listen(urlBar, "command", function(evt) {
                 if (evt.originalTarget.getAttribute("anonid") == "historydropmarker") {
                   record("urlbar", "most frequently used menu", "open");
                 }
               }, false);
  /* TODO Get clicks on items in URL bar drop-down (or whether an awesomebar
   * suggestion was hilighted when you hit enter?)  */


  // Record Clicks on Scroll Buttons
  let content = window.document.getElementById("content");
  this._listen(content, "mouseup", function(evt) {
                 if (evt.button == 0) {
                   let parent = evt.originalTarget.parentNode;
                   if (parent.tagName == "scrollbar") {
                     if (parent.parentNode.tagName == "HTML") {
                       let orientation = parent.getAttribute("orient");
                       let widgetName = orientation + " scrollbar";
                       let part = evt.originalTarget.tagName;
                       if (part == "xul:slider") {
                         // TODO can't distinguish slider from track...
                         record(widgetName, "slider", "drag");
                       } else if (part == "xul:scrollbarbutton") {
                         let type = evt.originalTarget.getAttribute("type");
                         if (type == "increment") { // vs. "decrement"
                           record(widgetName, "up scroll button", "click");
                         } else {
                           record(widgetName, "down scroll button", "click");
                         }
                       }
                     }
                   }
                 }
               }, false);

    // Record tab bar interactions
    let tabBar = window.document.getElementById("TabsToolbar");
    this._listen(tabBar, "mouseup", function(evt) {
                   if (evt.button == 0) {
                     let targ = evt.originalTarget;
                     if (targ.id == "new-tab-button") {
                       record("tabbar", "new tab button", "click");
                     } else if (targ.className == "tabs-newtab-button") {
                       record("tabbar", "new tab button", "click");
                     } else if (targ.id == "alltabs-button") {
                       record("tabbar", "drop down menu", "click");
                     } else {
                       switch (targ.getAttribute("anonid")) {
                       case "scrollbutton-up":
                         record("tabbar", "left scroll button", "mouseup");
                         break;
                       case "scrollbutton-down":
                         record("tabbar", "right scroll button", "mouseup");
                         break;
                       }
                     }
                   }
                 }, false);
  // Record mouse-up and mouse-down on tab scroll buttons separately
  // so that we can tell the difference between click vs click-and-hold
    this._listen(tabBar, "mousedown", function(evt) {
                   if (evt.button == 0) {
                     let anonid = evt.originalTarget.getAttribute("anonid");
                     if (anonid == "scrollbutton-up") {
                         record("tabbar", "left scroll button", "mouseup");
                     }
                     if (anonid == "scrollbutton-down") {
                         record("tabbar", "right scroll button", "mouseup");
                     }
                   }
                 }, false);
    // Record picking an item from the tab drop down menu
    this._listen(tabBar, "command", function(evt) {
                   if (evt.originalTarget.tagName == "menuitem") {
                     /* TODO this seems to get triggered when you edit
                      * something in about:config and click OK or cancel
                      * -- weird. */
                     record("tabbar", "drop down menu", "menu pick");
                   }
               }, false);
  /* LONGTERM TODO:
   * Note we also get command events when you hit the tab scroll bars and
   * they actually scroll (the tagName will be "xul:toolbarbutton") -- as
   * opposed to moseup which triggers even if there's nowhere to scroll, this
   * might be a more precise way to get that event.  In fact look at using
   * more command events on all the toolbar buttons...*/

  // Record opening of bookmark panel
  let bkmkPanel = window.document.getElementById("editBookmarkPanel");
  this._listen(bkmkPanel, "popupshown", function(evt) {
                 record( "star-button", "edit bookmark panel", "panel open");
               }, false);

  // Record clicks on "remove bookmark" button in bookmark panel:
  this._listen(bkmkPanel, "command", function(evt) {
                 switch (evt.originalTarget.getAttribute("id")) {
                 case "editBookmarkPanelRemoveButton":
                   record( "star-button", "remove bookmark button", "click");
                   break;
                 }
               }, false);

  // Record Tab view / panorama being shown/hidden:
  // Try tabviewshown and tabviewhidden
  this._listen(window, "tabviewshown", function(evt) {
                 dump("Tab view shown.\n");
               }, false);
  let deck = window.document.getElementById("tab-view-deck");
  this._listen(deck, "tabviewhidden", function(evt) {
                 dump("Tab view hidden.\n");
                 // User has just finished interacting with Panorama,
                 // so record new number of tabs per group
                 self.recordPanoramaState();
               }, false);

  // Record per-window customizations (tab-related):
  record("window", "", "new window opened");
  // Record number of app tabs:
  exports.handlers.record(EVENT_CODES.CUSTOMIZE, "Tab Bar", "Num App Tabs",
                          window.gBrowser._numPinnedTabs);

  // Record Panorama info - how many groups do you have right now, and how
  // many tabs in each group?
  this.recordPanoramaState();

  console.trace("Registering listeners complete.\n");
};
CombinedWindowObserver.prototype.uninstall = function() {
  CombinedWindowObserver.superClass.uninstall.call(this);
  exports.handlers.record(EVENT_CODES.ACTION, "window", "", "window closed");
};


/* The global observer class, for things that we only want to observe once,
 * rather than once-per-window.  That mostly means observing toolbar
 * customizations and other customizations and prefs.
 */
function GlobalCombinedObserver()  {
  GlobalCombinedObserver.baseConstructor.call(this, CombinedWindowObserver);
}
BaseClasses.extend(GlobalCombinedObserver, BaseClasses.GenericGlobalObserver);
GlobalCombinedObserver.prototype.onExperimentStartup = function(store) {
  GlobalCombinedObserver.superClass.onExperimentStartup.call(this, store);

  // Record study version number.
  this.record(EVENT_CODES.METADATA, "exp startup", "study version",
              exports.experimentInfo.versionNumber);

  /* The multiple Firefox Beta 4 Interface Studies are longitudial.
   * The uploads need a shared GUID so we can match them up on the server.
   * This is not supported by the extension yet so we do a hack right here.
   * If there are multiple runs of the study, copy the
   * GUID from the ORIGINAL run into my GUID -- (it's all just prefs).
   * Now we can associate the different uploads with each other and with
   * the survey upload.*/
  let prefs = require("preferences-service");
  let prefName = "extensions.testpilot.taskGUID." + ORIGINAL_TEST_ID;
  let originalStudyGuid = prefs.get(prefName, "");
  if (originalStudyGuid != "") {
    prefName = "extensions.testpilot.taskGUID." + MY_TEST_ID;
    prefs.set(prefName, originalStudyGuid);
  }

  // Get the front browser window, use it to record customizations!
  let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                        .getService(Ci.nsIWindowMediator);
  let frontWindow = wm.getMostRecentWindow("navigator:browser");

  // Are tabs on top?
  let toolbox = frontWindow.document.getElementById("navigator-toolbox");
  let tabPosition = (toolbox.getAttribute("tabsontop") == "true")?"true":"false";
  this.record(EVENT_CODES.CUSTOMIZE, "tab bar", "tabs on top?", tabPosition);

  // Is the main menu bar hidden? (for unified Firefox Menu Bar on Windows)
  let toolbarMenubar = frontWindow.document.getElementById("toolbar-menubar");
  let autohide = toolbarMenubar.getAttribute("autohide");
  this.record(EVENT_CODES.CUSTOMIZE, "menu bar", "hidden?", autohide);

  // How many bookmarks in bookmark toolbar?  Is bookmark toolbar shown?
  let bkmkToolbar = frontWindow.document.getElementById("personal-bookmarks");
  let bkmks = bkmkToolbar.getElementsByClassName("bookmark-item");
  this.record(EVENT_CODES.CUSTOMIZE, "bookmark bar", "num. bookmarks",
              bkmks.length);
  this.record(EVENT_CODES.CUSTOMIZE, "bookmark bar", "hidden?",
              "" + !!bkmkToolbar.parentNode.collapsed);

  // Is status bar shown?
  let statusBar = frontWindow.document.getElementById("status-bar");
  if (statusBar.getAttribute("hidden") == "true") {
    this.record(EVENT_CODES.CUSTOMIZE, "status bar", "hidden?", "true");
  } else {
    this.record(EVENT_CODES.CUSTOMIZE, "status bar", "hidden?", "false");
  }

  // TODO Any change to toolbar buttons?  (Copy code from toolbar study
  // and see if user has added/removed/reoredered)


  // Is Sync set up?  What's the last time it synced?
  let syncName = prefs.get("services.sync.username", "");
  this.record(EVENT_CODES.CUSTOMIZE, "Sync", "Configured?",
              (syncName == "")?"False":"True");
  let lastSync = prefs.get("services.sync.lastSync", 0);
  this.record(EVENT_CODES.CUSTOMIZE, "Sync", "Last Sync Time", lastSync);
};

// Record app startup and shutdown events:
GlobalCombinedObserver.prototype.onAppStartup = function() {
  GlobalCombinedObserver.superClass.onAppStartup.call(this);
  this.record(EVENT_CODES.METADATA, "app", "", "startup");
};

GlobalCombinedObserver.prototype.onAppShutdown = function() {
  GlobalCombinedObserver.superClass.onAppShutdown.call(this);
  this.record(EVENT_CODES.METADATA, "app", "", "shutdown");
};

// Utility function for recording events:
GlobalCombinedObserver.prototype.record = function(event, item, subItem,
                                                  interactionType) {
  if (!this.privateMode) {
    // Make sure string columns are strings
    if (typeof item != "string") {
      item = item.toString();
    }
    if (typeof subItem != "string") {
      subItem = subItem.toString();
    }
    if (typeof interactionType != "string") {
      interactionType = interactionType.toString();
    }
    this._store.storeEvent({
      event: event,
      item: item,
      sub_item: subItem,
      interaction_type: interactionType,
      timestamp: Date.now()
    });
    /* This dump statement is for debugging and will be removed before
     * the study is released. */
    dump("Recorded " + event + ", " + item + ", " + subItem + ", "
         + interactionType + "\n");
    // storeEvent can also take a callback, which we're not using here.
  }
};

exports.handlers = new GlobalCombinedObserver();

// Web content
function CombinedStudyWebContent()  {
  CombinedStudyWebContent.baseConstructor.call(this, exports.experimentInfo);
}
BaseClasses.extend(CombinedStudyWebContent, BaseClasses.GenericWebContent);
CombinedStudyWebContent.prototype.__defineGetter__("dataViewExplanation",
  function() {
    return "This bar chart shows how often you used your 15 most frequently"
           + " used Firefox interface items.";
  });
CombinedStudyWebContent.prototype.__defineGetter__("dataCanvas",
  function() {
      return '<div class="dataBox"><h3>View Your Data:</h3>' +
      this.dataViewExplanation +
      this.rawDataLink +
      '<div id="data-plot-div" style="width:480x;height:800px"></div>' +
      this.saveButtons + '</div>';
  });
CombinedStudyWebContent.prototype.__defineGetter__("inProgressHtml",
  function() {
    return '<h2>Thank you, Test Pilot!</h2>' +
      '<p>The ' + this.titleLink + ' study is currently in progress.</p>' +
    '<p>' + this.expInfo.summary + '</p>' +
    '<p> The study will end in ' + this.expInfo.duration + ' days. ' +
    '<ul><li>You can save your test graph or export the raw data now, or after you \
    submit your data.</li>' + this.thinkThereIsAnError +
      '<li>If you don\'t want to submit your data this time, ' +
      this.optOutLink + '.</li></ul>' + this.dataCanvas;
  });

/* Produce bar chart using flot lobrary; show 15 most frequently used items,
 * sorted, in a bar chart. */
CombinedStudyWebContent.prototype.onPageLoad = function(experiment,
                                                       document,
                                                       graphUtils) {
  experiment.getDataStoreAsJSON(function(rawData) {
    if (rawData.length == 0) {
      return;
    }

    let stats = [];
    let item;
    let lastActionId;
    for each( let row in rawData) {
      if (row.event != EVENT_CODES.ACTION) {
        continue;
      }
      // Skip the text selection events, they're not interesting
      if (row.item == "urlbar" && row.sub_item == "text selection") {
        continue;
      }
      let match = false;
      for (x in stats) {
        if (stats[x].item == row.item && stats[x].sub_item == row.sub_item) {
          match = true;
          stats[x].quantity ++;
          break;
        }
      }
      if (!match) {
        stats.push( {item: row.item, sub_item: row.sub_item, quantity: 1} );
      }
    }

    stats.sort(function(a, b) {
      return b.quantity - a.quantity;
    });

    let numItems = stats.length<15?stats.length:15;
    let d1 = [];
    let yAxisLabels = [];
    for (let i = 0; i < numItems; i++) {
      let item = stats[i];
      d1.push([item.quantity, i - 0.5]);
      let labelText = (item.item + ": " + item.sub_item).toLowerCase();
      yAxisLabels.push([i, labelText]);
    }
    try {
      let plotDiv = document.getElementById("data-plot-div");
      if (plotDiv == null)
        return;
      graphUtils.plot(plotDiv, [{data: d1}],
                      {series: {bars: {show: true, horizontal: true}},
                       yaxis: {ticks: yAxisLabels},
                       xaxis: {tickDecimals: 0}});
    } catch(e) {
      console.warn("Problem with graphutils: " + e + "\n");
    }
  });
};
exports.webContent = new CombinedStudyWebContent();

// Cleanup
require("unload").when(
  function myDestructor() {
    console.info("Combined study destructor called.");
    exports.handlers.uninstallAll();
  });
