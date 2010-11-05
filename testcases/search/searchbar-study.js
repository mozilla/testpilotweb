BaseClasses = require("study_base_classes.js");

/* TODO
 * Limit to just English locales OR ensure that international versions are recorded
 * separetely
 *
 * "Records two events when performing search by clicking Maps header"
 */

var UI_METHOD_CODES = {
  SEARCH_BOX: 0,
  WEBSITE: 1,
  MOZ_HOME_PAGE: 2,
  URL_BAR: 3,
  MENU_CONTENTS: 4,
  CONTEXT_MENU: 5,
  STUDY_VERSION: 6
};

var EXP_GROUP_CODES = {
  CONTROL: 0,
  RANDOMIZED: 1,
  BING_2: 2,
  BING_LAST: 3,
  TWITTER_LAST: 4
};

const GROUP_PREF = "extensions.testpilot.searchbar_study.expGroupId";
const OLD_MENU_PREF = "extensions.testpilot.searchbar_study.originalMenu";

var SEARCHBAR_EXPERIMENT_COLUMNS =  [
  {property: "engine_name", type: BaseClasses.TYPE_STRING, displayName: "Search Engine"},
  {property: "ui_method", type: BaseClasses.TYPE_INT_32, displayName: "UI method",
   displayValue: ["Search Box", "Website", "Firefox home page", "URL bar", "Menu Contents",
                  "Context Menu", "Study Version"]},
  {property: "engine_pos", type: BaseClasses.TYPE_INT_32, displayName: "Menu Position"},
  {property: "experiment_group", type: BaseClasses.TYPE_INT_32, displayName: "Experiment Group"},
  {property: "timestamp", type: BaseClasses.TYPE_DOUBLE, displayName: "Time",
   displayValue: function(value) {return new Date(value).toLocaleString();}}
];

// The order of this list is important because we accept the first match that we come to.
// So make sure the more specific regexps come before more general ones!

// TODO google maps (by click on link) double-counted?
var SEARCH_RESULTS_PAGES = [
  {pattern: /www\.google\.com.+tbs=vid.+q=/, name: "Google Video"},
  {pattern: /maps\.google\.com.+q=/, name: "Google Maps"},
  {pattern: /news\.google\.com.+q=/, name: "Google News"},
  {pattern: /www\.google\.com\/.+q=/, name: "Google"},
  {pattern: /www\.google\.co\.\w\w\/.+q=/, name: "Google (International)"},
  {pattern: /www\.google\.com\.\w\w\/.+q=/, name: "Google (International)"},
  {pattern: /www\.google\.\w\w\/.+q=/, name: "Google (International)"},
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
  {pattern: /www\.bing\.com\/images\/search\?q=/, name: "Bing Images"},
  {pattern: /www\.bing\.com\/videos\/search\?q=/, name: "Bing Video"},
  {pattern: /www\.bing\.com\/news\/search\?q=/, name: "Bing News"},
  {pattern: /www\.bing\.com\/recipe\/search\?q=/, name: "Bing Recipes"},
  {pattern: /www\.bing\.com\/search\?q=/, name: "Bing"},
  {pattern: /twitter\.com.+search.+q=/, name: "Twitter"},
  {pattern: /www\.facebook\.com\/search\/\?/, name: "Facebook"}
];
// international Bing has param e.g. setmkt=ja-JP
// http://en.wikipedia.org/wiki/Test
// TODO more international versions of search engine URLs??

// Some Wikipedia searches not detected because if your serach term is exact match for
// a page title Wikipedia takes you straight there.

