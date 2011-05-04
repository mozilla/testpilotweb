BaseClasses = require("study_base_classes.js");

exports.experimentInfo = {
  testName: "Early Adopter Study",
  testId: "early_adopter_study",
  testInfoUrl: "https://", // TODO need url
  summary: "Are you an early adopter? What sets early adopters apart from other users?",
  thumbnail: "http://", // TODO need image
  versionNumber: 1,
  duration: 5, // a number of days - fractions OK.
  minTPVersion: "1.1", // Test Pilot versions older than this
    // will not run the study.
  minFXVersion: "4.0", // TODO we only want firefox 4 final users, right?

  recursAutomatically: false,
  recurrenceInterval: 60,
  startDate: null,
  optInRequired: false
};

exports.dataStoreInfo = {
  fileName: "testpilot_earlyadopter_results.sqlite",
  tableName: "testpilot_earlyadopter_study",
  columns: [
    {property: "key", type: BaseClasses.TYPE_STRING,
     displayName: "Key"},
    {property: "value", type: BaseClasses.TYPE_STRING,
     displayName: "Value"},
    {property: "timestamp", type: BaseClasses.TYPE_DOUBLE, displayName: "Time",
     displayValue: function(value) {return new Date(value).toLocaleString();}}
  ]
};

/* Required Features in This Study
 *
 * V- Altered prefs
 * V- count app tabs on browser startup/shutdown
 * V- listen for pinning/unpinning of app tabs
 * V- listen for enter/exit of panorama
 * V- listen for clicks on Site ID button (and whether it's EV / SSL / normal)
 * V- is Sync configured?
 * V- last sync time
 * V- listen for view page source
 * V- listen for Go-to-url by enter key and by Go button
 * V- Listen for Search by enter key and by Go button
 */

function record(event, data) {
  if (typeof data != "string") {
    data = data.toString();
  }
  exports.handlers.record({key: event, value: data, timestamp: Date.now()});
}

// Copied from about:support
const PREFS_WHITELIST = [
  "accessibility.",
  "browser.fixup.",
  "browser.history_expire_",
  "browser.link.open_newwindow",
  "browser.mousewheel.",
  "browser.places.",
  "browser.startup.homepage",
  "browser.tabs.",
  "browser.zoom.",
  "dom.",
  "extensions.checkCompatibility",
  "extensions.lastAppVersion",
  "font.",
  "general.useragent.",
  "gfx.color_management.mode",
  "javascript.",
  "keyword.",
  "layout.css.dpi",
  "network.",
  "places.",
  "print.",
  "privacy.",
  "security.",
  "services.",
  "ui."
];

// The blacklist, unlike the whitelist, is a list of regular expressions.
const PREFS_BLACKLIST = [
  /^network[.]proxy[.]/,
  /[.]print_to_filename$/,
  /browser.startup.homepage/
];

function EarlyAdopterWindowObserver(window, globalInstance) {
  EarlyAdopterWindowObserver.baseConstructor.call(this, window, globalInstance);
}
BaseClasses.extend(EarlyAdopterWindowObserver,
                   BaseClasses.GenericWindowObserver);
EarlyAdopterWindowObserver.prototype.recordPanoramaState = function() {
  /* Record panorama state - Record number of panorama tab groups, then
   * record number of tabs in each group. */
  if (this.window.TabView._window) {
    let gi = this.window.TabView._window.GroupItems;
    record("Tab groups", gi.groupItems.length);
    for each (let g in gi.groupItems) {
      record("Tab group size", g._children.length);
    }
    // some tabs not affiliated with any group (called "orphans")
    let numOrphans = gi.getOrphanedTabs().length;
    record("Ungrouped tabs", numOrphans);
  } else {
    // If TabView is uninitialized, just record total # of tabs
    // in the window instead.
    let tabCount = this.window.getBrowser().tabContainer.itemCount;
    record("Ungrouped tabs", tabCount);
  }
};

