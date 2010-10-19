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
  bmsvc: null,

  install: function() {
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
    exports.handlers.record(WeekEventCodes.BOOKMARK_STATUS,
                            totalBookmarks + " total bookmarks",
                            totalFolders + " folders",
                            "folder depth " + greatestDepth);
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
          exports.handlers.record(WeekEventCodes.BOOKMARK_CREATE,
                                  "New Bookmark Added");
        break;
        case this.bmsvc.TYPE_FOLDER:
          exports.handlers.record(WeekEventCodes.BOOKMARK_CREATE,
                                  "New Bookmark Folder");
        break;
      }
    }
  },

  onItemRemoved: function(itemId, parentId, index, type) {
    let folderId = this.bmsvc.getFolderIdForItem(itemId);
    if (!this.lmsvc.isLivemark(folderId)) {
      exports.handlers.record(WeekEventCodes.BOOKMARK_MODIFY,
                              "Bookmark Removed");
    }
  },

  onItemChanged: function(bookmarkId, property, isAnnotation,
                          newValue, lastModified, type) {
    // This gets called with almost every add, remove, or visit; it's too
    // much info, so we're not going to track it for now.
    /*let folderId = this.bmsvc.getFolderIdForItem(bookmarkId);
    if (!this.lmsvc.isLivemark(folderId)) {
      exports.handlers.record(WeekEventCodes.BOOKMARK_MODIFY, [BMK_MOD_CHANGED]);
      console.info("Bookmark modified!");
    }*/
  },

  onItemVisited: function(bookmarkId, visitId, time) {
    // This works.
    exports.handlers.record(WeekEventCodes.BOOKMARK_CHOOSE);
  },

  onItemMoved: function(itemId, oldParentId, oldIndex, newParentId,
                        newIndex, type) {
    exports.handlers.record(WeekEventCodes.BOOKMARK_MODIFY,
                            "Bookmark Moved");
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
  idleService: null,
  lastSelfPing: 0,
  selfPingTimer: null,
  selfPingInterval: 300000, // Five minutes

  install: function() {
    if (!this.alreadyInstalled) {
      console.info("Adding idleness observer.");
      this.idleService = Cc["@mozilla.org/widget/idleservice;1"]
       .getService(Ci.nsIIdleService);
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
        exports.handlers.record(WeekEventCodes.BROWSER_INACTIVE,
                                "Self-ping timer", "", "", estimatedStop);
        exports.handlers.record(WeekEventCodes.BROWSER_ACTIVATE,
                                "Self-ping timer");
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
      exports.handlers.record(WeekEventCodes.BROWSER_INACTIVE,
                              "IdleService observer", "", "", idleTime);
      if (this.selfPingTimer) {
        this.selfPingTimer.cancel();
      }
    }
    if (topic == 'back') {
      console.info("User is back! Was idle for " + data + " milliseconds.");
      exports.handlers.record(WeekEventCodes.BROWSER_ACTIVATE,
                              "IdleService observer");
      this.lastSelfPing = Date.now();
      this.pingSelf();
    }
  }
};

