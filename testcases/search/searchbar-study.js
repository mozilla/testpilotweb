BaseClasses = require("study_base_classes.js");

const SearchEngine = {
  CUSTOM: -1,
  GOOGLE: 1,
  YAHOO: 2,
  AMAZON: 3,
  ANSWERS: 4,
  CREATIVE_COMMONS: 5,
  EBAY: 6,
  WIKIPEDIA: 7
};

var SEARCHBAR_EXPERIMENT_COLUMNS =  [
  {property: "engine_id", type: BaseClasses.TYPE_INT_32, displayName: "Search Engine",
   displayValue: ["", "Google", "Yahoo", "Amazon", "Answers", "Creative Commons",
                  "EBay", "Wikipedia"]},
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

// The per-window observer class:
function SearchbarWindowObserver(window) {
  SearchbarWindowObserver.baseConstructor.call(this, window);
};
BaseClasses.extend(SearchbarWindowObserver, BaseClasses.GenericWindowObserver);
SearchbarWindowObserver.prototype.install = function() {

  let searchBar = this.window.document.getElementById("searchbar");
  this._listen(searchBar, "keydown", function(evt) {
                 if (evt.keyCode == 13) { // Enter key
                   dump(searchBar.searchService.currentEngine.name + "\n");
                 }
               }, false);


  this._listen(searchBar, "mouseup", function(evt) {
                 if (evt.originalTarget.getAttribute("anonid") == "search-go-button") {
                   dump(searchBar.searchService.currentEngine.name + "\n");
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
GlobalToolbarObserver.prototype.record = function(searchEngine) {
  if (!this.privateMode) {
    this._store.storeEvent({
      engine_id: event,
      engine_pos: 0, // how do we get this?
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
  // TODO draw a pie chart
};

exports.webContent = new SearchbarStudyWebContent();

require("unload").when(
  function myDestructor() {
    console.info("Searchbar study destructor called.");
    exports.handlers.uninstallAll();
  });
