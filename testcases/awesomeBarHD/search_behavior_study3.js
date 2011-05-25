BaseClasses = require("study_base_classes.js");

const ADDON_ID = "awesomeBar.HD@prospector.labs.mozilla";
const ADDON_PREF = "extensions.prospector.awesomeBarHD.";
const INSTALL_URL = "https://addons.mozilla.org/firefox/downloads/file/120664/mozilla_labs_prospector_awesomebar_hd-12-fx.xpi?src=external-test-pilot";
const INSTALL_HASH = "sha256:36b6dffa804eebcc7d8fe7855a3ff0bcae5ea2586276a8bd6135c45901a57453";
const PREF_PREFIX = "extensions.testpilot.";
const TEST_ID = 10509012;

const CONFIRM_CHECK_EVERY = 5 * 60 * 1000;
const CONFIRM_CHECK_TRIGGER = 2 * 24 * 60 * 60 * 1000;
const CONFIRM_ICON = "chrome://testpilot/skin/testPilot_200x200.png";
const CONFIRM_QUESTION = "Test Pilot invites you to try a new design for 2 days.\n\nFirefox will return to the original interface when the study finishes. You can also turn off the new design from the Add-ons Manager at any time.";
const CONFIRM_TITLE = "Activate a new Firefox interface for 48 hours?";

const PREF_ALREADY_INSTALLED = PREF_PREFIX + TEST_ID + ".alreadyInstalled";
const PREF_METADATA = PREF_PREFIX + TEST_ID + ".metadata";
const PREF_PROMPTED = PREF_PREFIX + TEST_ID + ".prompted";
const PREF_SHUTDOWN = PREF_PREFIX + TEST_ID + ".shutdown";
const PREF_TESTPILOT = ADDON_PREF + "testpilot";

const ADDON_CONFLICTS = {
  "{2458abc0-f443-11dd-87af-0800200c9a66}": "bloodyred",
  "{3ffb7be0-8bde-11de-8a39-0800200c9a66}": "purplefox",
  "{dc572301-7619-498c-a57d-39143191b318}": "tabmixplus",
  "djziggy@gmail.com": "lavafoxv1blue",
  "info@djzig.com": "lavafoxv1",
  "nasanightlaunch@example.com": "nasanightlaunch",
  "zigboom@ymail.com": "lavafoxv1green",
  "zigboom.designs@gmail.com": "blackfoxv1blue",
};

let modules = {};
Cu.import("resource://gre/modules/AddonManager.jsm", modules);
Cu.import("resource://gre/modules/Services.jsm", modules);
let {AddonManager, Services} = modules;

exports.experimentInfo = {
  testId: TEST_ID,
  testName: "Search Behavior Study",
  testInfoUrl: "https://testpilot.mozillalabs.com/testcases/search-behavior-study.html",
  summary: "This study will help us understand how Firefox users search on the web. The Firefox user interface may change as part of this study. As always, no sensitive or personally identifiable data is recorded.",
  thumbnail: "http://mozillalabs.com/wp-content/themes/labs_project/img/prospector-header.png",
  versionNumber: 1,
  duration: 4,
  minTPVersion: "1.1",
  minFXVersion: "4.0",
  optInRequired: true,

  randomDeployment: {
    rolloutCode: "ur",
    minRoll: 61,
    maxRoll: 70,
  },

  // Target only non-release english users as the add-on isn't localized
  runOrNotFunc: function() {
    let channel = Services.prefs.getCharPref("app.update.channel");
    let locale = Services.prefs.getCharPref("general.useragent.locale");
    return channel != "release" && locale == "en-US";
  },
};

exports.dataStoreInfo = {
  fileName: "testpilot_" + TEST_ID + "_results.sqlite",
  tableName: "table_name",
  columns: [{
    displayName: "Event",
    property: "key",
    type: BaseClasses.TYPE_STRING,
  }, {
    displayName: "Details",
    property: "value",
    type: BaseClasses.TYPE_STRING,
  }, {
    displayName: "Time",
    displayValue: function(value) new Date(value).toLocaleString(),
    property: "timestamp",
    type: BaseClasses.TYPE_DOUBLE,
  }]
};

// Record an event of some type with data at this time
function record(type, data) {
  if (typeof data != "string")
    data = data.toString();
  exports.handlers.record({
    key: type,
    timestamp: Date.now(),
    value: data,
  });
}

