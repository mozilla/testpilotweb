BaseClasses = require("study_base_classes.js");

/* This study must be implemented with enough flexibility that it doesn't
 * break when changes are made to the UI from one beta to the next.
 */

const ORIGINAL_TEST_ID = 100;
const MY_TEST_ID = 100;
// Note that non-numeric ids will break experiment-page.js because it's doing
// parseInt to get the eid.  So these must be numeric; sigh.

/* Need a schema that can hold both menu and toolbar events.
 * String columns may be better than a gigantic brittle ever-growing table of
 * id codes.  But the trade-off is that the uploads will be larger.
 */


/* Something like:
 * Top-level-item     =     Menu name, or meta-element like "url bar".
 * Sub-item           =     Menu item name, or like "right scroll button".
 * Interaction        =     Click, menu-pick, right-click, click-and-hold,
 *                          keyboard shortcut, etc.
 * Meta               =     Event vs. metadata vs. customization vs. hunt time
 *
 * Explore ms/explore num/start-menu-id  = 3 columns for one very specific case.
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
  {property: "sub_item", type: BaseClasses.TYPE_STRING, displayName: "Sub-Element"},
  {property: "interaction_type", type: BaseClasses.TYPE_STRING, displayName: "Interaction"},
  {property: "timestamp", type: BaseClasses.TYPE_DOUBLE, displayName: "Time",
   displayValue: function(value) {return new Date(value).toLocaleString();}}
];

exports.experimentInfo = {
  startDate: null, // Null start date means we can start immediately.
  duration: 5, // Days
  testName: "Firefox 4 Beta Interface",
  testId: MY_TEST_ID,
  testInfoUrl: "https://testpilot.mozillalabs.com",
  summary: "We are studying how the changes to the toolbar and menu bar in the"
           + " Firefox 4 beta affect usage of the interface.",
  thumbnail: null,
  optInRequired: false,
  recursAutomatically: false,
  recurrenceInterval: 0,
  versionNumber: 1,
  minTPVersion: "1.0rc1"
  //minFXVersion: "4.0b1" // Can't use due to bug 578830
};

exports.dataStoreInfo = {
  fileName: "combined_beta_study_results.sqlite",
  tableName: "combined_beta_study_results",
  columns: COMBINED_EXPERIMENT_COLUMNS
};

function CombinedWindowObserver(window) {
  CombinedWindowObserver.baseConstructor.call(this, window);
};
BaseClasses.extend(CombinedWindowObserver, BaseClasses.GenericWindowObserver);
CombinedWindowObserver.prototype.compareSearchTerms = function(searchTerm, searchEngine) {
  if (searchTerm == this._lastSearchTerm) {
    if (searchEngine == this._lastSearchEngine) {
      exports.handlers.record(EVENT_CODES.ACTION, "search bar", "", "same search same engine");
    } else {
      exports.handlers.record(EVENT_CODES.ACTION, "search bar", "", "same search different engine");
    }
  }
  this._lastSearchTerm = searchTerm;
  this._lastSearchEngine = searchEngine;
};
CombinedWindowObserver.prototype.urlLooksMoreLikeSearch = function(url) {
  // How to tell when a URL looks more like a search?  First approximation:
  // if there are spaces in it.  Second approximation: No periods.
  return ( (url.indexOf(" ") > -1) || (url.indexOf(".") == -1) );
};

CombinedWindowObserver.prototype.install = function() {

  console.info("Starting to install listeners for combined window observer.");
  try {
  let record = function( item, subItem, interaction ) {
    exports.handlers.record(EVENT_CODES.ACTION, item, subItem, interaction);
  };

  let allPopups = this.window.document.getElementsByTagName("menupopup");
  dump("ALL MENU POPUPS: " + allPopups.length + "\n");
  for each( let p in allPopups) {
    dump(p.id + ", ");
  }

  // Register menu listeners:
  let window = this.window;
  this._lastMenuPopup = null;
  let mainCommandSet = window.document.getElementById("mainCommandSet");
  dump("Main command set is " + mainCommandSet + "\n");
  let mainMenuBar = window.document.getElementById("main-menubar");
  dump("Main menu bar is " + mainMenuBar + "\n");
  this._listen(mainMenuBar, "command", function(evt) {
    dump("Got hit on mainMenuBar\n");
    let menuItemId = "unknown";
    let menuId = "unknown";
    if (evt.target.id) {
      menuItemId = evt.target.id;
    }
    let node = evt.target;
    while(node) {
      if (node.parentNode && node.parentNode.id == "main-menubar") {
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

  this._listen(mainCommandSet, "command", function(evt) {
    dump("Got hit on mainCommandSet\n");
    // TODO Is there any way of recording the menu name in this case??
    let tag = evt.sourceEvent.target;
    if (tag.tagName == "menuitem") {
      record("menus", tag.command, "mouse");
    } else if (tag.tagName == "key") {
      record("menus", tag.command?tag.command:tag.id, "key shortcut");
    }},
    true);

    /* All popups with ids:
     * tabContextMenu, backForwardMenu, toolbar-context-menu,
     * blockedPopupOptions, autohide-context, contentAreaContextMenu,
     * spell-dictionaries-menu, placesContext, menu_FilePopup, menu_EditPopup,
     * menu_viewPopup, viewSidebarMenu, goPopup, historyUndoPopup,
     * historyUndoWindowPopup, bookmarksMenuPopup,
     * subscribeToPageSubmenuMenupopup, bookmarksToolbarFolderPopup,
     * menu_ToolsPopup, pilot-menu-popup, windowPopup, menu_HelpPopup,
     * feed-menu, PlacesChevronPopup, BMB_bookmarksPopup,
     * BMB_bookmarksToolbarFolderPopup, BMB_unsortedBookmarksFolderPopup,
     * alltabs-popup
     */

  // Register menu popup listeners:
  for each (let popupId in ["toolbar-context-menu", "contentAreaContextMenu",
                           "tabContextMenu", "appmenu-popup",
                            "BMB_bookmarksPopup", "main-menubar"]) {
    let popup = window.document.getElementById(popupId);
    if (popup) {
      let name = popupId;
      dump("Registered popup listeners on " + name + "\n");
      this._listen(popup, "popuphidden", function(evt) {
                     if (evt.target.id) {
                       dump("Hid popup " + evt.target.id + "\n");
                     }}, true);
      this._listen(popup, "popupshown", function(evt) {
                     if (evt.target.id) {
                       dump("Showd popup " + name + "\n");
                     }}, true);
    }
    // this os working for goPopup, windowPopup, and context menus, but not for
    // app, file, edit, view, bookmark, or help menus.  The elements are there,
    // they just apparently don't get the messages we expect.
    // It also doesn't work if we register the listener on main-menubar!
  }



  // Monitor Time Spent Hunting In Menus:
  /*for (let item in CMD_ID_STRINGS_BY_MENU) {
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
    // TODO include context menu as separate entry
  }*/

  let buttonIds = ["back-button", "forward-button", "reload-button", "stop-button",
                   "home-button", "feed-button", "star-button",
                   "identity-popup-more-info-button",
                   "back-forward-dropmarker", "security-button",
                   "downloads-button", "print-button", "bookmarks-button",
                   "history-button", "new-tab-button", "new-window-button",
                   "cut-button", "copy-button", "paste-button", "fullscreen-button"];

  for (let i = 0; i < buttonIds.length; i++) {
    let id = buttonIds[i];
    let elem = this.window.document.getElementById(id);
    if (!elem) {
      console.warn("Can't install listener: no element with id " + id);
      continue;
    }
    this._listen(elem, "mouseup",
                 function(evt) {
                   // only count left button clicks and only on the element itself:
                     // (evt.button = 2 for right-click)
                   if (evt.target == elem && evt.button == 0) {
                     let tagName = evt.target.tagName;
                     if (tagName == "toolbarspacer" || tagName == "toolbarspring"
                        || tagName == "toolbarseparator" || tagName == "splitter" ||
                         tagName == "hbox") {
                       id = "spacer";
                     } else {
                       id = evt.target.id;
                     }
                     record(id, "", "click");
                   }
                 }, false);
    // Problem with just listening for "mouseup" is that it triggers even
    // if you clicked a greyed-out button... we really want something more
    // like "button clicked".  Try listening for "command"?
  }

  // Listen on site ID button, see if page is SSL, or extended validation,
  // or nothing.  (TODO this is getting double-counted because it triggers again
  // if you click to close; should trigger on popupshown or something.)
  let idBox = this.window.document.getElementById("identity-box");
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

  let self = this;
  let register = function(elemId, event, item, subItem, interactionName) {
    if (!self.window.document.getElementById(elemId)) {
      dump("No such element as " + elemId + "\n");
      return;
    }
    self._listen( self.window.document.getElementById(elemId), event, function() {
                    record(item, subItem, interactionName);}, false);
  };

  register( "feed-menu", "command", "rss icon", "menu item", "mouse pick");
    // There is no back-forward-dropmarker in Firefox 4 on Mac -- but
    // there is on Windows
  register( "back-forward-dropmarker", "command", "recent page dropdown", "menu item", "mouse pick");
  register( "search-container", "popupshown", "search engine dropdown", "menu item", "click");
  register( "search-container", "command", "search engine dropdown", "menu item", "menu pick");

  // Back and forward button drop-down picks:
  this._listen(this.window.document.getElementById("back-button"),
               "mouseup", function(evt) {
                 if (evt.originalTarget.tagName == "menuitem") {
                   record("back-button", "dropdown menu", "mouse pick");
                 }
               }, false);
  this._listen(this.window.document.getElementById("forward-button"),
               "mouseup", function(evt) {
                 if (evt.originalTarget.tagName == "menuitem") {
                   record("forward-button", "dropdown menu", "mouse pick");
                 }
               }, false);

  let bkmkToolbar = this.window.document.getElementById("personal-bookmarks");
  this._listen(bkmkToolbar, "mouseup", function(evt) {
                 if (evt.button == 0 && evt.target.tagName == "toolbarbutton") {
                   if (evt.target.id == "bookmarks-menu-button") {
                     record("bookmarks-menu-button", "", "click");
                   } else {
                     record("bookmark toolbar", "personal bookmark", "click");
                   }
                 }}, false);

    // Listen on search bar ues by mouse and keyboard, including repeated
    // searches (same engine or different engine?)
  let searchBar = this.window.document.getElementById("searchbar");
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

    // Listen on URL bar for enter key, go button, and select/edit events
    let urlBar = this.window.document.getElementById("urlbar");
  this._listen(urlBar, "keydown", function(evt) {
                 if (evt.keyCode == 13) { // Enter key
                   if (self.urlLooksMoreLikeSearch(evt.originalTarget.value)) {
                     record("urlbar", "search term", "enter key");
                   } else {
                     record("urlbar", "url", "enter key");
                   }
                 }
               }, false);

  let urlGoButton = this.window.document.getElementById("go-button");
  this._listen(urlGoButton, "mouseup", function(evt) {
                 if (self.urlLooksMoreLikeSearch(urlBar.value)) {
                   record("urlbar", "search term", "go button click");
                 } else {
                   record("urlbar", "url", "go button click");
                 }
               }, false);

    // Listen for URL edit events.  TODO: This is super verbose, especially
    // the "mousemove" one.  Could we change it to record just ONE mouse move
    // event?
  self._urlBarMouseState = false;
  this._listen(urlBar, "mouseup", function(evt) {
                 if (self._urlBarMouseState) {
                   record("urlbar", "text selection", "mouseup");
                   self._urlBarMouseState = false;
                 }
               }, false);
  this._listen(urlBar, "mousedown", function(evt) {
                 if (evt.originalTarget.tagName == "div") {
                   record("urlbar", "text selection", "mousedown");
                   self._urlBarMouseState = true;
                 }
               }, false);
  this._listen(urlBar, "mousemove", function(evt) {
                 if (self._urlBarMouseState) {
                   record("urlbar", "text selection", "mousemove");
                 }
               }, false);

  this._listen(urlBar, "change", function(evt) {
                 record("urlbar", "text selection", "change");
               }, false);
  this._listen(urlBar, "select", function(evt) {
                 record("urlbar", "text selection", "select");
               }, false);
  // A single click (select all) followed by edit will look like:
  // mouse down, mouse up, selected, changed.
  //
  // Click twice to insert and then edit looks like:
  // mouse down mouse up select, mouse down mouse up change.
  //
  // Click drag and to select and then edit looks like:
  // mouse down mouse move move move move move mouse up select changed.


  // TODO Get clicks on items in URL bar drop-down (or whether an awesomebar
  // suggestion was hilighted when you hit enter?)

    this._listen(urlBar, "popupshown", function(evt) {
                   // TODO this doesn't seem to work.
                 dump("A popup was shown from the url bar...\n");
                 dump("tagname " + evt.originalTarget.tagName + "\n");
                 dump("anonid " + evt.originalTarget.getAttribute("anonid") + "\n");
               }, false);
  this._listen(urlBar, "command", function(evt) {
                 if (evt.originalTarget.getAttribute("anonid") == "historydropmarker") {
                   record("urlbar", "most frequently used menu", "menu pick");
                 } else {
                   // TODO how do we get the clicks on the actual items in it though?
                   dump("A command came from the url bar...\n");
                   dump("tagname " + evt.originalTarget.tagName + "\n");
                   dump("anonid " + evt.originalTarget.getAttribute("anonid") + "\n");
                 }
               }, false);

      // tabbrowser id="content" contains XBL children anonid="scrollbutton-up"
  // and "scrollbutton-down-stack" and anonid="newtab-button"

    // Record Clicks on Tab Bar and Scroll Buttons
  let tabBar = this.window.document.getElementById("content");
  this._listen(tabBar, "mouseup", function(evt) {
                 if (evt.button == 0) {
                   switch (evt.originalTarget.getAttribute("anonid")) {
                   case "scrollbutton-up":
                     record("tabbar", "left scroll button", "click");
                     break;
                   case "scrollbutton-down":
                     record("tabbar", "right scroll button", "click");
                     break;
                   case "newtab-button":
                     record("tabbar", "new tab button", "click");
                     break;
                   default:
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
                           let upOrDown = evt.originalTarget.getAttribute("type");
                           if (upOrDown == "increment") { // vs. "decrement"
                             record(widget, "up scroll button", "click");
                           } else {
                             record(widget, "down scroll button", "click");
                           }
                         }
                       }
                     }
                   }
                 }
               }, false);

   this._listen(tabBar, "popupshown", function(evt) {
                 if (evt.originalTarget.getAttribute("anonid") =="alltabs-popup") {
                   record("tabbar", "drop down menu", "click");
                 }
               }, false);
    this._listen(tabBar, "command", function(evt) {
                   if (evt.originalTarget.tagName == "menuitem") {
                     record("tabbar", "drop down menu", "menu pick");
                   }
               }, false);
  /* Note we also get command events when you hit the tab scroll bars and
   * they actually scroll (the tagName will be "xul:toolbarbutton") -- as
   * opposed to moseup which triggers even if there's nowhere to scroll, this
   * might be a more precise way to get that event.  In fact look at using
   * more command events on all the toolbar buttons...*/


  let bkmkPanel = this.window.document.getElementById("editBookmarkPanel");
  this._listen(bkmkPanel, "popupshown", function(evt) {
                 record( "star-button", "edit bookmark panel", "panel open");
               }, false);

  this._listen(bkmkPanel, "command", function(evt) {
                 switch (evt.originalTarget.getAttribute("id")) {
                 case "editBookmarkPanelRemoveButton":
                   record( "star-button", "remove bookmark button", "click");
                   break;
                 }
                 // Other buttons we can get here:
                 //editBMPanel_foldersExpander
                 //editBMPanel_tagsSelectorExpander
                 //editBookmarkPanelDeleteButton
                 //editBookmarkPanelDoneButton
               }, false);

     // TODO try listening on autocomplete-richlistbox

    dump("Registering listeners complete.\n");
  } catch(e) {
    dump(e);
  }
};

