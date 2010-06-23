BaseClasses = require("study_base_classes.js");

var SEARCHBAR_EXPERIMENT_COLUMNS =  [
  {property: "engine_name", type: BaseClasses.TYPE_STRING, displayName: "Search Engine"},
  {property: "engine_pos", type: BaseClasses.TYPE_INT_32, displayName: "Position"},
  {property: "timestamp", type: BaseClasses.TYPE_DOUBLE, displayName: "Time",
   displayValue: function(value) {return new Date(value).toLocaleString();}}
];

exports.experimentInfo = {
  startDate: null, // Null start date means we can start immediately.
  duration: 7, // Days
  testName: "Search Bar",
  testId: 8,
  testInfoUrl: "",
  summary: "Which search engines are used most in the search bar?",
  thumbnail: null,
  optInRequired: false,
  recursAutomatically: false,
  recurrenceInterval: 0,
  versionNumber: 1,
  minTPVersion: "1.0b4"
};

exports.dataStoreInfo = {
  fileName: "testpilot_searchbar_study_results.sqlite",
  tableName: "testpilot_searchbar_study",
  columns: SEARCHBAR_EXPERIMENT_COLUMNS
};

function SearchbarWindowObserver(window) {
  SearchbarWindowObserver.baseConstructor.call(this, window);
};
BaseClasses.extend(SearchbarWindowObserver, BaseClasses.GenericWindowObserver);
SearchbarWindowObserver.prototype.install = function() {

  let searchBar = this.window.document.getElementById("searchbar");
  let recordSearch = function() {
    let currEngine = searchBar.searchService.currentEngine;
    let name = currEngine.name;
    let index = searchBar.searchService.getEngines().indexOf(currEngine);
    dump("Recording use of " + name + " at index " + index + "\n");
    exports.handlers.record(name, index);
  };

  this._listen(searchBar, "keydown", function(evt) {
                 if (evt.keyCode == 13) { // Enter key
                   recordSearch();
                 }
               }, false);
  this._listen(searchBar, "mouseup", function(evt) {
                 if (evt.originalTarget.getAttribute("anonid") == "search-go-button") {
                   recordSearch();
                 }
               }, false);
};

function GlobalSearchbarObserver()  {
  GlobalSearchbarObserver.baseConstructor.call(this, SearchbarWindowObserver);
}
BaseClasses.extend(GlobalSearchbarObserver, BaseClasses.GenericGlobalObserver);
GlobalSearchbarObserver.prototype.onExperimentStartup = function(store) {
  GlobalSearchbarObserver.superClass.onExperimentStartup.call(this, store);
};
GlobalSearchbarObserver.prototype.record = function(searchEngine, index) {
  if (!this.privateMode) {
    this._store.storeEvent({
      engine_name: searchEngine,
      engine_pos: index,
      timestamp: Date.now()
    });
  }
};

exports.handlers = new GlobalSearchbarObserver();

function SearchbarStudyWebContent()  {
  SearchbarStudyWebContent.baseConstructor.call(this, exports.experimentInfo);
}
BaseClasses.extend(SearchbarStudyWebContent, BaseClasses.GenericWebContent);
SearchbarStudyWebContent.prototype.__defineGetter__("dataCanvas",
  function() {
      return '<div class="dataBox"><h3>View Your Data:</h3>' +
      this.dataViewExplanation +
      this.rawDataLink +
      '<div id="data-plot-div" style="width:480x;height:800px"></div>' +
      this.saveButtons + '</div>';
  });
SearchbarStudyWebContent.prototype.__defineGetter__("dataViewExplanation",
  function() {
    return "The pie chart shows how much you used each search engine "
    + "in the search bar.";
  });
SearchbarStudyWebContent.prototype.onPageLoad = function(experiment,
                                                         document,
                                                         graphUtils) {
  let canvas = document.getElementById("data-plot-div");
  let dataSet = [];
  experiment.dataStoreAsJSON(function(rawData) {
    for each (let row in rawData) {
      let foundMatch = false;
      for (let i = 0; i < dataSet.length; i++) {
        if (dataSet[i].name == row.engine_name) {
          dataSet[i].frequency += 1;
          foundMatch = true;
          break;
        }
      }
      if (!foundMatch) {
        dataSet.push({ name: row.engine_name, frequency: 1 });
      }
    }
    this.drawPieChart(canvas, dataSet);
  });
};

exports.webContent = new SearchbarStudyWebContent();

require("unload").when(
  function myDestructor() {
    console.info("Searchbar study destructor called.");
    exports.handlers.uninstallAll();
  });
