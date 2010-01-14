const TYPE_INT_32 = 0;
const TYPE_DOUBLE = 1;

exports.experimentInfo = {
  startDate: null,
  duration: 7,
  testName: "Menu Item Usage Study",
  testId: 4,
  testInfoUrl: "",
  testResultsUrl: "",
  optInRequired: false,
  recursAutomatically: false,
  recurrenceInterval: 0,
  versionNumber: 1
};

var COLUMNS = [
  {property: "menu_id", type: TYPE_INT_32, displayName: "Menu"},
  {property: "item_id", type: TYPE_INT_32, displayName: "Item"},
  {property: "timestamp", type: TYPE_DOUBLE, displayName: "Timestamp"}];

exports.dataStoreInfo = {
  fileName: "testpilot_menu_item_usage_results.sqlite",
  tableName: "menu_item_usage_experiment",
  columns: COLUMNS
};

exports.handlers = {
  onNewWindow: function(window) {
    // OK, for each window we need to stick an event listener on the main
    // menu thingy...
    let mainCommandSet = window.getElementById("mainCommandSet");
    // or...?
    let mainMenuBar = window.getElementById("main-menubar");

    mainMenuBar.addEventListener("command", function() {
                                   console.info("You used a menu item! (bar)");
                                 }, false);
    mainCommandSet.addEventListener("command", function() {
                                   console.info("You used a menu item! (set)");
                                 }, false);
    // TODO should we use true for useCapture?
  },
  onWindowClosed: function(window) {
    // TODO remove those event listeners or something
  },
  onAppStartup: function() {},
  onAppShutdown: function() {},
  onExperimentStartup: function(store) {
    // TODO save reference to store
  },
  onExperimentShutdown: function() {},
  onEnterPrivateBrowsing: function() {},
  onExitPrivateBrowsing: function() {}
};

exports.webContent = {
  inProgressHtml: 'You are running menu item usage study.',

  completedHtml: 'Thanks for completing menu item usage study.',

  upcomingHtml: "",

  onPageLoad: function(experiment, document, graphUtils) {
  }
};