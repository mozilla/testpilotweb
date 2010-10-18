/* Basic panel experiment */
BaseClasses = require("study_base_classes.js");
Components.utils.import("resource://gre/modules/AddonManager.jsm"); // TODO generally put these closer to where they're used

exports.experimentInfo = {
  startDate: null,
  duration: 7,
  testName: "A Week in the Life of a Browser",
  testId: 2,
  testInfoUrl: "https://testpilot.mozillalabs.com/testcases/a-week-life.html",
  summary: "This auto-recurring study aims to explore larger trends of how "
           + "the browser is being used over time. It will periodically collect "
           + "data on the browser's basic performance for one week, running "
           + "the same study again every 60 days, from Oct. 2010 to "
           + "Oct. 2011.",
  thumbnail: "https://testpilot.mozillalabs.com/testcases/a-week-life/week-life-thumbnail.png",
  optInRequired: false,
  recursAutomatically: true,
  recurrenceInterval: 60,
  versionNumber: 5,
  minTPVersion: "1.0rc1",
  minFXVersion: "3.5"
};

const WeekEventCodes = {
  STUDY_STATUS: 0,
  BROWSER_START: 1,
  BROWSER_SHUTDOWN: 2,
  BROWSER_RESTART: 3,
  BROWSER_ACTIVATE: 4,
  BROWSER_INACTIVE: 5,
  SEARCHBAR_SEARCH: 6,
  SEARCHBAR_SWITCH: 7,
  BOOKMARK_STATUS: 8,
  BOOKMARK_CREATE: 9,
  BOOKMARK_CHOOSES: 10,
  BOOKMARK_MODIFY: 11,
  DOWNLOAD: 12,
  DOWNLOAD_MODIFY: 13,
  ADDON_STATUS: 14,
  ADDON_INSTALL: 15,
  ADDON_UNINSTALL: 16,
  PRIVATE_ON: 17,
  PRIVATE_OFF: 18,
  MEMORY_USAGE:19,
  SESSION_ON_RESTORE:20,
  SESSION_RESTORE: 21,
  PLUGIN_VERSION:22,
  HISTORY_STATUS: 23,
  PROFILE_AGE: 24,
  SESSION_RESTORE_PREFERENCES: 25
};

var eventCodeToEventName = ["Study Status", "Firefox Startup", "Firefox Shutdown",
                            "Firefox Restart", "Resume Active Use",
                            "Begin Idle", "Search", "Search Settings Changed",
                            "Bookmark Count", "New Bookmark", "Bookmark Opened",
                            "Bookmark Modified", "Download",
                            "Download Settings Changed", "Add-ons Count",
                            "Add-on Installed", "Add-on Uninstalled",
                            "Private Mode On", "Private Mode Off", "Memory Usage",
                            "Total Windows/Tabs in about:sessionrestore",
                            "Actual Restored Windows/Tabs", "Plugin Version",
                            "History Count", "Profile Age",
                            "Session Restore Preferences"];

// subcodes for BOOKMARK_MODIFY:
const BMK_MOD_CHANGED = 0;
const BMK_MOD_REMOVED = 1;
const BMK_MOD_MOVED = 2;

// subcodes for bookmark type:
const BMK_TYPE_BOOKMARK = "0";
const BMK_TYPE_FOLDER = "1";

const UNINSTALL_DONE = "0";
const UNINSTALL_CANCELLED = "1";

exports.dataStoreInfo = {
  fileName: "testpilot_week_in_the_life_results.sqlite",
  tableName: "week_in_the_life",
  columns: [{property: "event_code", type: BaseClasses.TYPE_INT_32, displayName: "Event",
             displayValue: eventCodeToEventName},
            {property: "data1", type: BaseClasses.TYPE_STRING, displayName: "Data 1"},
            {property: "data2", type: BaseClasses.TYPE_STRING, displayName: "Data 2"},
            {property: "data3", type: BaseClasses.TYPE_STRING, displayName: "Data 3"},
            {property: "timestamp", type: BaseClasses.TYPE_DOUBLE, displayName: "Time",
             displayValue: function(value) {return new Date(value).toLocaleString();}}]
};