exports.experimentInfo = {
  startDate: null, // Null start date means we can start immediately.
  duration: 7, // Days
  testName: "Search Interfaces",
  testId: 8,
  testInfoUrl: "https://testpilot.mozillalabs.com/testcases/searchui",
  summary: "What are the most used interfaces to access search engines through Firefox?",
  thumbnail: "https://testpilot.mozillalabs.com/testcases/search/searchbar-thumbnail.png",
  optInRequired: false,
  recursAutomatically: false,
  recurrenceInterval: 0,
  versionNumber: 3,
  minTPVersion: "1.0b4",
  minFXVersion: "4.0b4pre"
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
  let window = this.window;
  let searchBar = window.document.getElementById("searchbar");
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
  let appcontent = window.document.getElementById("appcontent");
  if (appcontent) {
    this._listen(appcontent, "DOMContentLoaded", function(evt) {
                   let win = evt.originalTarget.defaultView;
                   let url = win.history.current;

                   for (let i = 0; i < SEARCH_RESULTS_PAGES.length; i++) {
                     let srp = SEARCH_RESULTS_PAGES[i];
                     if (srp.pattern.test(url)) {
                       let uiMethod = UI_METHOD_CODES.WEBSITE;
                       // use MOZ_HOME_PAGE only if previous page was mozilla page
                       try {
                         let prev = win.history.previous;
                         if (prev.indexOf(".google.") > -1 &&
                             prev.indexOf("/firefox") > -1) {
                           uiMethod = UI_METHOD_CODES.MOZ_HOME_PAGE;
                         }
                       } catch(e) {}
                       exports.handlers.record(srp.name, uiMethod, 0);
                       break;
                     }
                   }
                 }, true);
    /* Twitter searches don't reload the page but go to a magic in page
     * anchor (i.e. twitter.com/#search?q=string) so we won't catch them
     * with DOMContentLoaded events... watch for the hashchange instead. */
    this._listen(window, "hashchange", function(evt) {
                   let url = window.content.document.location;
                   if (/twitter\.com.+search.+q=/.test(url)) {
                     exports.handlers.record("Twitter", UI_METHOD_CODES.WEBSITE,
                                             0);
                   }
                 }, true);
  }

  // Watch URL bar for search terms being entered there
  let urlBar = window.document.getElementById("urlbar");
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
  let urlGoButton = window.document.getElementById("go-button");
  this._listen(urlGoButton, "mouseup", function(evt) {
                 recordUrlBarSearch();
               }, false);

  // Watch context menu for the "search for selection" command
  let popup = window.document.getElementById("contentAreaContextMenu");
  this._listen(popup, "command", function(evt) {
                 if (evt.originalTarget.id == "context-searchselect") {
                   exports.handlers.record("", UI_METHOD_CODES.CONTEXT_MENU, 0);
                 }
               }, false);
};

