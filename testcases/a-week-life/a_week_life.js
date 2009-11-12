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
    /* TODO how to get the number of bookmarks, number of bookmark folders,
     * and depth of bookmark folders?  Is that all through Places?
     */

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
    console.info("Bookmark added!");
  },

  onItemRemoved: function(itemId, parentId, index, type) {
    console.info("Bookmark removed!");
  },

  onItemChanged: function(bookmarkId, property, isAnnotation,
                          newValue, lastModified, type) {
    // TODO this gets called with almost every add, remove, or visit.
    // Too much.
    console.info("Bookmark modified!");
  },

  onItemVisited: function(bookmarkId, visitId, time) {
    console.info("Bookmark visited!");
  },

  onItemMoved: function(itemId, oldParentId, oldIndex, newParentId,
                        newIndex, type) {
    console.info("Bookmark moved!");
  }
};

var IdlenessObserver = {
  alreadyInstalled: false,
  store: null,
  idleService: null,

  install: function(store) {
    // See: https://developer.mozilla.org/en/nsIIdleService
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
    }
    if (topic == 'back') {
      console.info("User is back!  They were idle for " + data + " seconds.");
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
    if (data == "item-installed") {
      console.info("An extension was installed!");
    } else if (data == "item-upgraded") {
      console.info("An extension was upgraded!");
    } else if (data == "item-uninstalled") {
      console.info("An extension was uninstalled!");
    } else if (data == "item-enabled") {
      console.info("An extension was enabled!");
    } else if (data == "item-disabled") {
      console.info("An extension was disabled!");
    }
  }
};

var DownloadsObserver = {
  install: function(store) {
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
    console.info("Security changed for a download.");
  },
  onProgressChange : function(prog, req, prog, progMax, tProg, tProgMax, dl) {
    console.info("Progress changed for a download.");
  },
  onStateChange : function(prog, req, flags, status, dl) {
    console.info("State changed for a download.");
  },
  onDownloadStateChange : function(state, dl) {
    console.info("Download State changed for a download.");
  }
};


var global_observerInstalled = false;

exports.Observer = function WeekLifeObserver(window, store) {
  this._init(window, store);
};
exports.Observer.prototype = {
  _init: function(window, store) {
    this._window = window;
    this._dataStore = store;

    console.info("Called A Week Life Observer._init.");
    if (!global_observerInstalled) {
      this.obsService = Cc["@mozilla.org/observer-service;1"]
                           .getService(Ci.nsIObserverService);
      global_observerInstalled = true;
      this._startAllObservers();
    }
  },

  observe: function(subject, topic, data) {
    if (subject == "private-browsing") {
      if (topic == "enter") {
        console.info("Private browsing turned on.");
        // TODO stop all observers when private browsing goes on
      } else if (topic == "exit"){
        console.info("Private browsing turned off.");
        // TODO restart all observers when private browsing goes back off!
      }
    } else if (subject == "quit-application") {
      if (topic == "shutdown") {
        console.info("Firefox commanded to shut down!");
      } else if (topic == "restart") {
        console.info("Firefox commanded to start up!");
      }
    }
  },

  uninstall: function() {
    if (global_observerInstalled) {
      global_observerInstalled = false;
      this._stopAllObservers();
    }
  },

  _startAllObservers: function() {
    console.info("A Week Life Observer - installing all observers.");
    this.obsService.addObserver(this, "private-browsing", false);
    this.obsService.addObserver(this, "quit-application", false);

    BookmarkObserver.install(store);
    IdlenessObserver.install(store);
    ExtensionObserver.install(store);
    DownloadsObserver.install(store);
  },

  _stopAllObservers: function() {
    console.info("A Week Life Observer - removing all observers.");
    this.obsService.removeObserver(this, "private-browsing");
    this.obsService.removeObserver(this, "quit-application");

    BookmarkObserver.uninstall();
    IdlenessObserver.uninstall();
    ExtensionObserver.uninstall();
    DownloadsObserver.uninstall();
  }
};

exports.webContent = {
  inProgressHtml: "<h2>A Week in the Life of a Browser</h2><p>In progress.</p>",
  completedHtml: "<h2>A Week in the Life of a Browser</h2><p>Completed.</p>",
  upcomingHtml: "<h2>A Week in the Life of a Browser</h2><p>In progress.</p>",
  onPageLoad: function(experiment, document, graphUtils) {
  }
};