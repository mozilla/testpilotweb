BaseClasses = require("study_base_classes.js");

exports.experimentInfo = {
  testName: "About Firefox",
  testId: 10, // Let's allow non-numeric study ids!!!
  testInfoUrl: "https://testpilot.mozillalabs.com/testcases/aboutfirefox",
  summary: "Basic data about preferences, plugins, and memory",
  thumbnail: null,
  versionNumber: 1,
  duration: 0.5,
  minTPVersion: "1.0a1",
  minFXVersion: "4.0b1pre",
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
  "security.",
  "ui."
];

// The blacklist, unlike the whitelist, is a list of regular expressions.
const PREFS_BLACKLIST = [
  /^network[.]proxy[.]/,
  /[.]print_to_filename$/,
  /browser.startup.homepage/
];

function AboutFxStudyGlobalObserver() {
  // No need for a per-window constructor
  AboutFxStudyGlobalObserver.baseConstructor.call(this, null);
}
BaseClasses.extend(AboutFxStudyGlobalObserver,
                   BaseClasses.GenericGlobalObserver);
AboutFxStudyGlobalObserver.prototype.getMemoryInfo = function() {
    // Copied from about:memory
    let mgr = Cc["@mozilla.org/memory-reporter-manager;1"]
          .getService(Ci.nsIMemoryReporterManager);

    let memInfo = [];
    let e = mgr.enumerateReporters();
    while (e.hasMoreElements()) {
      let mr = e.getNext().QueryInterface(Ci.nsIMemoryReporter);
      memInfo.push(mr);
    }
    return memInfo;
};
AboutFxStudyGlobalObserver.prototype.getPluginInfo = function() {
    // Copied from about:plugins
    let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                          .getService(Ci.nsIWindowMediator);
    let frontWindow = wm.getMostRecentWindow("navigator:browser");
    let plugins = frontWindow.navigator.plugins;
    let plugInfo = [];
    plugins.refresh(false);
    for (let i = 0; i < plugins.length; i++) {
      let plugin = plugins[i];
      if (plugin) {
        plugInfo.push(plugin);
      }
    }
    return plugInfo;
};
AboutFxStudyGlobalObserver.prototype.getPrefInfo = function() {
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
  }

  // We use the low-level prefs API to identify prefs that have been
  // modified, rather that Application.prefs.all since the latter is
  // much, much slower.  Application.prefs.all also gets slower each
  // time it's called.  See bug 517312.
  let prefs = [];
  for each (prefName in whitelist) {
    if (prefService.prefHasUserValue(prefName)) {
      let aPref = Application.prefs.get(prefName);
      // For blacklisted prefs, don't record actual value - only the
      // fact that it has been set.
      if (isBlacklisted(prefName)) {
        aPref.value = "Custom Value";
      }
      prefs.push(aPref);
    }
  }
  return prefs;
};
AboutFxStudyGlobalObserver.prototype.getGraphxInfo = function() {
    let gfxInfo = [];

    // Copied from about:support
    let d2d;

    try {
      // nsIGfxInfo is currently only implemented on Windows
      d2d = Cc["@mozilla.org/gfx/info;1"].getService(Ci.nsIGfxInfo).D2DEnabled;
    } catch (e) {
      d2d = false;
    }
    gfxInfo.push({key: "d2d enabled", value: "" + d2d});

    // nsIGfxInfo is currently only implemented on Windows and only on nightlies
    //let gfxInfo = Cc["@mozilla.org/gfx/info;1"].getService(Ci.nsIGfxInfo);
    // see source in about:support

    // If we're on windows, use jsctypes to get graphics card info:
    let oscpu = Cc["@mozilla.org/network/protocol;1?name=http"].getService(Ci.nsIHttpProtocolHandler).oscpu;
    let os = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS;
    dump("Your OS is " + os + "\n");
    if (os.toLowerCase().indexOf("win") > -1) {
      try {
      let ns = {};
      Cu.import("resource://gre/modules/ctypes.jsm", ns);
      dump("ns.ctypes is " + ns.ctypes + "\n");
      let ctypes = ns.ctypes;

      // Copied from http://mxr.mozilla.org/mozilla-central/source/widget/src/windows/GfxInfo.cpp#171
      let user32 = ctypes.open("C:\\WINDOWS\\system32\\user32.dll");
      let DWORD = ctypes.uint32_t;
      let TCHAR_ARRAY =  new ctypes.ArrayType(ctypes.jschar, 32);
      let TCHAR_ARRAY_L = new ctypes.ArrayType(ctypes.jschar, 128);
      dump("Let's define a struct\n");
      let DISPLAY_DEVICE = new ctypes.StructType("_DISPLAY_DEVICE",
        [ {"cb": DWORD},
          {"DeviceName": TCHAR_ARRAY},
          {"DeviceString": TCHAR_ARRAY_L},
          {"StateFlags": DWORD},
          {"DeviceID": TCHAR_ARRAY_L},
          {"DeviceKey": TCHAR_ARRAY_L}]);

      //DISPLAY_DEVICEW displayDevice; // Does the W-ness matter?
      // PDISPLAY_DEVICE is a pointer to one of these.
      let LPCTSTR = ctypes.jschar.array();// either char* or wchar_t* if unicode
      dump("Let's define a function.\n");
      let enumFunction = user32.declare("EnumDisplayDevicesW",
                                        ctypes.winapi_abi,
                                        ctypes.bool,
                                        LPCTSTR,
                                        DWORD,
                                        DISPLAY_DEVICE.ptr,
                                        DWORD);
      dump("let's instantiate display device...\n");
      let displayDevice = new DISPLAY_DEVICE();
      displayDevice.cb = DISPLAY_DEVICE.size;
      let deviceIndex = 0;
      const DISPLAY_DEVICE_PRIMARY_DEVICE = 4; // i thinik?
      while (enumFunction(null, deviceIndex, displayDevice.address(), 0)) {
         if (displayDevice.StateFlags & DISPLAY_DEVICE_PRIMARY_DEVICE)
           break;
         deviceIndex++;
      }

      gfxInfo.push({key: "Gfx Device Name",
                    value: displayDevice.DeviceName.readString()});
      gfxInfo.push({key: "Gfx Device String",
                    value: displayDevice.DeviceString.readString()});
      gfxInfo.push({key: "Gfx Device Id",
                    value: displayDevice.DeviceID.readString()});
      gfxInfo.push({key: "Gfx Device Key",
                    value: displayDevice.DeviceKey.readString()});
      user32.close();
      } catch(e) {
        dump("Error: " + e + "\n");
      }
    }
    return gfxInfo;
};


