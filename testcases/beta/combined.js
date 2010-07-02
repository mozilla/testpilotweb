BaseClasses = require("study_base_classes.js");

/* This study must be implemented with enough flexibility that it doesn't
 * break when changes are made to the UI from one beta to the next.
 */

const MY_TEST_ID = "combined_beta_study_0";

/* Need a schema that can hold both menu and toolbar events.
 * String columns may be better than a gigantic brittle ever-growing table of
 * id codes.  But the trade-off is that the uploads will be larger.
 */


/* Something like:
 * Top-level-item     =     Menu name, or meta-element like "url bar".
 * Sub-item           =     Menu item name, or like "right scroll button".
 * Interaction        =     Click, menu-pick, right-click, click-and-hold,
 *                          keyboard shortcut, etc.
 * Meta               =     Event vs. metadata vs. customization vs. hunt time
 *
 * Explore ms/explore num/start-menu-id  = 3 columns for one very specific case.
 */

const EVENT_CODES = {
  METADATA: 0,
  ACTION: 1,
  MENU_HUNT: 2,
  CUSTOMIZE: 3
};

var COMBINED_EXPERIMENT_COLUMNS =  [
  {property: "event", type: BaseClasses.TYPE_INT_32, displayName: "Event",
   displayValue: ["Study Metadata", "Action", "Menu Hunt", "Customization"]},
  {property: "item", type: BaseClasses.TYPE_INT_32, displayName: "Element"},
  {property: "sub_item", type: BaseClasses.TYPE_INT_32, displayName: "Sub-Element"},
  {property: "interaction_type", type: BaseClasses.TYPE_INT_32, displayName: "Interaction"},
  {property: "timestamp", type: BaseClasses.TYPE_DOUBLE, displayName: "Time",
   displayValue: function(value) {return new Date(value).toLocaleString();}}
];

exports.experimentInfo = {
  startDate: null, // Null start date means we can start immediately.
  duration: 5, // Days
  testName: "Menu/Toolbar",
  testId: MY_TEST_ID,
  testInfoUrl: "https://testpilot.mozillalabs.com",
  summary: "We are studying how the changes to the toolbar and menu bar in the"
           + " Firefox 4 beta affect usage of the interface.",
  thumbnail: null,
  optInRequired: false,
  recursAutomatically: false,
  recurrenceInterval: 0,
  versionNumber: 1,
  minTPVersion: "1.0rc1",
  minFXVersion: "4.0b1" // Only run this study for Firefox 4 users!
};

exports.dataStoreInfo = {
  fileName: "combined_beta_study_results.sqlite",
  tableName: "combined_beta_study_results",
  columns: COMBINED_EXPERIMENT_COLUMNS
};

function CombinedWindowObserver(window) {
  CombinedWindowObserver.baseConstructor.call(this, window);
};
BaseClasses.extend(CombinedWindowObserver, BaseClasses.GenericWindowObserver);
CombinedWindowObserver.prototype.install = function() {

  console.info("Starting to install listeners for combined window observer.");
  let record = function( item, subItem, interaction ) {
    exports.handlers.record(EventCodes.ACTION, item, subItem, interaction);
  };

  // TODO all the good stuff goes here!!

};

function GlobalCombinedObserver()  {
  GlobalCombinedObserver.baseConstructor.call(this, CombinedWindowObserver);
}
BaseClasses.extend(GlobalCombinedObserver, BaseClasses.GenericGlobalObserver);
GlobalCombinedObserver.prototype.onExperimentStartup = function(store) {
  GlobalCombinedObserver.superClass.onExperimentStartup.call(this, store);

  // TODO read study GUID and record it as part of study startup status event.
  // Actually no, better yet!  Copy the GUID from the first run's pref to
  // my pref -- so if this is a later run (with new ID?) it will still have
  // same GUID as first run pref.

  // Record customizations?
};

GlobalCombinedObserver.prototype.record = function(event, item, subItem,
                                                  interactionType) {
  if (!this.privateMode) {
    this._store.storeEvent({
      event: event,
      item: item,
      sub_item: subItem,
      interaction_type: interactionType,
      timestamp: Date.now()
    });
    // storeEvent can also take a callback, which we're not using here.
  }
};

exports.handlers = new GlobalCombinedObserver();


function CombinedStudyWebContent()  {
  CombinedStudyWebContent.baseConstructor.call(this, exports.experimentInfo);
}
BaseClasses.extend(CombinedStudyWebContent, BaseClasses.GenericWebContent);
CombinedStudyWebContent.prototype.__defineGetter__("dataViewExplanation",
  function() {
    return "There's going to be some kind of graph here, time permitting.";
  });
CombinedStudyWebContent.prototype.onPageLoad = function(experiment,
                                                       document,
                                                       graphUtils) {
  // TODO graphics
};
exports.webContent = new CombinedStudyWebContent();

require("unload").when(
  function myDestructor() {
    console.info("Combined study destructor called.");
    exports.handlers.uninstallAll();
  });
