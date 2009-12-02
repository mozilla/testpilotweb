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

var eventCodeToEventName = ["", "Firefox Startup", "Firefox Shutdown",
                            "Firefox Restart", "Resume Active Use",
                            "Begin Idle", "Search", "Search Settings Changed",
                            "Bookmark Count", "New Bookmark", "Bookmark Opened",
                            "Bookmark Modified", "Download",
                            "Download Settings Changed", "Add-ons Count",
                            "Add-on Installed", "Add-on Uninstalled",
                            "Private Mode On", "Private Mode Off"];

// subcodes for BOOKMARK_MODIFY:
const BMK_MOD_CHANGED = 0;
const BMK_MOD_REMOVED = 1;
const BMK_MOD_MOVED = 2;

exports.dataStoreInfo = {
  fileName: "testpilot_week_in_the_life_results.sqlite",
  tableName: "week_in_the_life",
  columns: [{property: "event_code", type: TYPE_INT_32, displayName: "Event",
             displayValue: eventCodeToEventName},
            {property: "data1", type: TYPE_INT_32, displayName: "Data 1"},
            {property: "data2", type: TYPE_INT_32, displayName: "Data 2"},
            {property: "data3", type: TYPE_INT_32, displayName: "Data 2"},
            {property: "timestamp", type: TYPE_DOUBLE, displayName: "Time",
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
    console.info("Is bookmark observer already installed? " + this.alreadyInstalled);
    if (!this.alreadyInstalled) {
      console.info("Adding bookmark observer.");
      this.bmsvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
        .getService(Ci.nsINavBookmarksService);
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

    // OH, I know what this is - it's the live bookmark RSS feed of BBC news.
    // We should have some way of skipping those.
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
    // TODO how can we tell if something has gone wrong with session restore?
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
    console.info("Week in the life: Starting subobservers.");
    this._startAllObservers();
    BookmarkObserver.runGlobalBookmarkQuery();
    this.obsService = Cc["@mozilla.org/observer-service;1"]
                           .getService(Ci.nsIObserverService);
    this.obsService.addObserver(this, "quit-application", false);
  },

  onExperimentShutdown: function() {
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
  inProgressHtml:
    '<h2>A Week in the Life of a Browser</h2><p>In progress. Here is \
     <a onclick="showRawData(2);">the complete raw data set</a>.\
     </p><h4>This study is currently running.  It will end \
     <span id="test-end-time"></span>. If you don\'t want to \
     participate, please \
    <a href="chrome://testpilot/content/status-quit.html?eid=2">click here to quit</a>.</h4>\
    <p>You have <span id="num-bkmks-span"></span> bookmarks in \
    <span id="num-folders-span"></span> folders, to a max folder depth of \
    <span id="max-depth-span"></span>.</p>   \
    <canvas id="browser-use-time-canvas" width="450" height="220"></canvas> \
  ',
  completedHtml:
    '<h2>A Week in the Life of a Browser</h2><p>Completed! Here is \
     <a onclick="showRawData(2);">the complete raw data set</a>.</p>\
     <p>This test will automatically start again in 60 days.  If you would \
     prefer to have Test Pilot submit your data automatically next time, \
     instead of asking you, you can check the box below:<br/>\
     <input type="checkbox" id="always-submit-checkbox">\
     Automatically submit data for this test from now on<br/>\
     <div class="home_callout_continue"><img class="homeIcon" src="chrome://testpilot/skin/images/home_computer.png"> <span id="upload-status"><a onclick="uploadData();">Submit your data &raquo;</a></span></div>\
     ',
  upcomingHtml: "<h2>A Week in the Life of a Browser</h2><p>Upcoming...</p>",
  onPageLoad: function(experiment, document, graphUtils) {
    let rawData = experiment.dataStoreAsJSON;
    let bkmks, folders, depth;
    let browserUseTimeData = [];
    let firstTimestamp = 0;

    for each ( let row in rawData ) {
      if (firstTimestamp == 0 )
        firstTimestamp = row.timestamp;
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
      break;
      }
    }
    let lastTimestamp = (new Date()).getTime();
    browserUseTimeData.push( [lastTimestamp, 2] );

    document.getElementById("num-bkmks-span").innerHTML = bkmks;
    document.getElementById("num-folders-span").innerHTML = folders;
    document.getElementById("max-depth-span").innerHTML = depth;

    let orange = "rgb(200,100,0)";
    let yellow = "rgb(200,200,0)";

    let canvas = document.getElementById("browser-use-time-canvas");
    let ctx = canvas.getContext("2d");

    let boundingRect = { originX: 40,
                         originY: 210,
                         width: 400,
                         height: 200 };
    let xScale = boundingRect.width / (lastTimestamp - firstTimestamp);
    console.log("xScale is " + xScale );

    //Draw colored bar - orange for using the browser, yellow for running
    // but not being used, white for no use.
    for (let rowNum = 0; rowNum < browserUseTimeData.length; rowNum++) {
      let row = browserUseTimeData[rowNum];
      console.info("Data point: " + (new Date(row[0])).toString() + ", " + row[1]);
      switch( row[1]) {
      case 0:
        continue;
      case 1:
        ctx.fillStyle = yellow;
        break;
      case 2:
        ctx.fillStyle = orange;
        break;
      }
      let x = xScale * ( row[0] - firstTimestamp );
      if (rowNum + 1 < browserUseTimeData.length) {
        let nextX = xScale * (browserUseTimeData[rowNum + 1][0] - firstTimestamp);
        ctx.fillRect(x, 100, nextX - x, 50);
      }
    }
    // Add scale with dates on it
    let firstDay = new Date(firstTimestamp);
    console.info("Beginning date is " + firstDay.toString());
    console.info("Ending date is " + (new Date(lastTimestamp)).toString());
    firstDay.setDate( firstDay.getDate() + 1 );
    firstDay.setHours(0);
    firstDay.setMinutes(0);
    firstDay.setSeconds(0);
    firstDay.setMilliseconds(0);
    ctx.mozTextStyle = "10pt sans serif";
    ctx.fillStyle = "black";
    let dayMarker = firstDay;
    let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    while (dayMarker.getTime() < lastTimestamp) {
      let x = xScale * (dayMarker.getTime() - firstTimestamp);
      ctx.beginPath();
      ctx.moveTo(x, 50);
      ctx.lineTo(x, 200);
      ctx.stroke();
      ctx.save();
      ctx.translate(x + 5, 55);
      ctx.mozDrawText(days[dayMarker.getDay()] + " " + dayMarker.getDate());
      ctx.restore();
      dayMarker.setDate( dayMarker.getDate() + 1 );
    }
  }
};