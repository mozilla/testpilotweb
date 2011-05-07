BaseClasses = require("study_base_classes.js");

exports.experimentInfo = {
  testName: "Technology Adoption Study",
  testId: "early_adopter_study",
  testInfoUrl: "https://testpilot.mozillalabs.com/testcases/tech_adoption",
  summary: "This study will help us understand the technology adoption of our Firefox users. As always, no sensitive or personally identifiable data is recorded.",
  thumbnail: "https://testpilot.mozillalabs.com/testcases/newfeature/firefox-thumbnail.png",
  versionNumber: 1,
  duration: 3, // a number of days - fractions OK.
  minTPVersion: "1.1", // Test Pilot versions older than this
    // will not run the study.
  minFXVersion: "4.0",

  recursAutomatically: false,
  recurrenceInterval: 60,
  startDate: null,
  optInRequired: false,

  randomDeployment: { rolloutCode: "ur",
                      minRoll: 1, maxRoll: 10},

  runOrNotFunc: function() {
    // Don't run for users on Firefox 4 release channel
    // TODO test this filter
    let Application = Cc["@mozilla.org/fuel/application;1"]
      .getService(Ci.fuelIApplication);
    return (Application.prefs.getValue("app.update.channel", "") != "release");
  }
};

exports.dataStoreInfo = {
  fileName: "testpilot_earlyadopter_results.sqlite",
  tableName: "testpilot_earlyadopter_study",
  columns: [
    {property: "key", type: BaseClasses.TYPE_STRING,
     displayName: "Event"},
    {property: "value", type: BaseClasses.TYPE_STRING,
     displayName: "Details"},
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

function urlLooksMoreLikeSearch(url) {
  /* Trying to tell whether user is inputting searches in the URL bar.
   * Heuristic to tell whether a "url" is really a search term:
   * If there are spaces in it, and/or it has no periods in it.
   */
  return ( (url.indexOf(" ") > -1) || (url.indexOf(".") == -1) );
};

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
                   record("Search bar", "keyboard");
                 }
               }, false);
  this._listen(searchBar, "mouseup", function(evt) {
                 if (evt.originalTarget.getAttribute("anonid") == "search-go-button") {
                   record("Search bar", "mouse");
                 }
               }, false);

  // Listen on URL bar:
  let urlBar = window.document.getElementById("urlbar");
  this._listen(urlBar, "keydown", function(evt) {
                 if (evt.keyCode == 13) { // Enter key
                   if (urlLooksMoreLikeSearch(urlBar.value)) {
                     record("Search in URL bar", "keyboard");
                   } else {
                     record("Go URL", "keyboard");
                   }
                 }
               }, false);

  let urlGoButton = window.document.getElementById("urlbar-go-button");
  this._listen(urlGoButton, "mouseup", function(evt) {
                 if (urlLooksMoreLikeSearch(urlBar.value)) {
                   record("Search in URL bar", "mouse");
                 } else {
                   record("Go URL", "mouse");
                 }
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
  let syncIsConfigured = !(syncName == "");
  prefs.push({name: "Sync configured", value: syncIsConfigured?"true":"false"});

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
    return "The bar chart below shows your frequency of use of certain features";
  });


EarlyAdopterWebContent.prototype.onPageLoad = function(experiment,
                                                  document,
                                                  graphUtils) {
  experiment.getDataStoreAsJSON(function(rawData) {
    if (rawData.length == 0) {
      return;
    }
    let stats = [{key: "App tab pinned", count: 0},
                 {key: "App tab unpinned", count: 0},
                 {key: "Panorama opened", count: 0},
                 {key: "Panorama closed", count: 0},
                 {key: "Site ID clicked", count: 0},
                 {key: "View Source", count: 0},
                 {key: "Search bar", count: 0},
                 {key: "Search in URL bar", count: 0},
                 {key: "Go URL", count: 0}];
    let item;
    let lastActionId;
    for each( let row in rawData) {
      for (let x = 0; x < stats.length; x++) {
        if (stats[x].key == row.key) {
          stats[x].count++;
          break;
        }
      }
    }
    let numItems = stats.length;
    let d1 = [];
    let yAxisLabels = [];
    for (let i = 0; i < numItems; i++) {
      let item = stats[i];
      d1.push([item.count, i - 0.5]);
      let labelText = stats[i].key;
      yAxisLabels.push([i, labelText]);
    }
    try {
      let plotDiv = document.getElementById("data-plot-div");
      if (plotDiv == null) {
        return;
      }
      graphUtils.plot(plotDiv, [{data: d1}],
                      {series: {bars: {show: true, horizontal: true}},
                       yaxis: {ticks: yAxisLabels},
                       xaxis: {tickDecimals: 0}});
    } catch(e) {
      console.warn("Problem with graphutils: " + e + "\n");
    }
  });
};

exports.webContent = new EarlyAdopterWebContent();

require("unload").when(
  function destructor() {
    // Do any module cleanup here.
  });