AboutFxStudyGlobalObserver.prototype.onExperimentStartup = function(store) {
  AboutFxStudyGlobalObserver.superClass.onExperimentStartup.call(this, store);
  let self = this;

  // Clear out the store each time.
  store.wipeAllData(function() {

    for each (let mr in self.getMemoryInfo()) {
      self.record({key: mr.path, value: mr.memoryUsed + " bytes"});
    }

    for each (let plugin in self.getPluginInfo()) {
      self.record({key: plugin.name + ";" + plugin.filename,
                   value: plugin.version});
    }

    for each (let pref in self.getPrefInfo()) {
      self.record({key: pref.name, value: "" + pref.value});
    }
    // Could also include:  about:buildconfig if required;
    // detailed extension data.

    for each (let gfx in self.getGraphxInfo()) {
      self.record(gfx);
    }

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
      '<h4>Your Firefox is using <span id="mem-info"></span> Bytes of Memory</h4></ul>' +
      '<h4>Your Plugin Versions:</h4><ul id="plugins-list"></ul>' +
      '<h4>Your Modified Preferences:</h4><div id="prefs-list"></div>' +
      '</div>';
  });
AboutFxWebContent.prototype.__defineGetter__("dataViewExplanation",
  function() { return ""; });
AboutFxWebContent.prototype.onPageLoad = function(experiment,
                                                  document,
                                                  graphUtils) {
    let insertDoc = function(parentElem, string) {
      let elem = document.getElementById(parentElem);      
      let child = document.createElement("li");
      child.innerHTML = string;
      elem.appendChild(child);
    };

    for each (let mr in exports.handlers.getMemoryInfo()) {
      document.getElementById("mem-info").innerHTML = mr.memoryUsed + "";
      break;
    }

    for each (let plugin in exports.handlers.getPluginInfo()) {
      insertDoc("plugins-list",
                plugin.name + " version " + plugin.version);
    }

    let modifiedPrefs = [];
    for each (let pref in exports.handlers.getPrefInfo()) {
      modifiedPrefs.push(pref.name);
    }
    document.getElementById("prefs-list").innerHTML = modifiedPrefs.join(", ");
};
exports.webContent = new AboutFxWebContent();

require("unload").when(
  function destructor() {
  });