var BookmarkObserver = {
  alreadyInstalled: false,
  store: null,
  bmsvc: null,

  install: function(store) {
     /* See
     https://developer.mozilla.org/en/nsINavBookmarkObserver and
     https://developer.mozilla.org/en/nsINavBookmarksService
      */
    if (!this.alreadyInstalled) {
      console.info("Adding bookmark observer.");
      this.bmsvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
        .getService(Ci.nsINavBookmarksService);
      this.lmsvc = Cc["@mozilla.org/browser/livemark-service;2"]
        .getService(Ci.nsILivemarkService);
      this.bmsvc.addObserver(this, false);
      this.store = store;
      this.alreadyInstalled = true;
    }
  },

  runGlobalBookmarkQuery: function() {
    // Run once on startup to count bookmarks, folders, and depth of
    // folders.
    let historyService = Cc["@mozilla.org/browser/nav-history-service;1"]
                               .getService(Ci.nsINavHistoryService);
    let totalBookmarks = 0;
    let totalFolders = 0;
    let greatestDepth = 0;
    let rootFolders = [ this.bmsvc.toolbarFolder,
                        this.bmsvc.bookmarksMenuFolder,
                        this.bmsvc.tagsFolder,
                        this.bmsvc.unfiledBookmarksFolder];
    let lmsvc = this.lmsvc;
    let bmsvc = this.bmsvc;
    let digIntoFolder = function(folderID, depth) {
      let options = historyService.getNewQueryOptions();
      let query = historyService.getNewQuery();
      query.setFolders([folderID], 1);
      let result = historyService.executeQuery(query, options);
      let rootNode = result.root;
      rootNode.containerOpen = true;
      if (rootNode.childCount > 0) {
        // don't count livemarks
        let folderId = bmsvc.getFolderIdForItem( rootNode.getChild(0).itemId );
        if (!lmsvc.isLivemark(folderId)) {
          // iterate over the immediate children of this folder, recursing
          // into any subfolders
          for (let i = 0; i < rootNode.childCount; i ++) {
            let node = rootNode.getChild(i);
            if (node.type == node.RESULT_TYPE_FOLDER) {
              totalFolders ++;
              digIntoFolder(node.itemId, depth + 1);
            } else {
              totalBookmarks ++;
            }
          }
        }
      }
      // close a container after using it!
      rootNode.containerOpen = false;
      if (depth > greatestDepth) {
        greatestDepth = depth;
      }
    };

    let rootFolder;
    for each (rootFolder in rootFolders) {
      digIntoFolder(rootFolder, 0);
    }

    console.info("Results: There are " + totalBookmarks + " bookmarks.");
    console.info("In " + totalFolders + " folders.");
    console.info("Greatest folder depth is " + greatestDepth);
    this.store.rec(WeekEventCodes.BOOKMARK_STATUS, totalBookmarks, totalFolders,
                   greatestDepth);
  },

  uninstall: function() {
    if (this.alreadyInstalled) {
      this.bmsvc.removeObserver(this);
      this.alreadyInstalled = false;
    }
  },

  onItemAdded: function(itemId, parentId, index, type) {
    let folderId = this.bmsvc.getFolderIdForItem(itemId);
    if (!this.lmsvc.isLivemark(folderId)) {
      // Ignore livemarks -these are constantly added automatically
      // and we don't really care about them.
      switch (type) {
        case this.bmsvc.TYPE_BOOKMARK:
          console.info("Bookmark added.");
          this.store.rec(WeekEventCodes.BOOKMARK_CREATE, BMK_TYPE_BOOKMARK, "", "");
        break;
        case this.bmsvc.TYPE_FOLDER:
          console.info("Bookmark Folder added.");
          this.store.rec(WeekEventCodes.BOOKMARK_CREATE, BMK_TYPE_FOLDER, "" , "");
        break;
      }
    }
  },

  onItemRemoved: function(itemId, parentId, index, type) {
    let folderId = this.bmsvc.getFolderIdForItem(itemId);
    if (!this.lmsvc.isLivemark(folderId)) {
      this.store.rec(WeekEventCodes.BOOKMARK_MODIFY, BMK_MOD_REMOVED, "", "");
      console.info("Bookmark removed!");
    }
  },

  onItemChanged: function(bookmarkId, property, isAnnotation,
                          newValue, lastModified, type) {
    // This gets called with almost every add, remove, or visit; it's too
    // much info, so we're not going to track it for now.
    /*let folderId = this.bmsvc.getFolderIdForItem(bookmarkId);
    if (!this.lmsvc.isLivemark(folderId)) {
      this.store.rec(WeekEventCodes.BOOKMARK_MODIFY, [BMK_MOD_CHANGED]);
      console.info("Bookmark modified!");
    }*/
  },

  onItemVisited: function(bookmarkId, visitId, time) {
    // This works.
    this.store.rec(WeekEventCodes.BOOKMARK_CHOOSE, "", "", "");
    console.info("Bookmark visited!");
  },

  onItemMoved: function(itemId, oldParentId, oldIndex, newParentId,
                        newIndex, type) {
    this.store.rec(WeekEventCodes.BOOKMARK_MODIFY, BMK_MOD_MOVED, "", "");
    console.info("Bookmark moved!");
  }
};

var IdlenessObserver = {
  /* Uses nsIIdleService, see
   * https://developer.mozilla.org/en/nsIIdleService
   * However, that has two flaws: First, it is OS-wide, not Firefox-specific.
   * Second, it won't trigger if you close your laptop lid before the
   * allotted time is up.  To catch this second case, we use an additional
   * method: self-pinging on a timer.
   */
  alreadyInstalled: false,
  store: null,
  idleService: null,
  lastSelfPing: 0,
  selfPingTimer: null,
  selfPingInterval: 300000, // Five minutes

  install: function(store) {
    if (!this.alreadyInstalled) {
      console.info("Adding idleness observer.");
      this.idleService = Cc["@mozilla.org/widget/idleservice;1"]
       .getService(Ci.nsIIdleService);
      this.store = store;
      // addIdleObserver takes seconds, not ms.  600s = 10 minutes.
      this.idleService.addIdleObserver(this, 600);
      this.alreadyInstalled = true;
      // Periodically ping myself to make sure Firefox is still running...
      // if time since last ping is ever too long, it probably means the computer
      // shut down or something
      this.lastSelfPing = Date.now();
      this.selfPingTimer = Components.classes["@mozilla.org/timer;1"]
                           .createInstance(Components.interfaces.nsITimer);
      this.pingSelf();
    }
  },

  uninstall: function() {
    if (this.alreadyInstalled) {
      this.idleService.removeIdleObserver(this, 600);
      this.alreadyInstalled = false;
      if (this.selfPingTimer) {
        this.selfPingTimer.cancel();
      }
    }
  },

  pingSelf: function() {
    // If we miss one or more expected pings, then record idle event.
    let self = this;
    this.selfPingTimer.initWithCallback(function() {
      let now = Date.now();
      let diff = now - self.lastSelfPing;
      if (diff > self.selfPingInterval * 1.1) {
        // TODO we may occasionally see another event recorded between
        // 'estimatedStop' and 'now', in which case it will be in the file
        // before either of them... account for this in processing.
        let estimatedStop = self.lastSelfPing + self.selfPingInterval;
        // backdate my own timestamp:
        self.store.storeEvent({ event_code: WeekEventCodes.BROWSER_INACTIVE,
                                data1: "1", data2: "0", data3: "0",
                                timestamp: estimatedStop});
        self.store.rec(WeekEventCodes.BROWSER_ACTIVATE, "1", "", "");
      }
      self.lastSelfPing = now;
    }, this.selfPingInterval, 1);
  },

  observe: function(subject, topic, data) {
    // Subject is nsIIdleService. Topic is 'idle' or 'back'.  Data is elapsed
    // time in *milliseconds* (not seconds like addIdleObserver).
    if (topic == 'idle') {
      console.info("User has gone idle for " + data + " milliseconds.");
      let idleTime = Date.now() - parseInt(data);
      this.store.storeEvent({ event_code: WeekEventCodes.BROWSER_INACTIVE,
                              data1: "2", data2: "0", data3: "0",
                              timestamp: idleTime});
      if (this.selfPingTimer) {
        this.selfPingTimer.cancel();
      }
    }
    if (topic == 'back') {
      console.info("User is back! Was idle for " + data + " milliseconds.");
      this.store.rec(WeekEventCodes.BROWSER_ACTIVATE, "2", "", "");
      this.lastSelfPing = Date.now();
      this.pingSelf();
    }
  }
};

