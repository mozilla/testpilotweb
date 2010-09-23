/* Basic panel experiment */
BaseClasses = require("study_base_classes.js");


exports.experimentInfo = {
  startDate: null,
  duration: 7,
  testName: "A Week in the Life of a Browser",
  testId: 2,
  testInfoUrl: "https://testpilot.mozillalabs.com/testcases/a-week-life.html",
  summary: "This auto-recurring study aims to explore larger trends of how "
           + "the browser is being used over time. It will periodically collect "
           + "data on the browser's basic performance for one week, running "
           + "the same study again every 60 days, through Dec. 2009 to "
           + "Dec.2010.",
  thumbnail: "https://testpilot.mozillalabs.com/testcases/a-week-life/week-life-thumbnail.png",
  optInRequired: false,
  recursAutomatically: true,
  recurrenceInterval: 60,
  versionNumber: 5
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
    this.store.rec(WeekEventCodes.BOOKMARK_STATUS,
                   [totalBookmarks, totalFolders, greatestDepth]);
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
      console.info("Bookmark added.");
      this.store.rec(WeekEventCodes.BOOKMARK_CREATE, []);
    }
  },

  onItemRemoved: function(itemId, parentId, index, type) {
    let folderId = this.bmsvc.getFolderIdForItem(itemId);
    if (!this.lmsvc.isLivemark(folderId)) {
      this.store.rec(WeekEventCodes.BOOKMARK_MODIFY, [BMK_MOD_REMOVED]);
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
    this.store.rec(WeekEventCodes.BOOKMARK_CHOOSE, []);
    console.info("Bookmark visited!");
  },

  onItemMoved: function(itemId, oldParentId, oldIndex, newParentId,
                        newIndex, type) {
    this.store.rec(WeekEventCodes.BOOKMARK_MODIFY, [BMK_MOD_MOVED]);
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
        self.store.rec(WeekEventCodes.BROWSER_ACTIVATE, [1]);
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
      console.info("User is back!  Was idle for " + data + " milliseconds.");
      this.store.rec(WeekEventCodes.BROWSER_ACTIVATE, [2]);
      this.lastSelfPing = Date.now();
      this.pingSelf();
    }
  }
};