EarlyAdopterWindowObserver.prototype.install = function() {
  let window = this.window;
  if (!window.gBrowser) {
    // not a tabbed browser window: ignore
    return;
  }
  record("App tabs on window open", window.gBrowser._numPinnedTabs);
  this.recordPanoramaState();

  // Listen for app tabs being pinned or unpinned:
  let tabContext = window.document.getElementById("tabContextMenu");
  this._listen(tabContext, "command", function(evt) {
                     if (evt.target && evt.target.id) {
                       /* When you pin or unpin an app tab, record
                        * number of pinned tabs (number recorded is number
                        * BEFORE the change)*/
                       if (evt.target.id == "context_pinTab") {
                         record("App tab pinned", window.gBrowser._numPinnedTabs);
                       } else if (evt.target.id == "context_unpinTab") {
                         record("App tab unpinned", window.gBrowser._numPinnedTabs);
                       }
                     }
                   }, true);


  // Listen for Panorama being shown/hidden
  this._listen(window, "tabviewshown", function(evt) {
                 record("Panorama opened", "");
               }, false);
  let deck = window.document.getElementById("tab-view-deck");
  this._listen(deck, "tabviewhidden", function(evt) {
                 record("Panorama closed", "");
                 // User has just finished interacting with Panorama,
                 // so record new number of tabs per group
                 self.recordPanoramaState();
               }, false);

  /* Listen on site ID button, see if page is SSL, or extended validation,
   * or nothing.  (TODO this is getting double-counted because it triggers
   * again if you click to close; should trigger on popupshown or something.)*/
  let idBox = window.document.getElementById("identity-box");
  this._listen(idBox, "mouseup", function(evt) {
                 let idBoxClass = idBox.getAttribute("class");
                 if (idBoxClass.indexOf("verifiedIdentity") > -1) {
                   record("Site ID clicked", "extended validation");
                 } else if (idBoxClass.indexOf("verifiedDomain") > -1) {
                   record("Site ID clicked", "SSL");
                 } else {
                   record("Site ID clicked", "none");
                 }
               }, false);


  // Listen for View Source:
  let viewSourceMenuItem = window.document.getElementById("View:PageSource");
  let viewSourceKeyShort = window.document.getElementById("key_viewSource");
  this._listen(viewSourceMenuItem, "command", function(evt) {
                 record("View Source", "mouse");
               });
  this._listen(viewSourceKeyShort, "command", function(evt) {
                 record("View Source", "keyboard");
               });

  // Listen for searches:
  let searchBar = window.document.getElementById("searchbar");
  this._listen(searchBar, "keydown", function(evt) {
                 if (evt.keyCode == 13) { // Enter key
                   record("Search", "keyboard");
                 }
               }, false);
  this._listen(searchBar, "mouseup", function(evt) {
                 if (evt.originalTarget.getAttribute("anonid") == "search-go-button") {
                   record("Search", "mouse");
                 }
               }, false);

  // Listen on URL bar:
  let urlBar = window.document.getElementById("urlbar");
  this._listen(urlBar, "keydown", function(evt) {
                 if (evt.keyCode == 13) { // Enter key
                   record("Go URL", "keyboard");
                 }
               }, false);

  let urlGoButton = window.document.getElementById("go-button");
  this._listen(urlGoButton, "mouseup", function(evt) {
                 record("Go URL", "mouse");
               }, false);
};



function EarlyAdopterGlobalObserver() {
  EarlyAdopterGlobalObserver.baseConstructor.call(this,
                                                  EarlyAdopterWindowObserver);
}
BaseClasses.extend(EarlyAdopterGlobalObserver,
                   BaseClasses.GenericGlobalObserver);

EarlyAdopterGlobalObserver.prototype.onExperimentStartup = function(store) {
  EarlyAdopterGlobalObserver.superClass.onExperimentStartup.call(this, store);
};

EarlyAdopterGlobalObserver.prototype.getStudyMetadata = function() {
  let prefService = Cc["@mozilla.org/preferences-service;1"]
                     .getService(Ci.nsIPrefService)
                     .QueryInterface(Ci.nsIPrefBranch2);

  let Application = Cc["@mozilla.org/fuel/application;1"]
                             .getService(Ci.fuelIApplication);

  let whitelist = [];
  PREFS_WHITELIST.forEach(function (prefStem) {
    let prefNames = prefService.getChildList(prefStem);
    whitelist = whitelist.concat(prefNames);
  });

  let isBlacklisted = function(prefName) {
    return PREFS_BLACKLIST.some(function (re) {
                                  return re.test(prefName);});
  };

  // We use the low-level prefs API to identify prefs that have been
  // modified, rather that Application.prefs.all since the latter is
  // much, much slower.  Application.prefs.all also gets slower each
  // time it's called.  See bug 517312.
  let prefs = [];
  for each (prefName in whitelist) {
    if (prefService.prefHasUserValue(prefName)) {
      let aPref = {name: "Preference " + prefName,
                   value: Application.prefs.getValue(prefName, "")};
      // For blacklisted prefs, don't record actual value - only the
      // fact that it has been set.
      if (isBlacklisted(prefName)) {
        aPref.value = "Custom Value";
      }
      prefs.push(aPref);
    }
  }

  // look for sync data: is sync configured? and what was last sync time?
  let syncName = Application.prefs.getValue("services.sync.username", "");
  if (syncName == "") {
    prefs.push({name: "Sync configured", value: "false"});
  }
  let lastSync = Application.prefs.getValue("services.sync.lastSync", 0);
  prefs.push({name: "Last sync time", value: lastSync});

  return prefs;
};


exports.handlers = new EarlyAdopterGlobalObserver();


function EarlyAdopterWebContent()  {
  EarlyAdopterWebContent.baseConstructor.call(this, exports.experimentInfo);
}
BaseClasses.extend(EarlyAdopterWebContent, BaseClasses.GenericWebContent);
EarlyAdopterWebContent.prototype.__defineGetter__("dataCanvas",
  function() {
      return '<div class="dataBox"><h3>View Your Data:</h3>' +
      this.dataViewExplanation +
      this.rawDataLink +
      '<div id="data-plot-div" style="width:480x;height:800px"></div>' +
      this.saveButtons + '</div>';
  });
EarlyAdopterWebContent.prototype.__defineGetter__("dataViewExplanation",
  function() {
    return "This is a totally made up example study that means nothing.";
  });


EarlyAdopterWebContent.prototype.onPageLoad = function(experiment,
                                                  document,
                                                  graphUtils) {
  // TODO
};

exports.webContent = new EarlyAdopterWebContent();

require("unload").when(
  function destructor() {
    // Do any module cleanup here.
  });