var ExtensionObserver = {
  alreadyInstalled: false,
  store: null,

  install: function(store) {
    if (!this.alreadyInstalled) {
      this.store = store;
      let self = this;
      AddonManager.addInstallListener(self.instalListener);
      AddonManager.addAddonListener(self.addonListener);
      this.alreadyInstalled = true;
    }
  },

  instalListener : {
    onInstallEnded : function (aInstall, aAddon) {
      console.info("onInstallEnded!");
      if ("extension" == aAddon.type){
        ExtensionObserver.store.rec(WeekEventCodes.ADDON_INSTALL, "", "", "");
        console.info("An extension was installed!");
      }
    }
  },

  addonListener : {
    onUninstalling: function(aAddon) {
      if ("extension" == aAddon.type){
        ExtensionObserver.store.rec(WeekEventCodes.ADDON_UNINSTALL,
                                  UNINSTALL_DONE, "addon name: " + aAddon.name,
                                  "addon id: " + aAddon.id);
        console.info(aAddon.name +
                     " will be uninstalled after the application restarts.!");
      }
    },

    onOperationCancelled: function(aAddon) {
      //PENDING_NONE: 0
      if ("extension" == aAddon.type && 0 == aAddon.pendingOperations) {
          ExtensionObserver.store.rec(WeekEventCodes.ADDON_UNINSTALL,
                              UNINSTALL_CANCELLED, "addon name: " + aAddon.name,
                                  "addon id: " + aAddon.id);
        console.info(aAddon.name +
                   " will NOT be uninstalled after the application restarts.!");
      }
    }
  },

  uninstall: function() {
    if (this.alreadyInstalled) {
      let self = this;
      AddonManager.removeAddonListener(self.addonListener);
      AddonManager.removeInstallListener(self.instalListener);
      console.info("Removing Addon Listeners sucessfully");
      this.alreadyInstalled = false;
    }
  },

  runGlobalAddonsQuery: function () {
    //Reference: https://developer.mozilla.org/en/Addons/Add-on_Manager
    AddonManager.getAllAddons(function(aAddons) {
      let numberActive = 0;
      let numberInactive = 0;
      aAddons.forEach(function(aAddon) {
        //TODO: Should be recorded isCompatible
        //type: "extension" "plugin" "theme"
        if ("extension" == aAddon.type){
          if (true == aAddon.userDisabled) {
            console.info ("true == aAddon.userDisabled");
            numberInactive += 1;
          } else {
            console.info ("else true == aAddon.userDisabled");
            numberActive += 1;
          }
        }
      });
      console.info ("Recording extensions active: " + numberActive +
                    " inactive: " + numberInactive);
      ExtensionObserver.store.rec(WeekEventCodes.ADDON_STATUS, numberActive,
                                  numberInactive, "");
    });
  }
};

var DownloadsObserver = {
  alreadyInstalled: false,
  store: null,
  downloadManager: null,

  install: function(store) {
    if (!this.alreadyInstalled) {
      console.info("Adding downloads observer.");
      this.obsService = Cc["@mozilla.org/observer-service;1"]
                           .getService(Ci.nsIObserverService);
      this.obsService.addObserver(this, "dl-done", false);

      /*this.downloadManager = Cc["@mozilla.org/download-manager;1"]
                   .getService(Ci.nsIDownloadManager);
      this.downloadManager.addListener(this);*/
      this.store = store;
      this.alreadyInstalled = true;
    }
  },

  uninstall: function() {
    if (this.alreadyInstalled) {
      //this.downloadManager.removeListener(this);
      this.obsService.removeObserver(this, "dl-done", false);
      this.alreadyInstalled = false;
    }
  },

  observe: function (subject, topic, state) {
    if (topic == "dl-done") {
      console.info("A download completed.");
      this.store.rec(WeekEventCodes.DOWNLOAD, "", "", "");
    }
  }

  // This is the API for the downloadManager.addListener listener...
  /*onSecurityChange : function(prog, req, state, dl) {
  },
  onProgressChange : function(prog, req, prog2, progMax, tProg, tProgMax, dl) {
  },
  onStateChange : function(prog, req, flags, status, dl) {
  },
  onDownloadStateChange : function(state, dl) {
  }*/
};

