var ghostlib = require("Ghost Study Library");

exports.experimentInfo = {
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
    console.info("Calling ghostlib: " + ghostlib.expFunc(2, 3));
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