function GlobalCombinedObserver()  {
  GlobalCombinedObserver.baseConstructor.call(this, CombinedWindowObserver);
}
BaseClasses.extend(GlobalCombinedObserver, BaseClasses.GenericGlobalObserver);
GlobalCombinedObserver.prototype.onExperimentStartup = function(store) {
  GlobalCombinedObserver.superClass.onExperimentStartup.call(this, store);

  this.record(EVENT_CODES.METADATA, "startup", "study version",
              exports.experimentInfo.versionNumber);

  // Longitudinal study:  If there are multiple runs of the study, copy the
  // GUID from the ORIGINAL one into my GUID -- (it's all just prefs).
  // Now we can associate the different uploads with each other and with
  // the survey upload.  TODO: What if user misses the first round?  Survey
  // will be lost and forlorn.  Can we fill it in retroactively or something?
  // TODO: this works if each study is a new id; does it work if it's one
  // recurring study? is it unneeded in that case?
  let prefs = require("preferences-service");
  let prefName = "extensions.testpilot.taskGUID." + ORIGINAL_TEST_ID;
  let originalStudyGuid = prefs.get(prefName, "");
  prefName = "extensions.testpilot.taskGUID." + MY_TEST_ID;
  prefs.set(prefName, originalStudyGuid);

  // Record customizations!  (Such as whether tabs are on top!)
  let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                        .getService(Ci.nsIWindowMediator);
  let frontWindow = wm.getMostRecentWindow("navigator:browser");
  // Look for the "tabsontop" attribute on #navigator-toolbox.
  let toolbox = frontWindow.document.getElementById("navigator-toolbox");
  let tabPosition = (toolbox.getAttribute("tabsontop") == "true")?"true":"false";
  this.record(EVENT_CODES.CUSTOMIZE, "tab bar", "tabs on top?", tabPosition);
};

GlobalCombinedObserver.prototype.record = function(event, item, subItem,
                                                  interactionType) {
  if (!this.privateMode) {
    // Make sure columns are strings
    if (!item) {
      item = "";
    }
    if (!subItem) {
      subItem = "";
    }
    if (!interactionType) {
      interactionType = "";
    }
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
    dump("Recorded " + event + ", " + item + ", " + subItem + ", " + interactionType + "\n");
    // storeEvent can also take a callback, which we're not using here.
  }
};

exports.handlers = new GlobalCombinedObserver();


function CombinedStudyWebContent()  {
  CombinedStudyWebContent.baseConstructor.call(this, exports.experimentInfo);
}
BaseClasses.extend(CombinedStudyWebContent, BaseClasses.GenericWebContent);
CombinedStudyWebContent.prototype.__defineGetter__("dataViewExplanation",
  function() {
    return "There's going to be some kind of graph here, time permitting.";
  });
CombinedStudyWebContent.prototype.onPageLoad = function(experiment,
                                                       document,
                                                       graphUtils) {
  // TODO graphics
};
exports.webContent = new CombinedStudyWebContent();

require("unload").when(
  function myDestructor() {
    console.info("Combined study destructor called.");
    exports.handlers.uninstallAll();
  });
