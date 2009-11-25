/* Basic panel experiment */
const TYPE_INT_32 = 0;
const TYPE_DOUBLE = 1;

exports.experimentInfo = {
  startDate: null,
  duration: 7,
  testName: "A Week in the Life of a Browser",
  testId: 2,
  testInfoUrl: "https://testpilot.mozillalabs.com/testcases/a-week-life.html",
  testResultsUrl: undefined,
  optInRequired: false,
  recursAutomatically: true,
  recurrenceInterval: 60,
  versionNumber: 1
};

const WeekEventCodes = {
  BROWSER_START: 1,
  BROWSER_SHUTDOWN: 2,
  BROWSER_RESTART: 3,
  BROWSER_ACTIVATE: 4,
  BROWSER_INACTIVE: 5,
  SEARCHBAR_SEARCH: 6,
  SEARCHBAR_SWITCH: 7,
  BOOKMARK_STATUS: 8,
  BOOKMARK_CREATE: 9,
  BOOKMARK_CHOOSE: 10,
  BOOKMARK_MODIFY: 11,
  DOWNLOAD: 12,
  DOWNLOAD_MODIFY: 13,
  ADDON_STATUS: 14,
  ADDON_INSTALL: 15,
  ADDON_UNINSTALL: 16,
  PRIVATE_ON: 17,
  PRIVATE_OFF: 18
};

// subcodes for BOOKMARK_MODIFY:
const BMK_MOD_CHANGED = 0;
const BMK_MOD_REMOVED = 1;
const BMK_MOD_MOVED = 2;