var MemoryObserver = {
  /* Uses nsIMemoryReporterManager, see about:memory
   * It retrieves memory information periodically according to the timerInterval
   */
  alreadyInstalled: false,
  store: null,
  memoryManager: null,
  memoryInfoTimer: null,
  timerInterval: 600000, // Ten minutes

   install: function(store) {
    if (!this.alreadyInstalled) {
      console.info("Adding memory observer.");

      this.memoryManager = Cc["@mozilla.org/memory-reporter-manager;1"]
        .getService(Components.interfaces.nsIMemoryReporterManager);

      this.memoryInfoTimer = Components.classes["@mozilla.org/timer;1"]
        .createInstance(Components.interfaces.nsITimer);

      this.store = store;
      //Get Memory info on startup
      this.getMemoryInfo();
      let self = this;
      this.memoryInfoTimer.initWithCallback(function(){self.getMemoryInfo()}
        ,this.timerInterval, this.memoryInfoTimer.TYPE_REPEATING_SLACK);
      this.alreadyInstalled = true;
    }
  },

  uninstall: function() {
    if (this.alreadyInstalled) {
      this.alreadyInstalled = false;
      if (this.memoryInfoTimer) {
        this.memoryInfoTimer.cancel();
      }
    }
  },

  getMemoryInfo: function() {
    let enumRep = this.memoryManager.enumerateReporters();
    let now = Date.now();
    while (enumRep.hasMoreElements()) {
      let mr = enumRep.getNext().QueryInterface(Ci.nsIMemoryReporter);
      console.info("memory path: "+ mr.path + " memory used: " + mr.memoryUsed);
      this.store.storeEvent({ event_code: WeekEventCodes.MEMORY_USAGE,
                        data1: "" + mr.path, data2: "" + mr.memoryUsed,
                        data3: "", timestamp: now});

    }
  }
};

//Global variable to keep track of all restored tabs
let totalRestoringTabs = 0;
//let sessionRestoredTabs = 0;
var SessionRestoreObserver = {
  //TODO: Check if it is better to add a listener to Restore btn (id:errorTryAgain)
  //Add total restored windows.

  install: function(aWindow) {
      aWindow.document.addEventListener("SSTabRestoring",
      SessionRestoreObserver.increaseTabCounter, false);

    //aWindow.document.addEventListener("SSTabRestored",
    //  function(){
    //    sessionRestoredTabs = sessionRestoredTabs + 1;
    //    console.info("Tabs RESTORED: " + sessionRestoredTabs);
    //  }, false);
  },

  uninstall: function(aWindow) {
    aWindow.document.removeEventListener("SSTabRestoring",
      SessionRestoreObserver.increaseTabCounter, false);
  },

  increaseTabCounter: function() {
    totalRestoringTabs = totalRestoringTabs + 1;
    console.info("Current Total Restoring Tabs: " + totalRestoringTabs);
  }
};



// TODO if we don't need per-window observation, we don't need to make one of these.
// On the other hand, if SessionRestoreObserver is instantiated once per window,
// it should be through here!
function WeekLifeStudyWindowObserver(window, globalInstance) {
  // Call base class constructor (Important!)
  WeekLifeStudyWindowObserver.baseConstructor.call(this, window, globalInstance);
}
// set up BackButtonWindowObserver as a subclass of GenericWindowObserver:
BaseClasses.extend(WeekLifeStudyWindowObserver,
                   BaseClasses.GenericWindowObserver);
WeekLifeStudyWindowObserver.prototype.install = function() {
}

function WeekLifeStudyGlobalObserver() {
  WeekLifeStudyGlobalObserver.baseConstructor.call(this,
                                                   WeekLifeStudyWindowObserver);
}
BaseClasses.extend(WeekLifeStudyGlobalObserver,
                   BaseClasses.GenericGlobalObserver);
