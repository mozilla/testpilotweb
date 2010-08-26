BaseClasses = require("study_base_classes.js");

exports.experimentInfo = {
  testName: "About Firefox",
  testId: 10, // Let's allow non-numeric study ids!!!
  testInfoUrl: "https://",
  summary: "Basic data about preferences, plugins, and memory",
  thumbnail: null,
  versionNumber: 1,
  duration: 0.5,
  minTPVersion: "1.0a1",
  recursAutomatically: false,
  recurrenceInterval: null,
  startDate: null,
  optInRequired: false
};


exports.dataStoreInfo = {
  fileName: "testpilot_aboutFx_results.sqlite",
  tableName: "testpilot_aboutFx_study",
  columns: [
    {property: "key", type: BaseClasses.TYPE_STRING,
     displayName: "Key"},
    {property: "value", type: BaseClasses.TYPE_STRING,
     displayName: "Value"}
  ]
};

function AboutFxStudyGlobalObserver() {
  // No need for a per-window constructor
  AboutFxStudyGlobalObserver.baseConstructor.call(this, null);
}
BaseClasses.extend(AboutFxStudyGlobalObserver,
                   BaseClasses.GenericGlobalObserver);
AboutFxStudyGlobalObserver.prototype.onExperimentStartup = function(store) {
  AboutFxStudyGlobalObserver.superClass.onExperimentStartup.call(this, store);

  // Copied from about:memory
  let mgr = Cc["@mozilla.org/memory-reporter-manager;1"]
        .getService(Ci.nsIMemoryReporterManager);

  let e = mgr.enumerateReporters();
  while (e.hasMoreElements()) {
    let mr = e.getNext().QueryInterface(Ci.nsIMemoryReporter);
    dump("Path = " + mr.path + ", Desc = " + mr.description + ", Used = "
         + mr.memoryUsed + "\n");
  }

  //this.record({event: 2, timestamp: Date.now()});
};
exports.handlers = new AboutFxStudyGlobalObserver();


function AboutFxWebContent()  {
  AboutFxWebContent.baseConstructor.call(this, exports.experimentInfo);
}
BaseClasses.extend(AboutFxWebContent, BaseClasses.GenericWebContent);
AboutFxWebContent.prototype.__defineGetter__("dataCanvas",
  function() {
      return '<div class="dataBox"><h3>View Your Data:</h3>' +
      this.dataViewExplanation +
      this.rawDataLink +
      '<div id="data-plot-div" style="width:480x;height:800px"></div>' +
      this.saveButtons + '</div>';
  });
AboutFxWebContent.prototype.__defineGetter__("dataViewExplanation",
  function() {
    return "Below is some random info about your stuff.";
  });
AboutFxWebContent.prototype.onPageLoad = function(experiment,
                                                  document,
                                                  graphUtils) {
  // TODO
};
exports.webContent = new AboutFxWebContent();

require("unload").when(
  function destructor() {
  });


