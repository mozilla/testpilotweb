BaseClasses = require("study_base_classes.js");

var SEARCHBAR_EXPERIMENT_COLUMNS =  [
  {property: "engine_name", type: BaseClasses.TYPE_STRING, displayName: "Search Engine"},
  {property: "engine_pos", type: BaseClasses.TYPE_INT_32, displayName: "Position",
   displayValue: function(val) {return (val==-1)?"In Page":"Searchbar pos. " + val;}},
  {property: "timestamp", type: BaseClasses.TYPE_DOUBLE, displayName: "Time",
   displayValue: function(value) {return new Date(value).toLocaleString();}}
];

var SEARCH_RESULTS_PAGES = [
  {pattern: /www\.google\.com.+q=/, name: "Google"},
  {pattern: /www\.google\.co\..+q=/, name: "Google"},  // international google
  {pattern: /search\.yahoo\.com\/search.+p=/, name: "Yahoo"},
  {pattern: /www\.amazon\.com\/s\?/, name: "Amazon"},
  {pattern: /www\.answers\.com\/main\/ntquery\?s=/, name: "Answers"},
  {pattern: /search\.creativecommons\.org\/\?q=/, name: "Creative Commons"},
  {pattern: /shop\.ebay\.com\/i.html\?_nkw=/, name: "Ebay"},
  {pattern: /wikipedia\.org\/wiki.+\?search=/, name: "Wikipedia"},
  {pattern: /www\.bing\.com\/search\?q=/, name: "Bing"}
];

exports.experimentInfo = {
  startDate: null, // Null start date means we can start immediately.
  duration: 5, // Days
  testName: "Search Bar",
  testId: 8, // TODO ensure this does not conflict with anything.
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

  let appcontent = this.window.document.getElementById("appcontent");
  if (appcontent) {
    this._listen(appcontent, "DOMContentLoaded", function(evt) {
                   let url = evt.originalTarget.URL;
                   for (let i = 0; i < SEARCH_RESULTS_PAGES.length; i++) {
                     let srp = SEARCH_RESULTS_PAGES[i];
                     if (srp.pattern.test(url)) {
                       exports.handlers.record(srp.name, -1);
                     }
                   }
                 }, true);
  }

};

function GlobalSearchbarObserver()  {
  GlobalSearchbarObserver.baseConstructor.call(this, SearchbarWindowObserver);
}
BaseClasses.extend(GlobalSearchbarObserver, BaseClasses.GenericGlobalObserver);
GlobalSearchbarObserver.prototype.onExperimentStartup = function(store) {
  GlobalSearchbarObserver.superClass.onExperimentStartup.call(this, store);
};
GlobalSearchbarObserver.prototype.record = function(searchEngine, index) {
  dump("Recording use of " + searchEngine + " at index " + index + "\n");
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
      '<canvas id="data-canvas" width="480" height="400"></canvas>' +
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
  let canvas = document.getElementById("data-canvas");
  let dataSet = [];
  let self = this;
  experiment.getDataStoreAsJSON(function(rawData) {
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
    self.drawPieChart(canvas, dataSet);
  });
};

exports.webContent = new SearchbarStudyWebContent();

require("unload").when(
  function myDestructor() {
    console.info("Searchbar study destructor called.");
    exports.handlers.uninstallAll();
  });
