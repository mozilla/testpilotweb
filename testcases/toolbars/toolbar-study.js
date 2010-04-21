BaseClasses = require("study_base_classes.js");

const ToolbarWidget = {
  // which widget are you interacting with
  BACK: 0,
  FORWARD: 1,
  DROP_DOWN_RECENT_PAGE: 2,
  TOP_LEFT_ICON: 3,
  WINDOW_MENU_ICON: 4,
  MENU_BAR: 5,
  RELOAD: 6,
  STOP: 7,
  HOME: 8,
  SIDE_BUTTON_NEAR: 9,
  RSS_ICON: 10,
  BOOKMARK_STAR: 11,
  GO_BUTTON: 12,
  DROP_DOWN_MOST_VISITED: 13,
  DROP_DOWN_SEARCH: 14,
  SEARCH_ICON: 15,
  BOOKMARK_TOOLBAR_CLICK: 16,
  TAB_SCROLL_LEFT: 17,
  TAB_SCROLL_RIGHT: 18,
  NEW_TAB_BUTTON: 19,
  DROP_DOWN_LIST_TABS: 20,
  SCROLL_UP: 21,
  SCROLL_DOWN: 22,
  SCROLL_LEFT: 23,
  SCROLL_RIGHT: 24,
  STATUS_BAR_CLICK: 25,
  STATUS_BAR_LOCK: 26,
  CUSTOMIZE_TOOLBAR_MENU: 27
  // More?
};

const ToolbarAction = {
  CLICK: 0,
  FOCUS: 1,
  ENTER_URL: 2,
  SEARCH: 3,
  CLICK_SUGGESTION: 4,
  EXPLORE_SUGGESTIONS: 5,
  SWITCH_SEARCH_ENGINE: 6
  // More?
};

const ToolbarEvent = {
  ACTION: 0,
  CUSTOMIZE: 1,
  STUDY: 2
};

const TOOLBAR_EXPERIMENT_FILE = "testpilot_toolbar_study_results.sqlite";
const TOOLBAR_TABLE_NAME = "testpilot_toolbar_study";

/* On expeirment startup, if the user has customized their toolbars,
 * then we'll record a CUSTOMIZE event for each item the have in their
 * toolbar.
 */

var TOOLBAR_EXPERIMENT_COLUMNS =  [
  {property: "event", type: BaseClasses.TYPE_INT_32, displayName: "Event",
   displayValue: ["Action", "Customization", "Study Metadata"]},
  {property: "item_id", type: BaseClasses.TYPE_INT_32, displayName: "Widget"},
  {property: "interaction_type", type: BaseClasses.TYPE_INT_32,
   displayName: "Interaction"},
  {property: "timestamp", type: BaseClasses.TYPE_DOUBLE, displayName: "Time",
   displayValue: function(value) {return new Date(value).toLocaleString();}}
];

exports.experimentInfo = {
  startDate: null, // Null start date means we can start immediately.
  duration: 5, // Days
  testName: "Toolbar Study",
  testId: 6,
  testInfoUrl: null,
  summary: "Toolbar study",
  thumbnail: null,
  optInRequired: false,
  recursAutomatically: false,
  recurrenceInterval: 0,
  versionNumber: 1,
  minTPVersion: "1.0a1"
};

exports.dataStoreInfo = {
  fileName: TOOLBAR_EXPERIMENT_FILE,
  tableName: TOOLBAR_TABLE_NAME,
  columns: TOOLBAR_EXPERIMENT_COLUMNS
};

// The per-window observer class:
function ToolbarWindowObserver(window) {
  ToolbarWindowObserver.baseConstructor.call(window);
  dump("ToolbarWindowObserver constructed for " + window + "\n");
};
BaseClasses.extend(ToolbarWindowObserver, BaseClasses.GenericWindowObserver);


function GlobalToolbarObserver()  {
  GlobalToolbarObserver.baseConstructor.call(ToolbarWindowObserver);
}
BaseClasses.extend(GlobalToolbarObserver, BaseClasses.GenericGlobalObserver);
GlobalToolbarObserver.prototype.onExperimentStartup = function(store) {
  GlobalToolbarObserver.superClass.onExperimentStartup.call(this, store);
  // TODO record study version.

  // TODO if there is customization, record the customized toolbar
  // order now.
  dump("GlobalToolbarObserver.onExperimentStartup.\n");
};

GlobalToolbarObserver.prototype.record = function(event, itemId,
                                                  interactionType) {
  if (!this.privateMode) {
    this._store.storeEvent({
      event: event,
      item_id: itemId,
      interaction_type: interactionType,
      timestamp: Date.now()
    });
  }
};

exports.handlers = new GlobalToolbarObserver();

require("unload").when(
  function myDestructor() {
    exports.handlers.uninstallAll();
  });


const DATA_CANVAS = '<div class="dataBox"> \
</div>';

exports.webContent = {
  inProgressHtml: '<h2>Thank you, Test Pilot!</h2>\
<p>You are currently in a study to find out how the Firefox toolbars are used.</p>\
 ' + BaseClasses.rawDataLink(6) + BaseClasses.STD_FINE_PRINT + DATA_CANVAS,

  completedHtml: '<h2>Excellent! You just finished the Toolbar Study!</h2>\
</p>All test data you submit will be anonymized and will not be personally identifiable.\
<b>After we analyze the data from all submissions, you will be able to see \
all new study findings by clicking on the Test Pilot icon on the bottom-right corner \
and choosing "All your studies".</b></p>'
    + BaseClasses.optOutLink(6) +
    + BaseClasses.rawDataLink(6) + BaseClasses.UPLOAD_DATA
    + BaseClasses.STD_FINE_PRINT + DATA_CANVAS,

  upcomingHtml: "",

  remainDataHtml: "",

  onPageLoad: function(experiment, document, graphUtils) {
  }
};