WeekLifeStudyGlobalObserver.prototype.getPluginInfo = function() {
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

WeekLifeStudyGlobalObserver.prototype.getTotalPlacesNavHistory = function() {
  //Record the number of places in the history
  let historyService = Cc["@mozilla.org/browser/nav-history-service;1"]
    .getService(Ci.nsINavHistoryService);

  let options = historyService.getNewQueryOptions();
  let query = historyService.getNewQuery();
  let result = historyService.executeQuery(query, options);
  let rootNode = result.root;
  rootNode.containerOpen = true;
  let totalPlaces = rootNode.childCount;
  rootNode.containerOpen = false;

  return totalPlaces;
};

WeekLifeStudyGlobalObserver.prototype.getProfileAge = function() {
  //oldest file in the profile directory
  let file = Components.classes["@mozilla.org/file/directory_service;1"].
                  getService(Components.interfaces.nsIProperties).
                  get("ProfD", Components.interfaces.nsIFile);
  let entries = file.directoryEntries;
  let oldestCreationTime = Date.now();

  while(entries.hasMoreElements()) {
    let entry = entries.getNext();
    try{
      entry.QueryInterface(Components.interfaces.nsIFile);
      //nsIFile doesn't have an attribute for file creation time
      if(oldestCreationTime > entry.lastModifiedTime) {
        oldestCreationTime = entry.lastModifiedTime;
      }
    }
    catch(e){
     //If it couldn't access file info
    }
  }
  return oldestCreationTime;
};

WeekLifeStudyGlobalObserver.prototype.recordSessionStorePrefs = function() {
  let prefs = Cc["@mozilla.org/preferences-service;1"]
    .getService(Ci.nsIPrefService);

  let prefBranch = prefs.getBranch("browser.startup.");
  let prefValue = prefBranch.getIntPref("page");
  //browser.startup.page 0: blank page, 1: homepage, 3: previous session
  this.record(WeekEventCodes.SESSION_RESTORE_PREFERENCES,
              "browser.startup.page", prefValue, "");
  console.info("browser.startup.page: " + prefValue);

  prefBranch = prefs.getBranch("browser.sessionstore.");

  prefValue = prefBranch.getBoolPref("resume_from_crash");
  this.record(WeekEventCodes.SESSION_RESTORE_PREFERENCES,
              "browser.sessionstore.resume_from_crash", prefValue, "");
  console.info("browser.sessionstore.resume_from_crash: " + prefValue);

  prefValue = prefBranch.getBoolPref("resume_session_once");
  this.record(WeekEventCodes.SESSION_RESTORE_PREFERENCES,
              "browser.sessionstore.resume_session_once", prefValue, "");
  console.info("browser.sessionstore.resume_session_once: "+ prefValue);

  prefValue = prefBranch.getIntPref("max_resumed_crashes");
  this.record(WeekEventCodes.SESSION_RESTORE_PREFERENCES,
              "browser.sessionstore.max_resumed_crashes", prefValue, "");
  console.info("browser.sessionstore.max_resumed_crashes: "+ prefValue);
};

WeekLifeStudyGlobalObserver.prototype.startAllObservers = function(store) {
  BookmarkObserver.install(store);
  IdlenessObserver.install(store);
  ExtensionObserver.install(store);
  DownloadsObserver.install(store);
  MemoryObserver.install(store);
};

WeekLifeStudyGlobalObserver.prototype.stopAllObservers = function() {
  BookmarkObserver.uninstall();
  IdlenessObserver.uninstall();
  ExtensionObserver.uninstall();
  DownloadsObserver.uninstall();
  MemoryObserver.uninstall();
};

WeekLifeStudyGlobalObserver.prototype.observe = function(subject, topic, data) {
  if (topic == "quit-application") {
    if (data == "shutdown") {
      this.record(WeekEventCodes.BROWSER_SHUTDOWN, "", "", "");
      console.info("Week in the Life study got shutdown message.");
    } else if (data == "restart") {
      this.record(WeekEventCodes.BROWSER_RESTART,  "", "", "");
      console.info("Week in the Life study got startup message.");
    }
  }
};

WeekLifeStudyGlobalObserver.prototype.onExperimentStartup = function(store) {
  WeekLifeStudyGlobalObserver.superClass.onExperimentStartup.call(this, store);
  //let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
  //                      .getService(Ci.nsIWindowMediator);
  _dataStore: null;
  obsService: null;
  _sessionStartup: null;
  let self = this;
  //Attach a convenience method to the data store object:
  store.rec = function(eventCode, data1, data2, data3) {
    self.record(eventCode, data1, data2, data3);
  };
  this._dataStore = store;
  // Record the version of this study at startup: this lets us see
  // what data was recorded before and after an update, which lets us
  // know whether any given data included a given bug-fix or not.
  this.record(WeekEventCodes.STUDY_STATUS, exports.experimentInfo.versionNumber,
              "", "");

  //Record plugin info
  for each (let plugin in this.getPluginInfo()) {
    console.info("plugin.name: "+ plugin.name);
    this.record(WeekEventCodes.PLUGIN_VERSION, plugin.filename,
                 plugin.version, plugin.name);
  }

  //Record navigation history
  let totalPlaces = this.getTotalPlacesNavHistory();
  console.info("Total History Places: "+ totalPlaces);
  this.record(WeekEventCodes.HISTORY_STATUS, totalPlaces, "", "");

  //Record oldest file in profile
  let profileAge = this.getProfileAge();
  console.info("Profile Age: "+ profileAge + " milliseconds");
  this.record(WeekEventCodes.PROFILE_AGE, profileAge, "", "");

    //Record session store main preferences
  this.recordSessionStorePrefs();

  console.info("Week in the life: Starting subobservers.");
  this.startAllObservers(this._dataStore);
  BookmarkObserver.runGlobalBookmarkQuery();
  ExtensionObserver.runGlobalAddonsQuery();
  this.obsService = Cc["@mozilla.org/observer-service;1"]
                         .getService(Ci.nsIObserverService);
  this.obsService.addObserver(this, "quit-application", false);
};

// Utility function for recording events:
WeekLifeStudyGlobalObserver.prototype.record = function(eventCode, val1, val2,
                                                  val3) {
  if (!this.privateMode) {
    // Make sure string columns are strings
    if (typeof val1 != "string") {
      val1 = val1.toString();
    }
    if (typeof val2 != "string") {
      val2 = val2.toString();
    }
    if (typeof val3 != "string") {
      val3 = val3.toString();
    }
    this._store.storeEvent({
      event_code: eventCode,
      data1: val1,
      data2: val2,
      data3: val3,
      timestamp: Date.now()
    });
    /* This dump statement is for debugging and SHOULD be removed before
     * the study is released. */
    console.info("Recorded " + eventCode + ", " + val1 + ", " + val2 + ", "
         + val3 + "\n");
  }
};

WeekLifeStudyGlobalObserver.prototype.onAppStartup = function() {
  WeekLifeStudyGlobalObserver.superClass.onAppStartup.call(this);
  // TODO how can we tell if something has gone wrong with session restore?
  this.record(WeekEventCodes.BROWSER_START, "", "", "");
  console.info("Week in the life study got app startup message.");

  //RESTORE SESSION information, number of tabs and windows restored
  let stateObject = null;
  let sessionData;
  if (!this._sessionStartup) {
    this._sessionStartup = Cc["@mozilla.org/browser/sessionstartup;1"]
                  .getService(Ci.nsISessionStartup);
  }
  sessionData = this._sessionStartup.state;
  if (sessionData) {
    stateObject = JSON.parse(sessionData);
    let countWindows = 0;
    let countTabs = 0;
    stateObject.windows.forEach(function(aWinData, aIx) {
      countWindows = countWindows + 1;
      let winState = {
        ix: aIx
      };
      winState.tabs = aWinData.tabs.map(function(aTabData) {
        let entry = aTabData.entries[aTabData.index - 1] || { url: "about:blank" };
        return {
          parent: winState
        };
      });

      for each (var tab in winState.tabs){
        countTabs = countTabs + 1;
      }
    }, this);

    console.info("Session Restored: total windows: "+ countWindows
      + " total tabs: " +  countTabs);
    this.record(WeekEventCodes.SESSION_ON_RESTORE, "Windows " + countWindows,
                "Tabs " + countTabs, "");
  }
};

//WeekLifeStudyGlobalObserver.prototype.onAppShutdown = function() {
//  WeekLifeStudyGlobalObserver.superClass.onAppShutdown.call(this);
//  this.record();
//};

WeekLifeStudyGlobalObserver.prototype.onExperimentShutdown = function() {
  WeekLifeStudyGlobalObserver.superClass.onExperimentShutdown.call(this);
  if(totalRestoringTabs > 0) {
    //TODO: Check if it can be recorded before onExperimentShutdown
    console.info("Recording total restored tabs (SSTabRestoring): "
      + totalRestoringTabs);
    this.record(WeekEventCodes.SESSION_RESTORE, "Windows",
               "Tabs " + totalRestoringTabs, "");
    totalRestoringTabs = 0;
  }
  console.info("Week in the life: Shutting down subobservers.");
  this.stopAllObservers();
  // This check is to make sure nothing weird will happen if
  // onExperimentShutdown gets called more than once:
  if (this.obsService) {
    this.obsService.removeObserver(this, "quit-application", false);
    this.obsService = null;
  }
};

WeekLifeStudyGlobalObserver.prototype.onEnterPrivateBrowsing = function() {
  WeekLifeStudyGlobalObserver.superClass.onEnterPrivateBrowsing.call(this);
  console.info("Week in the Life: Got private browsing on message.");
  this.record(WeekEventCodes.PRIVATE_ON, "", "", "");
  this.stopAllObservers();
};

WeekLifeStudyGlobalObserver.prototype.onExitPrivateBrowsing = function() {
  WeekLifeStudyGlobalObserver.superClass.onExitPrivateBrowsing.call(this);
  console.info("Week in the Life: Got private browsing off message.");
  this.record(WeekEventCodes.PRIVATE_OFF, "", "", "");
  this.startAllObservers();
};

WeekLifeStudyGlobalObserver.prototype.onNewWindow = function(window) {
  WeekLifeStudyGlobalObserver.superClass.onNewWindow.call(this, window);
  SessionRestoreObserver.install(window);
};

WeekLifeStudyGlobalObserver.prototype.onWindowClosed = function(window) {
  WeekLifeStudyGlobalObserver.superClass.onWindowClosed.call(this, window);
  SessionRestoreObserver.uninstall(window);
};

// Instantiate and export the global observer (required!)
exports.handlers = new WeekLifeStudyGlobalObserver();

const COMPLETED_DATA_DISPLAY_HTML =   /* Note this is in past tense*/
    '<h4>Facts About Your Browser Use From <span id="usage-period-start-span"></span>\
    To <span id="usage-period-end-span"></span></h4>\
    <p><b>Browsing:</b> You have spent a total of <span id="total-use-time-span"></span>\
    hours actively using Firefox on that week. Firefox was running but \
    idle for a total of <span id="idle-time-span"></span> hours.</p>\
    <p><b>Bookmarks:</b> At the beginning of the week you had <span id="first-num-bkmks-span"></span>\
    bookmarks. At the end you had <span id="num-bkmks-span"></span> bookmarks in \
    <span id="num-folders-span"></span> folders, to a max folder depth of \
    <span id="max-depth-span"></span>.</p>\
    <p><b>Downloads:</b> You downloaded <span id="num-downloads"></span> files\
    during that period.</p>\
    <p><b>Extensions:</b> At the beginning of the week you had \
    <span id="first-num-extensions"></span> Firefox extensions installed.  \
    At the end you had <span id="num-extensions"></span> extensions installed.</p>\
    </div>';

// Web content
function WeekLifeStudyWebContent()  {
  WeekLifeStudyWebContent.baseConstructor.call(this, exports.experimentInfo);
}
BaseClasses.extend(WeekLifeStudyWebContent, BaseClasses.GenericWebContent);
WeekLifeStudyWebContent.prototype.__defineGetter__("dataViewExplanation",
  function() {
    return '<h4>Facts About Your Browser Use This Week</h4>\
    <p><b>Browsing:</b> You have spent a total of <span id="total-use-time-span"></span>\
     hours actively using Firefox this week. Firefox was running but \
    idle for a total of <span id="idle-time-span"></span> hours.</p>\
    <p><b>Bookmarks:</b> At the beginning of the week you had <span id="first-num-bkmks-span"></span>\
    bookmarks. Now you have <span id="num-bkmks-span"></span> bookmarks in \
    <span id="num-folders-span"></span> folders, to a max folder depth of \
    <span id="max-depth-span"></span>.</p>\
    <p><b>Downloads:</b> You downloaded <span id="num-downloads"></span> files\
    during this week.</p>\
    <p><b>Extensions:</b> At the beginning of the week you had \
    <span id="first-num-extensions"></span> Firefox extensions installed.  Now \
    you have <span id="num-extensions"></span> extensions installed.</p>\
    </div>';
  });

WeekLifeStudyWebContent.prototype.__defineGetter__("dataCanvas",
  function() {
      return this.rawDataLink +
      '<div class="dataBox">' +
      '<canvas id="data-canvas" width="500" height="300"></canvas>'
      + this.saveButtons +
      this.dataViewExplanation +'</div>';
  });
WeekLifeStudyWebContent.prototype.__defineGetter__("completedHtml",
  function() {
    return '<h2>A Week in the Life of a Browser</h2><p>Greetings!  The &quot;a week in the \
     life of a browser&quot; study has just completed!  The last step is to submit \
     the data. \
     You can <a onclick="showRawData(2);">click here to see</a> the complete raw \
     data set, just as it will be uploaded to Mozilla.</p>\
     <p>This test will automatically recur every 60 days for up to one year.\
     If you would prefer to have Test Pilot submit your data automatically next time, \
     instead of asking you, you can check the box below:<br/>\
     <input type="checkbox" id="always-submit-checkbox">\
     Automatically submit data for this test from now on<br/>\
     <div class="home_callout_continue"><img class="homeIcon" src="chrome://testpilot/skin/images/home_computer.png">\
     <span id="upload-status"><a onclick="uploadData();">Submit your data &raquo;</a>\
     </span></div><p>If you don\'t want to upload your data, please \
     <a href="chrome://testpilot/content/status-quit.html?eid=2">click here to quit</a>.</p>'
     + COMPLETED_DATA_DISPLAY_HTML;
  });

WeekLifeStudyWebContent.prototype.deleteDataOlderThanAWeek = function(store) {
  /* TODO: we're breaking encapsulation here because there's no public
   * method to do this on the data store object... this should be implemented
   * there. */
  let selectSql = "SELECT timestamp FROM " + store._tableName +
    " ORDER BY timestamp DESC LIMIT 1";
  let selectStmt = store._createStatement(selectSql);
  if (selectStmt.executeStep()) {
    let timestamp = selectStmt.row.timestamp;
    let cutoffDate = timestamp - (7 * 24 * 60 * 60 * 1000);
    let wipeSql = "DELETE FROM " + store._tableName +
      " WHERE timestamp < " + cutoffDate;
    let wipeStmt = store._createStatement(wipeSql);
    wipeStmt.execute();
    wipeStmt.finalize();
    console.info("Executed " + wipeSql);
  }
  selectStmt.finalize();
};

/* Produce bar chart using flot lobrary; ,
 * sorted, in a bar chart. */
// TODO this function is not using graphUtils (flot) at all!
// take advantage of flot to simplify this code.
WeekLifeStudyWebContent.prototype.onPageLoad = function(experiment,
                                                       document,
                                                       graphUtils) {
  // Get rid of old data so it doesn't pollute current submission
  this.deleteDataOlderThanAWeek(experiment.dataStore);
  experiment.getDataStoreAsJSON(function(rawData) {
    let bkmks, folders, depth;
    let browserUseTimeData = [];
    let bookmarksData = [];
    let addonsData = [];
    let firstTimestamp = 0;
    let maxBkmks = 0;
    let totalUseTime = 0;
    let idleTime = 0;
    let numDownloads = 0;
    let numAddons = 0;
    let rowNum;

    for each ( let row in rawData ) {
      if (firstTimestamp == 0 ) {
       firstTimestamp = row.timestamp;
      }
      switch(row.event_code) {
        case WeekEventCodes.BROWSER_START:
          browserUseTimeData.push( [row.timestamp, 2]);
          // TODO treat this as a crash if there was no shutdown first!
          // what is the logic for that, though?
        break;
        case WeekEventCodes.BROWSER_SHUTDOWN:
          browserUseTimeData.push( [row.timestamp, 0]);
        break;
        case WeekEventCodes.BROWSER_ACTIVATE:
          browserUseTimeData.push( [row.timestamp, 2]);
        break;
        case WeekEventCodes.BROWSER_INACTIVE:
          browserUseTimeData.push( [row.timestamp, 1]);
        break;
        case WeekEventCodes.BOOKMARK_STATUS:
          bkmks = parseInt(row.data1);
          folders = parseInt(row.data2);
          depth = parseInt(row.data3);
          bookmarksData.push( [row.timestamp, bkmks] );
        break;
        case WeekEventCodes.BOOKMARK_CREATE:
          switch (row.data1) {
            case BMK_TYPE_BOOKMARK:
              bkmks += 1;
              bookmarksData.push( [row.timestamp, bkmks] );
            break;
            case BMK_TYPE_FOLDER:
              folders += 1;
            break;
          }
        break;
          // TODO bookmark remove!
        case WeekEventCodes.DOWNLOAD:
          numDownloads += 1;
        break;
        case WeekEventCodes.ADDON_STATUS:
          numAddons = parseInt(row.data1);
          addonsData.push( [row.timestamp, numAddons] );
          break;
        case WeekEventCodes.ADDON_INSTALL:
          numAddons += 1;
          addonsData.push( [row.timestamp, numAddons] );
          break;
        case WeekEventCodes.ADDON_UNINSTALL:
          switch (row.data1) {
            case UNINSTALL_DONE:
              numAddons -= 1;
            break;
            case UNINSTALL_CANCELLED:
              numAddons += 1;
            break;
          }
          addonsData.push( [row.timestamp, numAddons] );
          break;
      }
      if (bkmks > maxBkmks) {
        maxBkmks = bkmks;
      }
    }
    // use the end time from the last record if the status is STATUS_FINISHED or
    // above.
    let lastTimestamp;
    if (rawData.length > 0 && (experiment.status >= 4)) {
      lastTimestamp = rawData[(rawData.length - 1)].timestamp;
    } else {
      lastTimestamp = (new Date()).getTime();
    }
    browserUseTimeData.push( [lastTimestamp, 2] );
    bookmarksData.push([lastTimestamp, bkmks]);

    let canvas = document.getElementById("data-canvas");
    let ctx = canvas.getContext("2d");

    let boundingRect = { originX: 40,
                         originY: 210,
                         width: 500,
                         height: 300 };
    let xScale = boundingRect.width / (lastTimestamp - firstTimestamp);
    console.log("xScale is " + xScale );
    ctx.fillStyle = "white";
    ctx.fillRect (0, 0, 500, 300);

    //Draw colored bar - orange for using the browser, yellow for running
    // but not being used, white for no use.
    for (rowNum = 0; rowNum < browserUseTimeData.length - 1; rowNum++) {
      let row = browserUseTimeData[rowNum];
      let nextRow = browserUseTimeData[rowNum + 1];
      let timeLength = nextRow[0] - row[0];
      let x = xScale * ( row[0] - firstTimestamp );
      let width = xScale * timeLength;
      switch( row[1]) {
      case 0:
        continue;
      case 1:
        idleTime += timeLength;
        ctx.fillStyle = "yellow";
      break;
      case 2:
        totalUseTime += timeLength;
        ctx.fillStyle = "orange";
      break;
      }
      ctx.fillRect(x, 180, width, 50);
    }
    // Add legend to explain colored bar:
    ctx.strokeStyle ="black";
    ctx.fillStyle = "orange";
    ctx.fillRect(5, 235, 15, 15);
    ctx.strokeRect(5, 235, 15, 15);
    ctx.fillStyle = "yellow";
    ctx.fillRect(5, 255, 15, 15);
    ctx.strokeRect(5, 255, 15, 15);
    ctx.fillStyle = "grey";
    ctx.save();
    ctx.translate(25, 250);
    ctx.mozDrawText("= Firefox actively running");
    ctx.restore();
    ctx.save();
    ctx.translate(25, 270);
    ctx.mozDrawText("= Firefox running but idle");
    ctx.restore();

    // Draw line to show bookmarks over time:
    let bkmkYScale = boundingRect.height / (maxBkmks * 2);
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    for (rowNum = 0; rowNum < bookmarksData.length; rowNum++) {
      let row = bookmarksData[rowNum];
      if (rowNum == 0) {
        ctx.moveTo(xScale * (row[0] - firstTimestamp),
                   (boundingRect.height/2) - bkmkYScale * row[1] + 10);
      } else {
        ctx.lineTo(xScale * (row[0] - firstTimestamp),
                   (boundingRect.height/2) - bkmkYScale * row[1] + 10);
      }
    }
    ctx.stroke();
    // Label starting and finishing bookmarks:
    ctx.mozTextStyle = "10pt sans serif";
    ctx.fillStyle = "grey";
    ctx.save();
    ctx.translate(5, (boundingRect.height/2) -
                  bkmkYScale * bookmarksData[0][1] + 25);
    ctx.mozDrawText(bookmarksData[0][1] + " bookmarks");
    ctx.restore();
    ctx.save();
    let lastNumBkmks = bookmarksData[bookmarksData.length -1][1];
    ctx.translate(boundingRect.width - 80,
                  (boundingRect.height/2) - bkmkYScale * lastNumBkmks + 25);
    ctx.mozDrawText(lastNumBkmks + " bookmarks");
    ctx.restore();

    // Add scale with dates on it
    let firstDay = new Date(firstTimestamp);
    console.info("Beginning date is " + firstDay.toString());
    console.info("Ending date is " + (new Date(lastTimestamp)).toString());
    firstDay.setDate( firstDay.getDate() + 1 );
    firstDay.setHours(0);
    firstDay.setMinutes(0);
    firstDay.setSeconds(0);
    firstDay.setMilliseconds(0);
    ctx.fillStyle = "grey";
    ctx.strokeStyle = "grey";
    let dayMarker = firstDay;
    let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    while (dayMarker.getTime() < lastTimestamp) {
      let x = xScale * (dayMarker.getTime() - firstTimestamp);
      ctx.beginPath();
      ctx.moveTo(x, 5);
      ctx.lineTo(x, boundingRect.height - 5);
      ctx.stroke();
      ctx.save();
      ctx.translate(x + 5, 295);
      ctx.mozDrawText(days[dayMarker.getDay()] + " " + dayMarker.getDate());
      ctx.restore();
      dayMarker.setDate( dayMarker.getDate() + 1 );
    }

    // Fill in missing values from html paragraphs:
    let getHours = function(x) {
      return Math.round( x / 36000 ) / 100;
    };
    let getFormattedDateString = function(timestamp) {
      let date = new Date(timestamp);
      let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
                  "Sep", "Oct", "Nov", "Dec"];
      return months[date.getMonth()] + " " + date.getDate() + ", "
        + date.getFullYear();
    };
    let startSpan = document.getElementById("usage-period-start-span");
    let endSpan = document.getElementById("usage-period-end-span");
    if (startSpan) {
      startSpan.innerHTML = getFormattedDateString(firstTimestamp);
    }
    if (endSpan) {
      endSpan.innerHTML = getFormattedDateString(lastTimestamp);
    }
    document.getElementById("first-num-bkmks-span").innerHTML = bookmarksData[0][1];
    document.getElementById("num-bkmks-span").innerHTML = bkmks;
    document.getElementById("num-folders-span").innerHTML = folders;
    document.getElementById("max-depth-span").innerHTML = depth;
    document.getElementById("num-downloads").innerHTML = numDownloads;
    document.getElementById("first-num-extensions").innerHTML = addonsData[0][1];
    document.getElementById("num-extensions").innerHTML = numAddons;
    document.getElementById("total-use-time-span").innerHTML = getHours(totalUseTime);
    document.getElementById("idle-time-span").innerHTML = getHours(idleTime);
  });
};

exports.webContent = new WeekLifeStudyWebContent();

// Cleanup
require("unload").when(
  function myDestructor() {
    console.info("WeekLife study destructor called.");
    exports.handlers.onExperimentShutdown();
  });
