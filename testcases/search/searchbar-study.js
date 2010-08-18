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
 * Don't change the position of Google when randomizing the menu
 * Restore the menu to its original contents when the study is done!
 * (Do we get any notificiation when the study is finished that we can act on
 * here?)
 *
 */

var UI_METHOD_CODES = {
  SEARCH_BOX: 0,
  WEBSITE: 1,
  MOZ_HOME_PAGE: 2,
  URL_BAR: 3,
  MENU_CONTENTS: 4,
  CONTEXT_MENU: 5
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
   displayValue: ["Search Box", "Website", "Firefox home page", "URL bar", "Menu Contents",
                 "Context Menu"]},
  {property: "engine_pos", type: BaseClasses.TYPE_INT_32, displayName: "Menu Position"},
  {property: "experiment_group", type: BaseClasses.TYPE_INT_32, displayName: "Experiment Group"},
  {property: "timestamp", type: BaseClasses.TYPE_DOUBLE, displayName: "Time",
   displayValue: function(value) {return new Date(value).toLocaleString();}}
];

// The order of this list is important because we accept the first match that we come to.
// So make sure the more specific regexps come before more general ones!

var SEARCH_RESULTS_PAGES = [
  {pattern: /www\.google\.com.+tbs=vid.+q=/, name: "Google Video"},
  {pattern: /maps\.google\.com.+q=/, name: "Google Maps"},
  {pattern: /news\.google\.com.+q=/, name: "Google News"},
  {pattern: /www\.google\.com.+q=/, name: "Google"},
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
                     // TODO this is too broad:  client=firefox can show up in
                     // Google searches that are not from the Firefox homepage,
                     // as well.
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

  // Watch context menu for the "search for selection" command
  let popup = this.window.document.getElementById("contentAreaContextMenu");
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
  let prefName = "extensions.testpilot.searchbar_study.expGroupId";
  this._expGroupId = prefs.get(prefName, "");
  if (this._expGroupId == "") {
    this._expGroupId = Math.floor(Math.random()*5);
    if (this._expGroupId != EXP_GROUP_CODES.CONTROL) {
      // before changing the search engine menu, record the old order in
      // a preference so we can put it back.
      this.rememberMenu();
    }
    prefs.set(prefName, this._expGroupId);
    switch (this._expGroupId) {
    case EXP_GROUP_CODES.CONTROL:
      // Control group - no change
      break;
    case EXP_GROUP_CODES.RANDOMIZED:
      // Randomize the order of your search engines
      // TODO always leave Google in first position
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
GlobalSearchbarObserver.prototype.rememberMenu = function() {
  let searchSvc = this.getSearchSvc();
  let prefs = require("preferences-service");
  let prefName = "extensions.testpilot.searchbar_study.originalMenu";
  let sortedEngines = searchSvc.getEngines();
  let originalMenu = [];
  for (let x = 0; x < sortedEngines.length; x++) {
    originalMenu.push(sortedEngines[x].name);
  }
  let string = JSON.stringify(originalMenu);
  prefs.set(prefName, string);
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
  let prefName = "extensions.testpilot.searchbar_study.originalMenu";
  let originalMenu = JSON.parse(prefs.get(prefName, "[]"));
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
  prefs.reset(prefName);
  prefs.reset("extensions.testpilot.searchbar_study.expGroupId");
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
  // TODO show pie chart of UI method instead of pie chart of search engine
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
