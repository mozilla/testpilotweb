// Mobile Study Example

BaseClasses = require("study_base_classes.js");

exports.experimentInfo = {
  testName: "Mobile Example",
  testId: "mobile_example",
  testInfoUrl: "https://",
  summary: "A sentence or two explaining what your study is about",
  thumbnail: "http://",
  versionNumber: 1,
  duration: 5,
  minTPVersion: "1.0",
  minFXVersion: "4.0b1",
  recursAutomatically: false,
  recurrenceInterval: 60,
  startDate: null,
  optInRequired: false
};

exports.dataStoreInfo = {
  fileName: "testpilot_example_results.sqlite", // this file will be
  tableName: "testpilot_example_study",
  columns: [
    {property: "event", type: BaseClasses.TYPE_INT_32,
     displayName: "What you did"},
    {property: "timestamp", type: BaseClasses.TYPE_DOUBLE,
     displayName: "When you did it"}
  ]
};

// Who cares about per-window stuff in mobile studies

exports.handlers = {
  privateMode: false,

  onNewWindow: function(window) {
    // not used on mobile?
    console.info("Mobile Example OnNewWindow.");
  },

  onWindowClosed: function(window) {
    // not used on mobile?
  },

  onAppStartup: function() {
    // TODO
  },

  onAppShutdown: function() {
    // TODO
  },

  onExperimentStartup: function(store) {
    this._store = store;
    let self = this;

    let wm = Cc["@mozilla.org/appshell/window-mediator;1"].
      getService(Ci.nsIWindowMediator);
    let window = wm.getMostRecentWindow("navigator:browser"); // does this work?

    console.info("Mobile Example Experiment Started.  Front window is " + window);
    let backButton = window.document.getElementById("tool-back");
    let forwardButton = window.document.getElementById("tool-forward");

    backButton.addEventListener("click", function() {
                                  console.info("Back button clicked.");
                                  self.record({event: 1,
                                               timestamp: Date.now()});
                                }, false);
    forwardButton.addEventListener("click", function() {
                                     console.info("Forward button clicked.");
                                     self.record({event: 2,
                                                  timestamp: Date.now()});
                                   }, false);

  },

  onExperimentShutdown: function() {
    // TODO remove some event handlers here
  },

  doExperimentCleanup: function() {
  },

  onEnterPrivateBrowsing: function() {
    // Don't record any events when in private mode
    this.privateMode = true;
  },

  onExitPrivateBrowsing: function() {
    this.privateMode = false;
  },

  record: function(event, callback) {
    if (!this.privateMode) {
      this._store.storeEvent(event, callback);
    }
  }
};


// Finally, we make the web content, which defines what will show up on the
// study detail view page.
function ExampleWebContent()  {
  ExampleWebContent.baseConstructor.call(this, exports.experimentInfo);
}
// Again, we're extending a generic web content class.
BaseClasses.extend(ExampleWebContent, BaseClasses.GenericWebContent);
/* it's all implemented as getters, and unfortunately the syntax for
 * overriding getters is way ugly -- I'm thinking of changing this, but for
 * now, you have to use __defineGetter__. */
ExampleWebContent.prototype.__defineGetter__("dataCanvas",
  function() {
      return '<div class="dataBox"><h3>View Your Data:</h3>' +
      this.dataViewExplanation +
      this.rawDataLink +
      '<div id="data-plot-div" style="width:480x;height:800px"></div>' +
      this.saveButtons + '</div>';
  });
ExampleWebContent.prototype.__defineGetter__("dataViewExplanation",
  function() {
    return "This is a totally made up example study that means nothing.";
  });

// This function is called when the experiment page load is done
ExampleWebContent.prototype.onPageLoad = function(experiment,
                                                  document,
                                                  graphUtils) {
  /* experiment is a reference to the live experiment Task object.
   * document is a reference to the experiment page document
   * graphUtils is a rerence to the Flot JS chart plotting library:
   * see http://code.google.com/p/flot/
   *
   * The basic idea here is to plot some kind of chart inside the div tag
   * that we defined in the dataCanvas getter in order to display the
   * experiment data to the user in an easily understood form.
   */
};

// Instantiate and export the web content (required!)
exports.webContent = new ExampleWebContent();

// Register any code we want called when the study is unloaded:
require("unload").when(
  function destructor() {
    // Do any module cleanup here.
  });

// We're done!