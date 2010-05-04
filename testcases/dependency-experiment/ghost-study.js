var ghostlib;
try {
  ghostlib = require("dependency-experiment/ghost-library.js");
  // Error: Module "Ghost Study Library" not found
  console.info("Loaded ghostlib.");
} catch (e) {
  console.error("Error loading ghostlib: " + e );
}

exports.experimentInfo = {
  minTPVersion: "1.1",
  startDate: null,
  duration: 5,
  testName: "Ghost Study",
  testId: 1000,
  testInfoUrl: "",
  testResultsUrl: "",
  optInRequired: false,
  recursAutomatically: false,
  recurrenceInterval: 0,
  versionNumber: 1
};

exports.dataStoreInfo = {
  fileName: "testpilot_ghost_study_results.sqlite",
  tableName: "ignore_me",
  columns: [ {property: "dummy", type: 0, displayName: "Pants"}]
};

exports.handlers = {
  onNewWindow: function(window) {
  },

  onWindowClosed: function(window) {
  },

  onAppStartup: function() {
  },

  onAppShutdown: function() {
  },

  onExperimentStartup: function() {
    console.info("Starting ghost study.");
    try {
      console.info("Calling ghostlib: " + ghostlib.expFunc(2, 3));
    } catch (e) {
      console.error("Error calling ghostlib: " + e);
    }
  },

  onExperimentShutdown: function() {
  },

  onEnterPrivateBrowsing: function() {
  },

  onExitPrivateBrowsing: function() {
  }
};

exports.webContent = {
  inProgressHtml: "You are running the Ghost Study.",
  completedHtml: "You completed the Ghost Study.",
  upcomingHtml: "",
  onPageLoad: function(experiment, document, graphUtils) {
  }
};