var ExtensionObserver = {
  alreadyInstalled: false,

  install: function() {
    if (!this.alreadyInstalled) {
      let self = this;
      AddonManager.addInstallListener(self.instalListener);
      AddonManager.addAddonListener(self.addonListener);
      this.alreadyInstalled = true;
    }
  },

  instalListener : {
    onInstallEnded : function (aInstall, aAddon) {
      console.info("onInstallEnded!");
        // TODO is there a reason we're recording names and IDs on uninstall
      // but not on install?
      if ("extension" == aAddon.type){
        exports.handlers.record(WeekEventCodes.ADDON_INSTALL);
        console.info("An extension was installed!");
      }
    }
  },

  addonListener : {
    onUninstalling: function(aAddon) {
      if ("extension" == aAddon.type){
        exports.handlers.record(WeekEventCodes.ADDON_UNINSTALL,
                                "Uninstall Done", "addon name: " + aAddon.name,
                                  "addon id: " + aAddon.id);
        console.info(aAddon.name +
                     " will be uninstalled after the application restarts.!");
      }
    },

    onOperationCancelled: function(aAddon) {
      //PENDING_NONE: 0
      if ("extension" == aAddon.type && 0 == aAddon.pendingOperations) {
          exports.handlers.record(WeekEventCodes.ADDON_UNINSTALL,
                                  "Uninstall Canceled",
                                  "addon name: " + aAddon.name,
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
      exports.handlers.record(WeekEventCodes.ADDON_STATUS,
                              numberActive + " active",
                              numberInactive + " inactive");
    });
  }
};

var DownloadsObserver = {
  alreadyInstalled: false,
  downloadManager: null,

  install: function() {
    if (!this.alreadyInstalled) {
      console.info("Adding downloads observer.");
      this.obsService = Cc["@mozilla.org/observer-service;1"]
                           .getService(Ci.nsIObserverService);
      this.obsService.addObserver(this, "dl-done", false);

      /*this.downloadManager = Cc["@mozilla.org/download-manager;1"]
                   .getService(Ci.nsIDownloadManager);
      this.downloadManager.addListener(this);*/
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
      exports.handelrs.record(WeekEventCodes.DOWNLOAD);
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
  memoryManager: null,
  memoryInfoTimer: null,
  timerInterval: 600000, // Ten minutes

   install: function() {
    if (!this.alreadyInstalled) {
      console.info("Adding memory observer.");

      this.memoryManager = Cc["@mozilla.org/memory-reporter-manager;1"]
        .getService(Components.interfaces.nsIMemoryReporterManager);

      this.memoryInfoTimer = Components.classes["@mozilla.org/timer;1"]
        .createInstance(Components.interfaces.nsITimer);

      //Get Memory info on startup
      this.getMemoryInfo();
      let self = this;
      this.memoryInfoTimer.initWithCallback(function(){self.getMemoryInfo();}
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
    while (enumRep.hasMoreElements()) {
      let mr = enumRep.getNext().QueryInterface(Ci.nsIMemoryReporter);
      exports.handlers.record(WeekEventCodes.MEMORY_USAGE,
                              mr.path, mr.memoryUsed);
    }
  }
};


function WeekLifeStudyWindowObserver(window, globalInstance) {
  WeekLifeStudyWindowObserver.baseConstructor.call(this, window, globalInstance);
}
BaseClasses.extend(WeekLifeStudyWindowObserver,
                   BaseClasses.GenericWindowObserver);
WeekLifeStudyWindowObserver.prototype.install = function() {
  this.totalTabsRestored = 0;
  let self = this;
//TODO: Check if it is better to add a listener to Restore btn (id:errorTryAgain)
  //Add total restored windows.

  this._listen(this.window.document, "SSTabRestoring",
               function() {self.increaseTabCounter();},
               false);
};

WeekLifeStudyWindowObserver.prototype.increaseTabCounter = function() {
  this.totalRestoringTabs += 1;
  console.info("Current Total Restoring Tabs: " + totalRestoringTabs);
};


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
              "browser.startup.page", prefValue);

  prefBranch = prefs.getBranch("browser.sessionstore.");

  prefValue = prefBranch.getBoolPref("resume_from_crash");
  this.record(WeekEventCodes.SESSION_RESTORE_PREFERENCES,
              "browser.sessionstore.resume_from_crash", prefValue);

  prefValue = prefBranch.getBoolPref("resume_session_once");
  this.record(WeekEventCodes.SESSION_RESTORE_PREFERENCES,
              "browser.sessionstore.resume_session_once", prefValue);

  prefValue = prefBranch.getIntPref("max_resumed_crashes");
  this.record(WeekEventCodes.SESSION_RESTORE_PREFERENCES,
              "browser.sessionstore.max_resumed_crashes", prefValue);
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
      this.record(WeekEventCodes.BROWSER_SHUTDOWN);
    } else if (data == "restart") {
      this.record(WeekEventCodes.BROWSER_RESTART);
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
                                                        val3, timestamp) {
  // Make sure string columns are strings
  if (!val1) {
    val1 = "";
  } else if (typeof val1 != "string") {
    val1 = val1.toString();
  }
  if (!val2) {
    val2 = "";
  } else if (typeof val2 != "string") {
    val2 = val2.toString();
  }
  if (!val3) {
    val3 = "";
  } else if (typeof val3 != "string") {
    val3 = val3.toString();
  }
  if (!timestamp) {
    timestamp = Date.now();
  }
  WeekLifeStudyGlobalObserver.superClass.record.call(this,
  {
    event_code: eventCode,
    data1: val1,
    data2: val2,
    data3: val3,
    timestamp: timestamp
  });
  /* This dump statement is for debugging and SHOULD be removed before
   * the study is released. */
  dump("Recorded " + eventCode + ", " + val1 + ", " + val2 + ", "
       + val3 + "\n");
};

WeekLifeStudyGlobalObserver.prototype.onAppStartup = function() {
  WeekLifeStudyGlobalObserver.superClass.onAppStartup.call(this);
  // TODO how can we tell if something has gone wrong with session restore?
  this.record(WeekEventCodes.BROWSER_START);
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
                "Tabs " + countTabs);
  }
};

//WeekLifeStudyGlobalObserver.prototype.onAppShutdown = function() {
//  WeekLifeStudyGlobalObserver.superClass.onAppShutdown.call(this);
//  this.record();
//};

WeekLifeStudyGlobalObserver.prototype.onExperimentShutdown = function() {
  // Record total number of tabs (collect from individual window observers)
  // before killing the window observers:
  let totalRestoringTabs = 0;
  for (let i = 0; i < this._windowObservers.length; i++) {
    totalRestoringTabs += this._windowObservers[i].totalRestoringTabs;
  }
  //TODO: Check if it can be recorded before onExperimentShutdown

  // TODO isn't this redundant with the number of windows and tabs as
  // recorded in the onAppStartup handler??

  this.record(WeekEventCodes.SESSION_RESTORE, "Windows",
              "Tabs " + totalRestoringTabs);

  WeekLifeStudyGlobalObserver.superClass.onExperimentShutdown.call(this);
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
  this.record(WeekEventCodes.PRIVATE_ON);
  this.stopAllObservers();
};

WeekLifeStudyGlobalObserver.prototype.onExitPrivateBrowsing = function() {
  WeekLifeStudyGlobalObserver.superClass.onExitPrivateBrowsing.call(this);
  this.record(WeekEventCodes.PRIVATE_OFF);
  this.startAllObservers();
};

// Instantiate and export the global observer (required!)
exports.handlers = new WeekLifeStudyGlobalObserver();

// Web content
function WeekLifeStudyWebContent()  {
  WeekLifeStudyWebContent.baseConstructor.call(this, exports.experimentInfo);
}
BaseClasses.extend(WeekLifeStudyWebContent, BaseClasses.GenericWebContent);
WeekLifeStudyWebContent.prototype.__defineGetter__("dataViewExplanation",
  function() {
  // TODO customize this text a little bit, e.g. "extensions" and "files"
  // should become singular if there was only one.  "Now" should be replaced
    // by "at the end of the week" if the study is over.
    return '<h4>Facts About Your Browser Use From <span id="usage-period-start-span"></span>\
    To <span id="usage-period-end-span"></span></h4>\
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
      return this.rawDataLink + '<div class="dataBox">' +
      '<canvas id="data-canvas" width="500" height="300"></canvas>' +
      this.saveButtons + this.dataViewExplanation +'</div>';
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
          depth = parseInt(row.data3); // TODO this is getting NaN
          bookmarksData.push( [row.timestamp, bkmks] );
        break;
        case WeekEventCodes.BOOKMARK_CREATE:
          switch (row.data1) {
            case "New Bookmark Added":
            /* TODO string concat bug happening here?  Recorded as:
             *     exports.handlers.record(WeekEventCodes.BOOKMARK_STATUS,
                            totalBookmarks + " total bookmarks",
                            totalFolders + " folders",
                            "folder depth " + greatestDepth);
             */
              bkmks += 1;
              bookmarksData.push( [row.timestamp, bkmks] );
            break;
            case "New Bookmark Folder":
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
            case "Uninstall Done":
              numAddons -= 1;
            break;
            case "Uninstall Canceled":
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