exports.dataStoreInfo = {
  fileName: "testpilot_week_in_the_life_results.sqlite",
  tableName: "week_in_the_life",
  columns: [{property: "event_code", type: TYPE_INT_32, displayName: "Event"},
            {property: "data1", type: TYPE_INT_32, displayName: "Data 1"},
            {property: "data2", type: TYPE_INT_32, displayName: "Data 2"},
            {property: "data3", type: TYPE_INT_32, displayName: "Data 2"},
            {property: "timestamp", type: TYPE_DOUBLE, displayName: "Time"}]
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
    console.info("Is bookmark observer already installed? " + this.alreadyInstalled);
    if (!this.alreadyInstalled) {
      console.info("Adding bookmark observer.");
      this.bmsvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
        .getService(Ci.nsINavBookmarksService);
      this.bmsvc.addObserver(this, false);
      this.store = store;
      this.alreadyInstalled = true;
      this.runGlobalBookmarkQuery();
    }
  },

  runGlobalBookmarkQuery: function() {
    // Run once on startup to count bookmarks, folders, and depth of
    // folders.
    let historyService = Cc["@mozilla.org/browser/nav-history-service;1"]
                               .getService(Ci.nsINavHistoryService);
    let bookmarksService = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
                                 .getService(Ci.nsINavBookmarksService);

    let totalBookmarks = 0;
    let totalFolders = 0;
    let greatestDepth = 0;
    let rootFolders = [ bookmarksService.toolbarFolder,
                        bookmarksService.bookmarksMenuFolder,
                        bookmarksService.tagsFolder,
                        bookmarksService.unfiledBookmarksFolder];

    let digIntoFolder = function(folderID, depth) {
      console.info("These are the children of " + folderID );
      let options = historyService.getNewQueryOptions();
      let query = historyService.getNewQuery();
      query.setFolders([folderID], 1);
      let result = historyService.executeQuery(query, options);
      let rootNode = result.root;
      rootNode.containerOpen = true;
      // iterate over the immediate children of this folder and dump to console
      for (let i = 0; i < rootNode.childCount; i ++) {
        let node = rootNode.getChild(i);
        console.info("Child: " + node.title );
        if (node.type == node.RESULT_TYPE_FOLDER) {
          console.info("This is a folder, so I am recursing into it.");
          totalFolders ++;
          digIntoFolder(node.itemId, depth + 1);
        } else {
          console.info("This is a non-folder bookmark.");
          totalBookmarks ++;
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
    // TODO first time I ran this I got a TON of "bookmark added" at the end
    // of startup.  I think it was adding every bookmark the profile had or
    // something?  This didn't happen next time we started, though.
    this.store.rec(WeekEventCodes.BOOKMARK_CREATE, []);
    console.info("Bookmark added!");
  },

  onItemRemoved: function(itemId, parentId, index, type) {
    this.store.rec(WeekEventCodes.BOOKMARK_MODIFY, [BMK_MOD_REMOVED]);
    console.info("Bookmark removed!");
  },

  onItemChanged: function(bookmarkId, property, isAnnotation,
                          newValue, lastModified, type) {
    // TODO this gets called with almost every add, remove, or visit.
    // Too much.
    this.store.rec(WeekEventCodes.BOOKMARK_MODIFY, [BMK_MOD_CHANGED]);
    console.info("Bookmark modified!");
  },

  onItemVisited: function(bookmarkId, visitId, time) {
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
  alreadyInstalled: false,
  store: null,
  idleService: null,

  install: function(store) {
    // See: https://developer.mozilla.org/en/nsIIdleService
    console.info("Is idleness observer already installed? " + this.alreadyInstalled);
    if (!this.alreadyInstalled) {
      console.info("Adding idleness observer.");
      this.idleService = Cc["@mozilla.org/widget/idleservice;1"]
       .getService(Ci.nsIIdleService);
      this.store = store;
      this.idleService.addIdleObserver(this, 600); // ten minutes
      this.alreadyInstalled = true;
    }
  },

  uninstall: function() {
    if (this.alreadyInstalled) {
      this.idleService.removeIdleObserver(this, 600);
      this.alreadyInstalled = false;
    }
  },

  observe: function(subject, topic, data) {
    // Subject is nsIIdleService. Topic is 'idle' or 'back'.  Data is elapsed
    // time in seconds.
    if (topic == 'idle') {
      console.info("User has gone idle for " + data + " seconds.");
      this.store.rec(WeekEventCodes.BROWSER_INACTIVE, [data]);
    }
    if (topic == 'back') {
      console.info("User is back!  They were idle for " + data + " seconds.");
      this.store.rec(WeekEventCodes.BROWSER_ACTIVATE, [data]);
    }
  }
};

var ExtensionObserver = {
  alreadyInstalled: false,
  store: null,
  obsService: null,

  install: function(store) {
    console.info("Is extension observer already installed? " + this.alreadyInstalled);
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
  }
};

var DownloadsObserver = {
  alreadyInstalled: false,
  store: null,
  downloadManager: null,

  install: function(store) {
    console.info("Is bookmark observer already installed? " + this.alreadyInstalled);
    if (!this.alreadyInstalled) {
      console.info("Adding downloads observer.");
      this.downloadManager = Cc["@mozilla.org/download-manager;1"]
                   .getService(Ci.nsIDownloadManager);
      this.downloadManager.addListener(this);
      this.store = store;
      this.alreadyInstalled = true;
    }
  },

  uninstall: function() {
    if (this.alreadyInstalled) {
      this.downloadManager.addListener(this);
      this.alreadyInstalled = false;
    }
  },

  onSecurityChange : function(prog, req, state, dl) {
    // TODO anything useful we can do with this?
    console.info("Security changed for a download.");
  },
  onProgressChange : function(prog, req, prog2, progMax, tProg, tProgMax, dl) {
    // TODO anything useful we can do with this?
    console.info("Progress changed for a download.");
  },
  onStateChange : function(prog, req, flags, status, dl) {
    // TODO anything useful we can do with this?
    console.info("State changed for a download.");
  },
  onDownloadStateChange : function(state, dl) {
    // TODO we want some kind of record here for repeat downloads
    this.store.rec(WeekEventCodes.DOWNLOAD, []);
    console.info("Download State changed for a download.");
  }
};


exports.handlers = {
  _dataStore: null,
  obsService: null,
  // for handlers API:
  onNewWindow: function(window) {
    // Don't care
  },

  onWindowClosed: function(window) {
    // Don't care
  },

  onAppStartup: function() {
    // TODO right here we need to get number of restored tabs/windows.
    this._dataStore.rec(WeekEventCodes.BROWSER_START, []);
    console.info("Week in the life study got app startup message.");
  },

  onAppShutdown: function() {
    // Nothing to do
  },

  onExperimentStartup: function(store) {
    store.rec = function(eventCode, data) {
      store.storeEvent({ event_code: eventCode,
                         data1: data[0] || 0,
                         data2: data[1] || 0,
                         data3: data[2] || 0,
                         timestamp: Date.now()});
    };
    this._dataStore = store;
    console.info("Week in the life: Startingg subobservers.");
    this._startAllObservers();
    this.obsService = Cc["@mozilla.org/observer-service;1"]
                           .getService(Ci.nsIObserverService);
    //this.obsService.addObserver(this, "private-browsing", false);
    this.obsService.addObserver(this, "quit-application", false);

      /*
  observe: function(subject, topic, data) {
    if (topic == "private-browsing") {
      if (data == "enter") {
      } else if (data == "exit"){
      }
    }
  }*/

  },

  onExperimentShutdown: function() {
    console.info("Week in the life: Shutting down subobservers.");
    this._stopAllObservers();

    /*this.obsService.removeObserver(this, "private-browsing");
      this.obsService.removeObserver(this, "quit-application");*/
  },

  onEnterPrivateBrowsing: function() {
    this.store.rec(WeekEventCodes.PRIVATE_ON, []);
    this._stopAllObservers();
  },

  onExitPrivateBrowsing: function() {
    this.store.rec(WeekEventCodes.PRIVATE_OFF, []);
    this._startAllObservers();
  },

  _startAllObservers: function() {
    BookmarkObserver.install(this._dataStore);
    IdlenessObserver.install(this._dataStore);
    ExtensionObserver.install(this._dataStore);
    DownloadsObserver.install(this._dataStore);
  },

  _stopAllObservers: function() {
    BookmarkObserver.uninstall();
    IdlenessObserver.uninstall();
    ExtensionObserver.uninstall();
    DownloadsObserver.uninstall();
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

exports.webContent = {
  inProgressHtml: "<h2>A Week in the Life of a Browser</h2><p>In progress.  "
                 +"<a onclick='showRawData(2);'>the complete raw data set</a>.</p>",
  completedHtml: "<h2>A Week in the Life of a Browser</h2><p>Completed. "
                 + "<a onclick='showRawData(2);'>the complete raw data set</a>.</p>",
  upcomingHtml: "<h2>A Week in the Life of a Browser</h2><p>Upcoming...</p>",
  onPageLoad: function(experiment, document, graphUtils) {
    let rawData = experiment.dataStoreAsJSON;
    // so what's in this raw data json?  We may have to go through row by
    // row.  Myeah.  Really the event-log based data store isn't the best
    // way to do this one... but whatever, we've got it and it works OK.
    // So like...
    for each ( let row in rawData ) {
    }
  }
};