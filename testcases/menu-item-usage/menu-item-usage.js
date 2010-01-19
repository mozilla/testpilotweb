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

    let mainCommandSet = window.document.getElementById("mainCommandSet");

    let mainMenuBar = window.document.getElementById("main-menubar");


    /* TODO OK this basically works but weirdly, some menu items are
     * detected by one and some are detected by the other... nearly
     * everything seems to be the set, except for Preferences (in the Firefox
     * menu on Mac) which is captured by the bar?  interesting.
     *
     * Also, commands invoked by keyboard shortcuts: some seem to get
     * captured by this method, others do not.  (It captures View Source
     * but not Select All or Copy...)
     */
    mainMenuBar.addEventListener("command", function(evt) {
                                   console.info("You used a menu item! (bar)");
                                   // evt is a XULCommandEvent... how to
                                   // extract comand ID?
                                 }, true);
    mainCommandSet.addEventListener("command", function(evt) {
                                   console.info("You used a menu item! (set)");
                                 }, true);

    /* TODO we will want to detect when somebody clicks on menu bar and
     * then hunts around for a while before they find the command they
     * want... this means also registering onMouseDown handlers to the
     * menu bar?
     */
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