// Add a function to run when shutting down
function unload(callback) {
  exports.handlers._windowObservers.push({
    uninstall: callback,
  });
}

// Change a value that gets restored on shutdown
function change(obj, prop, val) {
  let orig = obj[prop];
  obj[prop] = typeof val == "function" ? val(orig) : val;
  unload(function() obj[prop] = orig);
}

function WindowObs(window, globalObs) {
  WindowObs.baseConstructor.call(this, window, globalObs);
}
BaseClasses.extend(WindowObs, BaseClasses.GenericWindowObserver);

const siteRegexes = [
["books Google Books", /https?:\/\/([^\.]+\.)?google\.com\/(#|search|webhp).+tb[ms]=bks/],
["food Google Places", /https?:\/\/([^\.]+\.)?google\.com\/(#|search|webhp).+tb[ms]=plcs/],
["pictures Google Images", /https?:\/\/([^\.]+\.)?google\.com\/(#|search|webhp).+tb[ms]=isch/],
["shopping Google Shopping", /https?:\/\/([^\.]+\.)?google\.com\/(#|search|webhp).+tb[ms]=shop/],
["videos Flickr Video", /https?:\/\/([^\.]+\.)?flickr\.com\/search.+mt=videos/],

["search Google", /https?:\/\/([^\.]+\.)?google\.com\/(#|search)/],
["search Bing", /https?:\/\/([^\.]+\.)?bing\.com\/search/],
["search Yahoo!", /https?:\/\/([^\.]+\.)?yahoo.com\/search/],
["books Amazon.com Books", /https?:\/\/([^\.]+\.)?amazon\.com\/s.+url=search-alias%3D(books|digital-text|stripbooks|us-magazines-tree)/],
["books Barnes and Noble", /https?:\/\/([^\.]+\.)?barnesandnoble\.com\/search/],
["food Yelp", /https?:\/\/([^\.]+\.)?yelp\.com\/search/],
["food Menuism", /https?:\/\/([^\.]+\.)?menuism\.com\/search/],
["maps Google Maps", /https?:\/\/([^\.]+\.)?google\.com\/maps/],
["maps Bing Maps", /https?:\/\/([^\.]+\.)?bing\.com\/maps\/(#|\?|default\.aspx\?)/],
["maps MapQuest", /https?:\/\/([^\.]+\.)?mapquest\.com\/\?q/],
["movies Internet Movie Database", /https?:\/\/([^\.]+\.)?imdb\.com\/find/],
["movies Rotten Tomatoes", /https?:\/\/([^\.]+\.)?rottentomatoes\.com\/search/],
["movies Fandango", /https?:\/\/([^\.]+\.)?fandango\.com\/GlobalSearch/],
["music Pandora", /https?:\/\/([^\.]+\.)?pandora\.com\/backstage.+[&\?]q=/],
["music Amazon.com Music", /https?:\/\/([^\.]+\.)?amazon\.com\/s.+url=search-alias%3D(digital-music|popular)/],
["music Grooveshark", /https?:\/\/([^\.]+\.)?grooveshark\.com\/#\/search/],
["news CNN", /https?:\/\/([^\.]+\.)?www\.cnn\.com\/search/],
["news New York Times", /https?:\/\/([^\.]+\.)?nytimes\.com\/search/],
["news BBC", /https?:\/\/([^\.]+\.)?bbc\.co\.uk\/search/],
["people Twitter", /https?:\/\/([^\.]+\.)?twitter\.com\/(\?q=[^#]*)?#!\/search/],
["people Facebook", /https?:\/\/([^\.]+\.)?facebook\.com\/search/],
["people LinkedIn", /https?:\/\/([^\.]+\.)?linkedin\.com\/pub\/dir\/\?/],
["pictures Flickr", /https?:\/\/([^\.]+\.)?flickr\.com\/search\/.*[&\?]q=/],
["pictures Bing Images", /https?:\/\/([^\.]+\.)?bing\.com\/images\/search/],
["references Wikipedia", /https?:\/\/([^\.]+\.)?wikipedia\.org\/.*Special:Search/],
["references Answers.com", /https?:\/\/([^\.]+\.)?answers\.com\/.+/],
["references Dictionary.com", /https?:\/\/([^\.]+\.)?reference\.com\/browse\/.+/],
["shopping Amazon.com", /https?:\/\/([^\.]+\.)?amazon\.com\/s[\/\?]/],
["shopping eBay", /https?:\/\/([^\.]+\.)?ebay\.com\/.*_nkw=/],
["sports ESPN", /https?:\/\/([^\.]+\.)?search\.espn\.go\.com\//],
["sports Yahoo! Sports", /https?:\/\/([^\.]+\.)?sports\.search\.yahoo\.com\/search/],
["sports Sports Illustrated", /https?:\/\/([^\.]+\.)?sportsillustrated\.cnn\.com\/search/],
["videos YouTube", /https?:\/\/([^\.]+\.)?youtube\.com\/results/],
["videos Bing Video", /https?:\/\/([^\.]+\.)?bing\.com\/videos\/search/],
["weather Weather Channel", /https?:\/\/([^\.]+\.)?weather\.com\/search/],
["weather Weather Underground", /https?:\/\/([^\.]+\.)?wunderground\.com\/cgi-bin\/findweather/],
["weather AccuWeather.com", /https?:\/\/([^\.]+\.)?accuweather\.com\/us-city-list/],
];

const keyCodes = "BACK_SPACE DELETE DOWN END ENTER ESCAPE HOME LEFT PAGE_DOWN PAGE_UP RETURN RIGHT TAB UP".split(" ");

WindowObs.prototype.install = function() {
  let self = this;
  let {window} = self;
  let {BrowserSearch, document, gBrowser, gURLBar, setTimeout} = window;
  if (gBrowser == null)
    return;

  // Look for events from the add-on
  self._listen(gBrowser, "ABHD", function() {
    let {data, type} = gBrowser.ABHDevent;

    // Mark the next search as coming from the awesomebar
    if (type == "search") {
      trackFrom("awesomebar");
      trackSearch(data);
    }
    // Anything else is just an event to record
    else
      record(type, data);
  }, true);

  // Remember from where the next search might have came from
  let fromTime = 0;
  let fromType = "";
  function trackFrom(type) {
    fromTime = Date.now();
    fromType = type;

    // See if there were keys set for awesomebar/urlbar or searchbar
    let keyLog = keyLogs[type == "awesomebar" ? "urlbar" : type];
    if (keyLog != null) {
      // Remove 0's from the edges
      if (keyLog[keyLog.length - 1] == 0)
        keyLog.pop();
      if (keyLog[0] == 0)
        keyLog.shift();

      if (keyLog.length > 0)
        record("keys " + type, keyLog.join(" "));
      keyLog.length = 0;
    }
  }

  // Mark the next search as coming from the urlbar
  change(gURLBar, "handleCommand", function(orig) {
    return function(event) {
      // Delay tracking because awesomebar triggers off this as well
      setTimeout(function() trackFrom("urlbar"));
      return orig.call(this, event);
    };
  });

  // Mark the next search as coming from the search bar
  change(BrowserSearch.searchBar, "doSearch", function(orig) {
    return function(data, where) {
      trackFrom("searchbar");
      return orig.call(this, data, where);
    };
  });

  // Mark the next search as a reload
  let commandSet = document.getElementById("mainCommandSet");
  self._listen(commandSet, "command", function({target}) {
    if (target.id == "Browser:Reload")
      trackFrom("reload");
  }, true);

  // Remember that we hit a search page
  let searchTime = 0;
  let searchType = "";
  function trackSearch(type) {
    let now = Date.now();
    if (type != searchType || now - searchTime > 5000) {
      searchType = type;

      if (now - fromTime > 5000)
        fromType = "link";

      record("search " + fromType, searchType);
      fromTime = 0;
    }
    searchTime = now;
  }

  // Check if the window is a tab that matches a search
  function checkWindow(target) {
    let tab = gBrowser._getTabForContentWindow(target);
    if (tab == null)
      return;

    let url = target.location.toString();
    switch (url) {
      // Skip about:blank loads
      case "about:blank":
        return;

      // Additionally instrument about:home
      case "about:home":
        // Watch for key presses in the input box
        let id = "home";
        let doc = tab.linkedBrowser.contentDocument;
        trackKeys(id, doc.getElementById("searchText"));

        // Wait for the search to submit
        doc.getElementById("searchForm").addEventListener("submit", function() {
          trackFrom(id);
        }, true);
        return;
    }

    // See if we matched any search types
    let didMatch = siteRegexes.some(function([type, regex]) {
      if (url.search(regex) == 0) {
        trackSearch(type);
        return true;
      }
    });
  }

  // Check if it's a search on page load
  self._listen(gBrowser, "DOMContentLoaded", function({target}) {
    checkWindow(target.defaultView);
  }, true);

  // Check if it's a search on hash change
  self._listen(window, "hashchange", function({target}) {
    checkWindow(target);
  }, true);

  // Record various keys for a source
  let keyLogs = {};
  function trackKeys(id, node) {
    let keyLog = keyLogs[id] = [];
    self._listen(node, "keypress", function(event) {
      // Make sure there's always a key counter to increment
      if (keyLog.length == 0)
        keyLog.push(0);

      // Try to figure out what special key was pressed
      let key = "key";
      let didMatch = keyCodes.some(function(code) {
        if (event.keyCode == event["DOM_VK_" + code]) {
          key = code.toLowerCase();
          return true;
        }
      });

      // Treat some characters as special keys too
      switch (event.charCode) {
        case 32:
          key = "space";
          break;

        case 35:
          key = "hash";
          break;

        case 58:
          key = "colon";
          break;

        case 64:
          key = "at";
          break;
      }

      // Anything else is a generic key press that increments the counter
      let {altKey, ctrlKey, metaKey, shiftKey} = event;
      if (key == "key") {
        // Only count unmodified keys
        if (!altKey && !ctrlKey && !metaKey)
          keyLog[keyLog.length - 1]++;
        return;
      }

      // Remove trailing 0 before adding the special key
      if (keyLog[keyLog.length - 1] == 0)
        keyLog.pop();

      // Save the modifiers of the pressed special
      let modifiers = (altKey ? "a" : "") + (ctrlKey ? "c" : "") + (metaKey ? "m" : "") + (shiftKey ? "s" : "");
      keyLog.push(modifiers + (modifiers == "" ? "" : "-") + key);

      // Keep a generic key press counter ready
      keyLog.push(0);
    }, true);
  }

  // Immediately start tracking the input boxes
  ["urlbar", "searchbar"].forEach(function(id) {
    trackKeys(id, document.getElementById(id).parentNode);
  });

  // Clear out any keys when switching tabs
  self._listen(gBrowser.tabContainer, "TabSelect", function() {
    // Results open in a new tab, so wait a bit before clearing to read out data
    setTimeout(function() {
      for each (let keyLog in keyLogs)
        keyLog.length = 0;
    });
  }, true);

  // Watch for switch to tabs
  change(window, "switchToTabHavingURI", function(orig) {
    return function(uri, open) {
      record("switch to tab");
      return orig.call(this, uri, open);
    };
  });
};

function GlobalObs() {
  GlobalObs.baseConstructor.call(this, WindowObs);
}
BaseClasses.extend(GlobalObs, BaseClasses.GenericGlobalObserver);

GlobalObs.prototype.doExperimentCleanup = function() {
  // Test pilot doesn't correctly shutdown before cleaning
  this.onExperimentShutdown();

  // Read out the add-on state for metadata
  AddonManager.getAddonByID(ADDON_ID, function(addon) {
    if (addon == null)
      return;

    // Remember the original state if we need to restore
    let origDisabled = addon.userDisabled;

    // Disable the add-on to get various prefs to be written
    addon.userDisabled = true;

    // Read out the important bits of the provider data
    let meta = {};
    try {
      let providerData = Services.prefs.getCharPref(ADDON_PREF + "providers");
      meta.providers = JSON.parse(providerData).map(function(data) {
        let {category, defaultIndex, hidden, providers, showIcon} = data;
        return {
          category: category,
          default: providers[defaultIndex].name,
          hidden: hidden,
          showIcon: showIcon,
        };
      });
    }
    catch(ex) {}

    // Remember what configuration was used
    try {
      meta.testpilot = Services.prefs.getIntPref(PREF_TESTPILOT);
      Services.prefs.clearUserPref(PREF_TESTPILOT);
    } catch(ex) {}

    // Track the usage behavior
    try {
      meta.usage = JSON.parse(Services.prefs.getCharPref(ADDON_PREF + "usage"));
    } catch(ex) {}

    // Save the metadata for later
    Services.prefs.setCharPref(PREF_METADATA, JSON.stringify(meta));

    // See if we need to uninstall the add-on
    let already = false;
    try {
      already = Services.prefs.getBoolPref(PREF_ALREADY_INSTALLED);
      Services.prefs.clearUserPref(PREF_ALREADY_INSTALLED);
    }
    catch(ex) {}

    // Restore the disabled state if the user had the add-on
    if (already)
      addon.userDisabled = origDisabled;
    // Remove the addon (which will clear prefs) to clean up
    else
      addon.uninstall();
  });

  // Clear out various prefs that get set during the study
  // NB: PREF_METADATA isn't cleared so that it can be read out later
  [PREF_PROMPTED, PREF_SHUTDOWN].forEach(function(pref) {
    try {
      Services.prefs.clearUserPref(pref);
    }
    catch(ex) {}
  });
};

GlobalObs.prototype.getStudyMetadata = function() {
  let meta = {};
  try {
    meta = JSON.parse(Services.prefs.getCharPref(PREF_METADATA));
  }
  catch(ex) {}

  // Record how many search engines
  meta.engines = Services.search.getVisibleEngines({}).length;

  // Get various bookmark counts
  let db = Cc["@mozilla.org/browser/nav-history-service;1"].
           getService(Components.interfaces.nsPIPlacesDatabase).
           DBConnection;
  function countBookmarks(where) {
    let stmt = db.createStatement(
      "SELECT COUNT(*) count " +
      "FROM moz_bookmarks " +
      where);
    stmt.executeStep();
    return stmt.row.count;
  }

  // Record how many bookmark items (bookmarks, folders, etc.)
  meta.bookmarkItems = countBookmarks("");

  // Record how many bookmarks have keywords
  meta.keywordedBookmarks = countBookmarks("WHERE keyword_id NOT NULL");

  // Convert the data to an array
  let studyMetadata = [];
  for (let [name, value] in Iterator(meta)) {
    studyMetadata.push({
      name: name,
      value: JSON.stringify(value),
    });
  }
  return studyMetadata;
};

GlobalObs.prototype.onAppShutdown = function() {
  // Ignore normal shutdowns
  if (Services.prefs.getBoolPref("extensions.testpilot.runStudies"))
    return;

  // Disable the add-on when turning off studies
  AddonManager.getAddonByID(ADDON_ID, function(addon) {
    if (addon == null)
      return;

    // Disable the add-on and remember that we did
    addon.userDisabled = true;
    Services.prefs.setBoolPref(PREF_SHUTDOWN, true);
  });
};

GlobalObs.prototype.onAppStartup = function() {
  // No need to restart if not previously shutdown
  if (!Services.prefs.prefHasUserValue(PREF_SHUTDOWN))
    return;

  // Re-enable the add-on when turning on studies
  AddonManager.getAddonByID(ADDON_ID, function(addon) {
    if (addon == null)
      return;

    // Enable the add-on and forget that it was shutdown
    addon.userDisabled = false;
    Services.prefs.clearUserPref(PREF_SHUTDOWN, true);
  });
};

GlobalObs.prototype.onExperimentStartup = function(store) {
  // Install the add-on if it's not installed yet
  function installAddon() {
    // Look through all add-ons for an existing install or conflicts
    AddonManager.getAllAddons(function(addons) {
      let conflicts = ["conflict"];
      let installed = false;
      addons.forEach(function({id}) {
        // Remember that it was already installed
        if (id == ADDON_ID)
          installed = true;
        // Remember that we found this conflict
        else if (id in ADDON_CONFLICTS)
          conflicts.push(ADDON_CONFLICTS[id]);
      });

      // Set various prefs to remember our state
      Services.prefs.setBoolPref(PREF_ALREADY_INSTALLED, installed)
      Services.prefs.setBoolPref(PREF_PROMPTED, true);

      // Configure the random testing [0, 3]
      Services.prefs.setIntPref(PREF_TESTPILOT, Math.floor(Math.random() * 4));

      // Already installed so nothing to do
      if (installed) {
        record("addon", "existed");
        return;
      }
      // Don't install if we have conflicts
      else if (conflicts.length > 1) {
        record("addon", conflicts.join(" "));
        return;
      }

      // Download and install the xpi
      AddonManager.getInstallForURL(INSTALL_URL, function(install) {
        // Make sure the user lets us install so canceling prevents future prompts
        let bag = Cc["@mozilla.org/hash-property-bag;1"].
                  createInstance(Ci.nsIWritablePropertyBag2).
                  QueryInterface(Ci.nsIWritablePropertyBag);
        bag.setProperty("promptType", "confirm");
        bag.setProperty("text", CONFIRM_QUESTION);
        bag.setProperty("title", CONFIRM_TITLE);

        // Open a dialog with a prompt to confirm
        let url = "chrome://global/content/commonDialog.xul";
        let features = "centerscreen,chrome,titlebar";
        let win = Services.ww.openWindow(null, url, "_blank", features, bag);

        // Set the icon to show test pilot
        win.addEventListener("DOMContentLoaded", function() {
          let icon = win.document.getElementById("info.icon");
          icon.style.listStyleImage = "url(" + CONFIRM_ICON + ")";
          record("addon", "prompted");
        }, false);

        // Only install on accepting the prompt
        win.addEventListener("dialogaccept", function() {
          install.install();
        }, false);

        // Record that the user said no
        win.addEventListener("dialogcancel", function() {
          record("addon", "denied");
        }, false);

        // Close this prompt if the study finishes or gets cancelled
        unload(function() win.close());
      }, "application/x-xpinstall", INSTALL_HASH);
    });
  }

  let self = this;
  GlobalObs.superClass.onExperimentStartup.call(self, store);

  // Track when the add-on changes state
  self.listener = {};
  ["disabled", "enabled", "installed", "uninstalled"].forEach(function(state) {
    let method = "on" + state[0].toUpperCase() + state.slice(1);
    self.listener[method] = function({id}) {
      if (id == ADDON_ID)
        record("addon", state);
    };
  });
  AddonManager.addAddonListener(self.listener)
  unload(function() {
    AddonManager.removeAddonListener(self.listener);
    self.listener = null;
  });

  // Keep checking if we should install the addon
  self.timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
  self.timer.initWithCallback({
    notify: function(timer) {
      let {testId} = exports.experimentInfo;

      // Only prompt to install once for this study
      try {
        if (Services.prefs.getBoolPref(PREF_PROMPTED))
          return;
      }
      catch(ex) {}

      // Only install after some time has passed
      let startDate = PREF_PREFIX + "startDate." + testId;
      let timeDiff = Date.now() - new Date(Services.prefs.getCharPref(startDate));
      if (timeDiff < CONFIRM_CHECK_TRIGGER)
        return;

      // Install the addon with some special configs
      installAddon();
    }
  }, CONFIRM_CHECK_EVERY, Ci.nsITimer.TYPE_REPEATING_SLACK);
  unload(function() {
    self.timer.cancel();
    self.timer = null;
  });
};

exports.handlers = new GlobalObs();

function WebContent()  {
  WebContent.baseConstructor.call(this, exports.experimentInfo);
}
BaseClasses.extend(WebContent, BaseClasses.GenericWebContent);

WebContent.prototype.__defineGetter__("dataCanvas", function() {
  return '<div class="dataBox"><h3>View Your Data:</h3>' +
    this.dataViewExplanation + this.rawDataLink +
    '<div id="data-plot-div" style="width: 480x; height: 800px;"></div>' +
    this.saveButtons + '</div>';
});

WebContent.prototype.__defineGetter__("dataViewExplanation", function() {
  return "The bar chart below shows your frequency of use of certain features.";
});

WebContent.prototype.__defineGetter__("saveButtons", function() {
  return '<div><button type="button" onclick="exportData();">Export Data</button></div>';
});

WebContent.prototype.onPageLoad = function(experiment, document, graphUtils) {
  let self = this;

  let dataSet = [];
  let nameIndex = {};
  experiment.getDataStoreAsJSON(function(rawData) {
    // Nothing to graph!
    if (rawData.length == 0)
      return;

    // Pick out the search related records
    for each (let {key, value} in rawData) {
      if (key.search(/^search /) == -1)
        continue;

      // Initialize with this new name if necessary
      let name = value + " (" + key.slice(7) + ")";
      if (nameIndex[name] == null) {
        nameIndex[name] = dataSet.length;
        dataSet.push({
          frequency: 1,
          name: name,
        });
      }
      // Otherwise just increment the frequency
      else
        dataSet[nameIndex[name]].frequency++;
    }

    // Convert the data set to bar graph points
    let data = [];
    let yAxis = [];
    for (let [name, index] in Iterator(nameIndex)) {
      data.push([dataSet[index].frequency, index - .5]);
      yAxis.push([index, name]);
    }

    // Show the bar graph
    let plotDiv = document.getElementById("data-plot-div");
    graphUtils.plot(plotDiv, [{data: data}], {
      series: {
        bars: {
          horizontal: true,
          show: true,
        },
      },
      xaxis: {
        min: 0,
        tickDecimals: 0,
      },
      yaxis: {
        ticks: yAxis,
      },
    });
  });
};

exports.webContent = new WebContent();
