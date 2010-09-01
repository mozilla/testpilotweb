BaseClasses = require("study_base_classes.js");

exports.experimentInfo = {
  testName: "About Firefox",
  testId: 10, // Let's allow non-numeric study ids!!!
  testInfoUrl: "https://",
  summary: "Basic data about preferences, plugins, and memory",
  thumbnail: null,
  versionNumber: 1,
  duration: 0.5,
  minTPVersion: "1.0a1",
  recursAutomatically: false,
  recurrenceInterval: null,
  startDate: null,
  optInRequired: false
};


exports.dataStoreInfo = {
  fileName: "testpilot_aboutFx_results.sqlite",
  tableName: "testpilot_aboutFx_study",
  columns: [
    {property: "key", type: BaseClasses.TYPE_STRING,
     displayName: "Key"},
    {property: "value", type: BaseClasses.TYPE_STRING,
     displayName: "Value"}
  ]
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
  "security."
];

// The blacklist, unlike the whitelist, is a list of regular expressions.
const PREFS_BLACKLIST = [
  /^network[.]proxy[.]/,
  /[.]print_to_filename$/
];

let gPrefService = Cc["@mozilla.org/preferences-service;1"]
                     .getService(Ci.nsIPrefService)
                     .QueryInterface(Ci.nsIPrefBranch2);

let Application = Cc["@mozilla.org/fuel/application;1"]
                             .getService(Ci.fuelIApplication);

function getModifiedPrefs() {
  // We use the low-level prefs API to identify prefs that have been
  // modified, rather that Application.prefs.all since the latter is
  // much, much slower.  Application.prefs.all also gets slower each
  // time it's called.  See bug 517312.
  let prefNames = getWhitelistedPrefNames();
  let prefs = [Application.prefs.get(prefName)
                      for each (prefName in prefNames)
                          if (gPrefService.prefHasUserValue(prefName)
                            && !isBlacklisted(prefName))];
  return prefs;
}

function getWhitelistedPrefNames() {
  let results = [];
  PREFS_WHITELIST.forEach(function (prefStem) {
    let prefNames = gPrefService.getChildList(prefStem);
    results = results.concat(prefNames);
  });
  return results;
}

function isBlacklisted(prefName) {
  return PREFS_BLACKLIST.some(function (re) {
                                return re.test(prefName);});
}

function AboutFxStudyGlobalObserver() {
  // No need for a per-window constructor
  AboutFxStudyGlobalObserver.baseConstructor.call(this, null);
}
BaseClasses.extend(AboutFxStudyGlobalObserver,
                   BaseClasses.GenericGlobalObserver);
AboutFxStudyGlobalObserver.prototype.onExperimentStartup = function(store) {
  AboutFxStudyGlobalObserver.superClass.onExperimentStartup.call(this, store);
  let self = this;

  // Clear out the store each time.
  store.wipeAllData(function() {
    // Copied from about:memory
    let mgr = Cc["@mozilla.org/memory-reporter-manager;1"]
          .getService(Ci.nsIMemoryReporterManager);

    let e = mgr.enumerateReporters();
    while (e.hasMoreElements()) {
      let mr = e.getNext().QueryInterface(Ci.nsIMemoryReporter);
      self.record({key: mr.path, value: mr.memoryUsed + " bytes"});
    }

    // Copied from about:plugins
    let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                          .getService(Ci.nsIWindowMediator);
    let frontWindow = wm.getMostRecentWindow("navigator:browser");
    let plugins = frontWindow.navigator.plugins;
    plugins.refresh(false);
    for (let i = 0; i < plugins.length; i++) {
      let plugin = plugins[i];
      if (plugin) {
        self.record({key: plugin.filename, value: plugin.version});
      }
    }

    // Copied from about:support
    let d2d;
    try {
      // nsIGfxInfo is currently only implemented on Windows
      d2d = Cc["@mozilla.org/gfx/info;1"].getService(Ci.nsIGfxInfo).D2DEnabled;
    } catch (e) {
      d2d = false;
    }
    self.record({key: "d2d enabled", value: "" + d2d});

    let prefs = getModifiedPrefs();
    prefs.forEach(function(pref) {
                    self.record({key: pref.name, value: "" + pref.value});
                  });

    // Could also include:  about:buildconfig if required;
    // detailed extension data.
  });
};
exports.handlers = new AboutFxStudyGlobalObserver();


function AboutFxWebContent()  {
  AboutFxWebContent.baseConstructor.call(this, exports.experimentInfo);
}
BaseClasses.extend(AboutFxWebContent, BaseClasses.GenericWebContent);
AboutFxWebContent.prototype.__defineGetter__("dataCanvas",
  function() {
      return '<div class="dataBox"><h3>View Your Data:</h3>' +
      this.dataViewExplanation +
      this.rawDataLink +
      '<div id="data-plot-div" style="width:480x;height:800px"></div>' +
      this.saveButtons + '</div>';
  });
AboutFxWebContent.prototype.__defineGetter__("dataViewExplanation",
  function() {
    return "Below is some random info about your stuff.";
  });
AboutFxWebContent.prototype.onPageLoad = function(experiment,
                                                  document,
                                                  graphUtils) {
  // TODO
};
exports.webContent = new AboutFxWebContent();

require("unload").when(
  function destructor() {
  });


