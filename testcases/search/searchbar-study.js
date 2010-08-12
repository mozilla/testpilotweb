BaseClasses = require("study_base_classes.js");

/* TODO
 *
 * From firefox homepage, clicking "Images" incorrectly records as a search although
 * no search was done.  (Same with video link, news link, etc)
 *
 * Google, Yahoo, Bing have different search types (image, video, etc) - record which one
 * was used.
 *
 * Limit to just English locales OR ensure that international versions are recorded
 * separetely
 *
 * See spreadsheet
 *
 */

var UI_METHOD_CODES = {
  SEARCH_BOX: 0,
  WEBSITE: 1,
  MOZ_HOME_PAGE: 2,
  URL_BAR: 3,
  MENU_CONTENTS: 4
};

var EXP_GROUP_CODES = {
  CONTROL: 0,
  RANDOMIZED: 1,
  BING_2: 2,
  BING_LAST: 3,
  TWITTER_LAST: 4
};

var SEARCHBAR_EXPERIMENT_COLUMNS =  [
  {property: "engine_name", type: BaseClasses.TYPE_STRING, displayName: "Search Engine"},
  {property: "ui_method", type: BaseClasses.TYPE_INT_32, displayName: "UI method",
   displayValue: ["Search Box", "Website", "Firefox home page", "URL bar", "Menu Contents"]},
  {property: "engine_pos", type: BaseClasses.TYPE_INT_32, displayName: "Menu Position"},
  {property: "experiment_group", type: BaseClasses.TYPE_INT_32, displayName: "Experiment Group"},
  {property: "timestamp", type: BaseClasses.TYPE_DOUBLE, displayName: "Time",
   displayValue: function(value) {return new Date(value).toLocaleString();}}
];

// The order of this list is important because we accept the first match that we come to.
// So make sure the more specific regexps come before more general ones!

var SEARCH_RESULTS_PAGES = [
  {pattern: /www\.google\.com.+q=/, name: "Google"},
  {pattern: /www\.google\.com.+tbs=vid.+q=/, name: "Google Video"},
  {pattern: /maps\.google\.com.+q=/, name: "Google Maps"},
  {pattern: /news\.google\.com.+q=/, name: "Google News"},
  {pattern: /www\.google\.co\.\w\w.+q=/, name: "Google (International)"},
  {pattern: /www\.google\.\w\w.+q=/, name: "Google (International)"},
  {pattern: /news\.search\.yahoo\.com\/search\/news.+p=/, name: "Yahoo News"},
  {pattern: /shopping\.yahoo\.com\/search.+p=/, name: "Yahoo Shopping"},
  {pattern: /images\.search\.yahoo\.com\/search\/images.+p=/, name: "Yahoo Images"},
  {pattern: /video\.search\.yahoo\.com\/search\/video.+p=/, name: "Yahoo Video"},
  {pattern: /search\.yahoo\.co\.\w\w\/search.+p=/, name: "Yahoo (International)"},
  {pattern: /search\.yahoo\.\w\w\/search.+p=/, name: "Yahoo (International)"},
  {pattern: /\w\w\.search\.yahoo\.com\/search.+p=/, name: "Yahoo (International)"},
  {pattern: /search\.\w\w\.yahoo\.com\/search.+p=/, name: "Yahoo (International)"},
  {pattern: /search\.yahoo\.com\/search.+p=/, name: "Yahoo"},
  {pattern: /www\.amazon\.com\/s\?/, name: "Amazon"},
  {pattern: /www\.answers\.com\/main\/ntquery\?s=/, name: "Answers"},
  {pattern: /search\.creativecommons\.org\/\?q=/, name: "Creative Commons"},
  {pattern: /creativecommons\.org\/\?s=/, name: "Creative Commons"},
  {pattern: /shop\.ebay\.com.+_nkw=/, name: "Ebay"},
  {pattern: /en\.wikipedia\.org\/wiki.+\?search=/, name: "Wikipedia (en)"},
  {pattern: /wikipedia\.org\/wiki.+\?search=/, name: "Wikipedia (International)"},
  {pattern: /www\.bing\.com\/search\?q=/, name: "Bing"},
  {pattern: /twitter\.com.+search.+q=/, name: "Twitter"},
  {pattern: /www\.facebook\.com\/search\/\?/, name: "Facebook"}
];
// international Bing has param e.g. setmkt=ja-JP

//http://en.wikipedia.org/wiki/Test
//http://twitter.com/#search?q=test
// TODO more international versions of search engine URLs??

// Some Wikipedia searches not detected because if your serach term is exact match for
// a page title Wikipedia takes you straight there.