var ExtensionObserver = {
  alreadyInstalled: false,
  store: null,
  obsService: null,

  install: function(store) {
    if (!this.alreadyInstalled) {
      console.info("Adding extension observer.");
      this.obsService = Cc["@mozilla.org/observer-service;1"]
                           .getService(Ci.nsIObserverService);
      this.obsService.addObserver(this, "em-action-requested", false);
      this.store = store;
      this.alreadyInstalled = true;
    }
  },

  uninstall: function() {
    if (this.alreadyInstalled) {
      this.obsService.removeObserver(this, "em-action-requested");
      this.alreadyInstalled = false;
    }
  },

  observe: function(subject, topic, data) {
    // TODO I seem to get two disable notifications, no enable notification.. weird.
    // I also get doubled-up uninstall notification.
    if (data == "item-installed") {
      this.store.rec(WeekEventCodes.ADDON_INSTALL, []);
      console.info("An extension was installed!");
    } else if (data == "item-upgraded") {
      console.info("An extension was upgraded!");
    } else if (data == "item-uninstalled") {
      this.store.rec(WeekEventCodes.ADDON_UNINSTALL, []);
      console.info("An extension was uninstalled!");
    } else if (data == "item-enabled") {
      // TODO record something here?
      console.info("An extension was enabled!");
    } else if (data == "item-disabled") {
      // TODO record something here?
      console.info("An extension was disabled!");
    }
  },

  runGlobalAddonsQuery: function () {
    // TODO record number of active and inactive extensions.
/*
    let extManager = Cc["@mozilla.org/extensions/manager;1"]
                       .getService(Ci.nsIExtensionManager);
    let nsIUpdateItem = Ci.nsIUpdateItem;
    let numberActive;
    let numberInactive;
    let items = extManager.getItemList(nsIUpdateItem.TYPE_EXTENSION,{});
    // Note we can also pass in TYPE_THEME, TYPE_LOCALE, or TYPE_ADDON here
    // besides TYPE_EXTENSION.
    for (var i = 0; i < items.length; ++i) {
      // TODO how to detect that addon is disabled???
    }
    numberActive = items.length;
    numberInactive = 0;
    console.info("Recording extensions: " + numberActive);
    this.store.rec(WeekEventCodes.ADDON_STATUS, [numberActive, numberInactive]);
*/
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
      this.store.rec(WeekEventCodes.DOWNLOAD, []);
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

exports.handlers = {
  _dataStore: null,
  obsService: null,
  _sessionStartup: null,
  
  _recordPluginInfo: function() {
    // Copied from about:plugins
    let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
      .getService(Ci.nsIWindowMediator);
    
    let frontWindow = wm.getMostRecentWindow("navigator:browser");
    let plugins = frontWindow.navigator.plugins;
    plugins.refresh(false);
    let now = Date.now();
    for (let i = 0; i < plugins.length; i++) {
      let plugin = plugins[i];
      if (plugin) {
        console.info("Plugin Name: "+ plugin.filename + " Version: " + plugin.version);
        this._dataStore.storeEvent({ event_code: WeekEventCodes.PLUGIN_VERSION,
          data1: plugin.filename, data2: plugin.version, data3: "",
          timestamp: now});
      }
    }
  },
  
  _recordNavHistory: function() {
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
    
    console.info("Total History Places: "+ totalPlaces);
    this._dataStore.storeEvent({ event_code: WeekEventCodes.HISTORY_STATUS,
                        data1: "" + totalPlaces, data2: "", data3: "",
                        timestamp: Date.now()});
  },
  
  _recordProfileAge: function() {
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
     console.info("Profile Age: "+ oldestCreationTime + " milliseconds");
     this._dataStore.storeEvent({ event_code: WeekEventCodes.PROFILE_AGE,
                        data1: "" + oldestCreationTime, data2: "", data3: "",
                        timestamp: Date.now()});
  },
  
  _recordSessionStorePrefs : function () {
    let prefs = Cc["@mozilla.org/preferences-service;1"]
      .getService(Ci.nsIPrefService);

    let prefBranch = prefs.getBranch("browser.startup.");
    let prefValue = prefBranch.getIntPref("page");
    //browser.startup.page 0: blank page, 1: homepage, 3: previous session
    this._dataStore.storeEvent({
      event_code: WeekEventCodes.SESSION_RESTORE_PREFERENCES,
      data1: "browser.startup.page", data2: "" + prefValue,
      data3: "", timestamp: Date.now()});
    console.info("browser.startup.page: " + prefValue);

    prefBranch = prefs.getBranch("browser.sessionstore.");
 
    prefValue = prefBranch.getBoolPref("resume_from_crash");
    this._dataStore.storeEvent({
      event_code: WeekEventCodes.SESSION_RESTORE_PREFERENCES,
      data1: "browser.sessionstore.resume_from_crash", data2: "" + prefValue,
      data3: "", timestamp: Date.now()});
    console.info("browser.sessionstore.resume_from_crash: " + prefValue);

    prefValue = prefBranch.getBoolPref("resume_session_once");
    this._dataStore.storeEvent({
      event_code: WeekEventCodes.SESSION_RESTORE_PREFERENCES,
      data1: "browser.sessionstore.resume_session_once", data2: "" + prefValue,
      data3: "", timestamp: Date.now()});
    console.info("browser.sessionstore.resume_session_once: "+ prefValue);

    prefValue = prefBranch.getIntPref("max_resumed_crashes");
    this._dataStore.storeEvent({
      event_code: WeekEventCodes.SESSION_RESTORE_PREFERENCES,
      data1: "browser.sessionstore.max_resumed_crashes", data2: "" + prefValue,
      data3: "", timestamp: Date.now()});
    console.info("browser.sessionstore.max_resumed_crashes: "+ prefValue);
  },

  // for handlers API:
  onNewWindow: function(window) {
    SessionRestoreObserver.install(window);
  },

  onWindowClosed: function(window) {
    SessionRestoreObserver.uninstall(window);
  },

  onAppStartup: function() {
    // TODO how can we tell if something has gone wrong with session restore?
    this._dataStore.rec(WeekEventCodes.BROWSER_START, []);
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
      this._dataStore.storeEvent({ event_code: WeekEventCodes.SESSION_ON_RESTORE,
                        data1: "Windows " + countWindows,
                        data2: "Tabs " + countTabs, data3: "",
                        timestamp: Date.now()});
    }
  },

  onAppShutdown: function() {
    // Nothing to do
  },

  onExperimentStartup: function(store) {
    // Attatch a convenience method to the data store object:
    store.rec = function(eventCode, data) {
      store.storeEvent({ event_code: eventCode,
                         data1: (data[0]) ? ("" + data[0]) : "",
                         data2: (data[1]) ? ("" + data[1]) : "",
                         data3: (data[2]) ? ("" + data[2]) : "",
                         timestamp: Date.now()});
    };
    this._dataStore = store;
    // Record the version of this study at startup: this lets us see
    // what data was recorded before and after an update, which lets us
    // know whether any given data included a given bug-fix or not.
    store.rec(WeekEventCodes.STUDY_STATUS,
              [exports.experimentInfo.versionNumber]);
    
    this._recordPluginInfo();
    //Record navigation history
    this._recordNavHistory();
    //Record oldest file in profile
    this._recordProfileAge();
    //Record session store main preferences
    this._recordSessionStorePrefs();

    console.info("Week in the life: Starting subobservers.");
    this._startAllObservers();
    BookmarkObserver.runGlobalBookmarkQuery();
    ExtensionObserver.runGlobalAddonsQuery();
    this.obsService = Cc["@mozilla.org/observer-service;1"]
                           .getService(Ci.nsIObserverService);
    this.obsService.addObserver(this, "quit-application", false);
  },

  onExperimentShutdown: function() {
    if(totalRestoringTabs > 0) {
      //TODO: Check if it can be recorded before onExperimentShutdown
      console.info("Recording total restored tabs (SSTabRestoring): "
        + totalRestoringTabs);
      this._dataStore.storeEvent({ event_code: WeekEventCodes.SESSION_RESTORE,
        data1: "Windows" , data2: "Tabs " + totalRestoringTabs, data3: "",
        timestamp: Date.now()});
      totalRestoringTabs = 0;
    }
    console.info("Week in the life: Shutting down subobservers.");
    this._stopAllObservers();
    // This check is to make sure nothing weird will happen if
    // onExperimentShutdown gets called more than once:
    if (this.obsService) {
      this.obsService.removeObserver(this, "quit-application", false);
      this.obsService = null;
    }
  },

  onEnterPrivateBrowsing: function() {
    console.info("Week in the Life: Got private browsing on message.");
    this._dataStore.rec(WeekEventCodes.PRIVATE_ON, []);
    this._stopAllObservers();
  },

  onExitPrivateBrowsing: function() {
    console.info("Week in the Life: Got private browsing off message.");
    this._dataStore.rec(WeekEventCodes.PRIVATE_OFF, []);
    this._startAllObservers();
  },

  _startAllObservers: function() {
    BookmarkObserver.install(this._dataStore);
    IdlenessObserver.install(this._dataStore);
    ExtensionObserver.install(this._dataStore);
    DownloadsObserver.install(this._dataStore);
    MemoryObserver.install(this._dataStore);
  },

  _stopAllObservers: function() {
    BookmarkObserver.uninstall();
    IdlenessObserver.uninstall();
    ExtensionObserver.uninstall();
    DownloadsObserver.uninstall();
    MemoryObserver.uninstall();
  },

  observe: function(subject, topic, data) {
    if (topic == "quit-application") {
      if (data == "shutdown") {
        this._dataStore.rec(WeekEventCodes.BROWSER_SHUTDOWN, []);
        console.info("Week in the Life study got shutdown message.");
      } else if (data == "restart") {
        this._dataStore.rec(WeekEventCodes.BROWSER_RESTART, []);
        console.info("Week in the Life study got startup message.");
      }
    }
  }
};

require("unload").when(
  function myDestructor() {
    exports.handlers.onExperimentShutdown();
  });

const FINE_PRINT = '<p><b>The Fine Print:</b> All test data you submit will be anonymized and will not be \
personally identifiable.  We do not collect any URLs that you visit, search terms \
that you enter, or sites that you bookmark.  The uploaded test data is annotated \
with your locale settings, Firefox version, Test Pilot version, operating system \
version, and any survey answers you have provided.';

const IN_PROGRESS_DATA_DISPLAY_HTML =
   '<canvas id="browser-use-time-canvas" width="500" height="300"></canvas>\
    <button type="button" onclick="saveCanvas(document.getElementById(\'browser-use-time-canvas\'))">Save Graph</button>\
    <div class="dataBox">\
    <h4>Facts About Your Browser Use This Week</h4>\
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

const COMPLETED_DATA_DISPLAY_HTML =
   '<canvas id="browser-use-time-canvas" width="500" height="300"></canvas>\
    <button type="button" onclick="saveCanvas(document.getElementById(\'browser-use-time-canvas\'))">Save Graph</button>\
    <div class="dataBox">\
    <h4>Facts About Your Browser Use From <span id="usage-period-start-span"></span>\
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

exports.webContent = {
  inProgressHtml:
    '<h2>A Week in the Life of a Browser</h2>\
     <p>Thank you for joining the Test Pilot program!  You are currently in \
     a study designed to help us understand "A Week in the Life of a Browser"!\
     By participating in this study, you will contribute to the\
     design of a group of key features of Firefox, including bookmarks,\
     search, and downloads. You will help us understand what features are used \
     often and how trends in their use are changing over time.</p>\
     <p>There is no need to do anything differently; just browse normally, and Test \
     Pilot will record certain key events.  Don\'t worry: we never record any \
     URLs that are loaded or restored, or any words typed in the search bar.\
     You can <a onclick="showRawData(2);">click here to see</a> exactly what data \
     has been collected, or check out the graphs below for a summary.</p>\
     <p>The study will end <span id="test-end-time"></span>. If you don\'t want to \
     participate, please <a href="chrome://testpilot/content/status-quit.html?eid=2">\
     click here to quit</a>.</p>\
     <p>Otherwise, buckle up and get ready for the flight!</p>'
     + IN_PROGRESS_DATA_DISPLAY_HTML + FINE_PRINT,
  completedHtml:
    '<h2>A Week in the Life of a Browser</h2><p>Greetings!  The &quot;a week in the \
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
     + COMPLETED_DATA_DISPLAY_HTML + FINE_PRINT,
  upcomingHtml: "<h2>A Week in the Life of a Browser</h2><p>Upcoming...</p>",

  remainDataHtml: "<h3>Collected Data:</h3>" + COMPLETED_DATA_DISPLAY_HTML,

  _deleteDataOlderThanAWeek: function(dataStore) {
    /* TODO: we're breaking encapsulation here because there's no public
     * method to do this on the data store object... this should be implemented
     * there. */
    let selectSql = "SELECT timestamp FROM " + dataStore._tableName +
      " ORDER BY timestamp DESC LIMIT 1";
    let selectStmt = dataStore._createStatement(selectSql);
    if (selectStmt.executeStep()) {
      let timestamp = selectStmt.row.timestamp;
      let cutoffDate = timestamp - (7 * 24 * 60 * 60 * 1000);
      let wipeSql = "DELETE FROM " + dataStore._tableName +
        " WHERE timestamp < " + cutoffDate;
      let wipeStmt = dataStore._createStatement(wipeSql);
      wipeStmt.execute();
      wipeStmt.finalize();
      console.info("Executed " + wipeSql);
    }
    selectStmt.finalize();
  },

  onPageLoad: function(experiment, document, graphUtils) {
    // Get rid of old data so it doesn't pollute current submission
    this._deleteDataOlderThanAWeek(experiment.dataStore);

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
          bkmks = row.data1;
          folders = row.data2;
          depth = row.data3;
          bookmarksData.push( [row.timestamp, bkmks] );
        break;
        case WeekEventCodes.BOOKMARK_CREATE:
          bkmks += 1;
          bookmarksData.push( [row.timestamp, bkmks] );
        break;
          // TODO bookmark remove!
        case WeekEventCodes.DOWNLOAD:
          numDownloads += 1;
        break;
        case WeekEventCodes.ADDON_STATUS:
          numAddons = row.data1;
          addonsData.push( [row.timestamp, numAddons] );
          break;
        case WeekEventCodes.ADDON_INSTALL:
          numAddons += 1;
          addonsData.push( [row.timestamp, numAddons] );
          break;
          // TODO add-on uninstall!
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

      let canvas = document.getElementById("browser-use-time-canvas");
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
  }
};