function GlobalSearchbarObserver()  {
  GlobalSearchbarObserver.baseConstructor.call(this, SearchbarWindowObserver);
}
BaseClasses.extend(GlobalSearchbarObserver, BaseClasses.GenericGlobalObserver);
GlobalSearchbarObserver.prototype.getSearchSvc = function() {
  // See http://doxygen.db48x.net/mozilla/html/interfacensIBrowserSearchService.html
  let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                        .getService(Ci.nsIWindowMediator);
  let frontWindow = wm.getMostRecentWindow("navigator:browser");
  return frontWindow.document.getElementById("searchbar").searchService;
}
GlobalSearchbarObserver.prototype.onExperimentStartup = function(store) {
  GlobalSearchbarObserver.superClass.onExperimentStartup.call(this, store);

  let searchSvc = this.getSearchSvc();
  // Don't want to change user's current selected engine, so store that...
  let currEng = searchSvc.currentEngine;

  // If this is the first run we need to assign you to an experiment group randomly
  // and change your search engine menu accordingly.
  let prefs = require("preferences-service");
  dump("Looking for experiment group pref...\n");
  if (prefs.isSet(GROUP_PREF)) {
    this._expGroupId = prefs.get(GROUP_PREF);
    dump("Already set, using " + this._expGroupId + "\n");
  } else {
    this._expGroupId = Math.floor(Math.random()*5);
    prefs.set(GROUP_PREF, this._expGroupId);
    dump("Time to generate a new groupID!  Generated " + this._expGroupId + "\n");
    if (this._expGroupId != EXP_GROUP_CODES.CONTROL) {
      // before changing the search engine menu, record the old order in
      // a preference so we can put it back.
      this.rememberMenu();
    }
    switch (this._expGroupId) {
    case EXP_GROUP_CODES.CONTROL:
      // Control group - no change
      break;
    case EXP_GROUP_CODES.RANDOMIZED:
      // Randomize the order of your search engines
      let sortedEngines = searchSvc.getEngines();
      let newIndex = 0;
      while(sortedEngines.length > 0) {
        let index;
        if (newIndex == 0) {
          // Whatever engine was in first position (hint: Google), leave it
          // in first position when shuffling.
          index = 0;
        } else {
          index = Math.floor(Math.random()*sortedEngines.length);
        }
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
  this.record("", UI_METHOD_CODES.STUDY_VERSION, exports.experimentInfo.versionNumber);
  let sortedEngines = searchSvc.getEngines();
  for (let x = 0; x < sortedEngines.length; x++) {
    this.record(sortedEngines[x].name, UI_METHOD_CODES.MENU_CONTENTS, x);
  }
};
GlobalSearchbarObserver.prototype.rememberMenu = function() {
  let searchSvc = this.getSearchSvc();
  let prefs = require("preferences-service");
  let sortedEngines = searchSvc.getEngines();
  let originalMenu = [];
  for (let x = 0; x < sortedEngines.length; x++) {
    originalMenu.push(sortedEngines[x].name);
  }
  let string = JSON.stringify(originalMenu);
  prefs.set(OLD_MENU_PREF, string);
};
GlobalSearchbarObserver.prototype.record = function(searchEngine, uiMethod, index) {
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
GlobalSearchbarObserver.prototype.doExperimentCleanup = function() {
  // Restore user's search engine menu to its original state
  // TODO don't restore if they modified search engine menu during the study
  let searchSvc = this.getSearchSvc();
  let prefs = require("preferences-service");
  let originalMenu = JSON.parse(prefs.get(OLD_MENU_PREF, "[]"));
  let messedUpEngines = searchSvc.getEngines();
  for (let x = 0; x < messedUpEngines.length; x++) {
    let engName = messedUpEngines[x].name;
    let rightIndex = originalMenu.indexOf(engName);
    if (rightIndex == -1) {
      // engine was not in original menu: remove
      searchSvc.removeEngine(messedUpEngines[x]);
    } else {
      // Engine was in original menu: put it in the right place
      searchSvc.moveEngine(messedUpEngines[x], rightIndex);
    }
  }

  // More cleanup: remove prefs
  prefs.reset(OLD_MENU_PREF);
  prefs.reset(GROUP_PREF);
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
    return "Searches can be done in Firefox via several different interfaces -"
      + " the search bar, the URL bar, the context menu, the Firefox home page"
      + ", etc.  The pie chart below shows how often you used each interface.";
  });
SearchbarStudyWebContent.prototype.onPageLoad = function(experiment,
                                                         document,
                                                         graphUtils) {
  let canvas = document.getElementById("data-canvas");
  let dataSet = [];
  let self = this;
  let version = 1;
  let getName = function(row) {
    return SEARCHBAR_EXPERIMENT_COLUMNS[1].displayValue[row.ui_method];
  };
  experiment.getDataStoreAsJSON(function(rawData) {
    let counts = [0, 0, 0, 0, 0, 0];
    for each (let row in rawData) {
      switch (row.ui_method) {
      case UI_METHOD_CODES.MENU_CONTENTS:
        continue;
      case UI_METHOD_CODES.STUDY_VERSION:
        version = parseInt(row.engine_pos);
        continue;
      /* Correction - urlbar, context menu, and search box searches produce
       * an additional website/homepage event that we don't want to count.
       * Subtract from the total to keep the chart accurate. */
      case UI_METHOD_CODES.URL_BAR:
      case UI_METHOD_CODES.CONTEXT_MENU:
      case UI_METHOD_CODES.SEARCH_BOX:
        let countToCorrect = UI_METHOD_CODES.WEBSITE;
        if (version == 1) {
          countToCorrect = UI_METHOD_CODES.MOZ_HOME_PAGE;
          if (row.ui_method == UI_METHOD_CODES.SEARCH_BOX &&
              row.engine_name.indexOf("Google") == -1) {
            countToCorrect = UI_METHOD_CODES.WEBSITE;
          }
        }
        counts[countToCorrect] -= 1;
      }
      counts[row.ui_method] += 1;
    }
    for (let i = 0; i < counts.length; i++) {
      if (counts[i] > 0) {
        dataSet.push({ name: SEARCHBAR_EXPERIMENT_COLUMNS[1].displayValue[i],
        frequency: counts[i] });
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