exports.experimentInfo = {
  startDate: null, // Null start date means we can start immediately.
  duration: 5, // Days
  testName: "Search Bar",
  testId: 8,
  testInfoUrl: "",
  summary: "Which search engines are used most often, whether through the "
           + "Firefox search bar or through web content?",
  thumbnail: "https://testpilot.mozillalabs.com/testcases/search/searchbar-thumbnail.png",
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
    exports.handlers.record(name, UI_METHOD_CODES.SEARCH_BOX, index);
  };

  // Listen for searches from search bar
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

  // Watch content space for search results pages loading
  let appcontent = this.window.document.getElementById("appcontent");
  if (appcontent) {
    this._listen(appcontent, "DOMContentLoaded", function(evt) {
                   let url = evt.originalTarget.URL;
                   for (let i = 0; i < SEARCH_RESULTS_PAGES.length; i++) {
                     let uiMethod = url.indexOf("client=firefox")>-1 ?
                                      UI_METHOD_CODES.MOZ_HOME_PAGE :
                                        UI_METHOD_CODES.WEBSITE;
                     let srp = SEARCH_RESULTS_PAGES[i];
                     if (srp.pattern.test(url)) {
                       exports.handlers.record(srp.name, uiMethod, 0);
                       break;
                     }
                   }
                 }, true);
    /* Twitter searches don't reload the page but go to a magic in page
     * anchor (i.e. twitter.com/#search?q=string) so we won't catch them
     * with DOMContentLoaded events... watch for the hashchange instead. */
    let win = this.window;
    this._listen(this.window, "hashchange", function(evt) {
                   let url = win.content.document.location;
                   if (/twitter\.com.+search.+q=/.test(url)) {
                     exports.handlers.record("Twitter", UI_METHOD_CODES.WEBSITE,
                                             0);
                   }
                 }, true);
  }

  // Watch URL bar for search terms being entered there
  let urlBar = this.window.document.getElementById("urlbar");
  let recordUrlBarSearch = function() {
    let text = urlBar.value;
    // Assume it's a search if there's a space and/or no period
    if ((text.indexOf(" ") > -1) || (text.indexOf(".") == -1)) {
      exports.handlers.record("Google", UI_METHOD_CODES.URL_BAR, 0);
    }
  };
  this._listen(urlBar, "keydown", function(evt) {
                 if (evt.keyCode == 13) { // Enter key
                   recordUrlBarSearch();
                 }}, false);
  let urlGoButton = this.window.document.getElementById("go-button");
  this._listen(urlGoButton, "mouseup", function(evt) {
                 recordUrlBarSearch();
               }, false);

  // TODO Watch context menu for the "search for selection" command
  // It doesn't generate a command event on the mainc ommand set or
  // main menu bar however.
};

function GlobalSearchbarObserver()  {
  GlobalSearchbarObserver.baseConstructor.call(this, SearchbarWindowObserver);
}
BaseClasses.extend(GlobalSearchbarObserver, BaseClasses.GenericGlobalObserver);
GlobalSearchbarObserver.prototype.onExperimentStartup = function(store) {
  GlobalSearchbarObserver.superClass.onExperimentStartup.call(this, store);

  let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                        .getService(Ci.nsIWindowMediator);
  let frontWindow = wm.getMostRecentWindow("navigator:browser");
  let searchSvc =  frontWindow.document.getElementById("searchbar").searchService;
  // See http://doxygen.db48x.net/mozilla/html/interfacensIBrowserSearchService.html

  // Don't want to change user's current selected engine, so store that...
  let currEng = searchSvc.currentEngine;

  // If this is the first run we need to assign you to an experiment group randomly
  // and change your search engine menu accordingly.
  let prefs = require("preferences-service");
  let prefName = "extensions.testpilot.searchbar_study.expGroupId";
  this._expGroupId = prefs.get(prefName, "");
  if (this._expGroupId == "") {
    this._expGroupId = Math.floor(Math.random()*5);
    prefs.set(prefName, this._expGroupId);
    switch (this._expGroupId) {
    case EXP_GROUP_CODES.CONTROL:
      // Control group - no change
      break;
    case EXP_GROUP_CODES.RANDOMIZED:
      // Randomize the order of your search engines
      let sortedEngines = searchSvc.getEngines();
      let newIndex = 0;
      while(sortedEngines.length > 0) {
        let index = Math.floor(Math.random()*sortedEngines.length);
        searchSvc.moveEngine(sortedEngines[index], newIndex);
        newIndex++;
        sortedEngines.splice(index, 1);
      }

      break;
    case EXP_GROUP_CODES.BING_2:
      searchSvc.addEngineWithDetails("Bing", "http://www.bing.com/favicon.ico",
                                     "Bing", "Bing Search", "get",
                                     "http://www.bing.com/search?q={searchTerms}");
      // Put Bing 2nd
      let bing = searchSvc.getEngineByName("Bing");
      searchSvc.moveEngine(bing, 1);
      break;
    case EXP_GROUP_CODES.BING_LAST:
      searchSvc.addEngineWithDetails("Bing", "http://www.bing.com/favicon.ico",
                                 "Bing", "Bing Search", "get",
                                 "http://www.bing.com/search?q={searchTerms}");
      break;
    case EXP_GROUP_CODES.TWITTER_LAST:
      searchSvc.addEngineWithDetails("Twitter", "http://search.twitter.com/favicon.png",
                                 "Twitter", "Twitter Search", "get",
                                 "http://search.twitter.com/search?q={searchTerms}");
      break;
    }
  }
  // restore selected engine in case it was messed up
  searchSvc.currentEngine = currEng;
  // Record what engines are installed and in what order:
  let sortedEngines = searchSvc.getEngines();
  for (let x = 0; x < sortedEngines.length; x++) {
    this.record(sortedEngines[x].name, UI_METHOD_CODES.MENU_CONTENTS, x);
  }
};
GlobalSearchbarObserver.prototype.record = function(searchEngine, uiMethod, index) {
  dump("Recording " + searchEngine + " " + uiMethod + " " + index + "\n");
  let expGroup = this._expGroupId;
  if (!this.privateMode) {
    this._store.storeEvent({
      engine_name: searchEngine,
      ui_method: uiMethod,
      engine_pos: index,
      experiment_group: expGroup,
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
      if (row.ui_method == UI_METHOD_CODES.MENU_CONTENTS) {
        continue;
      }
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
