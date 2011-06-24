BaseClasses = require("study_base_classes.js");

// Information about the new tab page add-on
// helped by 
const ADDON_ID = "extensions.awesometab@abhinavsharma.me.install-event-fired";  //"awesomeTab@prospector.labs.mozilla";
const ADDON_PREF = "extensions.awesometab";
const INSTALL_URL = "https://addons.mozilla.org/firefox/downloads/file/123966/mozilla_labs_prospector_predictive_newtab-4-fx.xpi?src=external-1-3";
const INSTALL_HASH = "sha256:36b6dffa804eebcc7d8fe7855a3ff0bcae5ea2586276a8bd6135c45901a57453";


const PREF_PREFIX = "extensions.testpilot.";
const TEST_ID = "newBlankTabABstudy";

const CONFIRM_CHECK_EVERY = 1 * 60 * 1000;
const CONFIRM_CHECK_TRIGGER = 60 * 60 * 1000;
const CONFIRM_ICON = "chrome://testpilot/skin/testPilot_200x200.png";
const CONFIRM_QUESTION = "Test Pilot invites you to try a new design of new tab page for 1 week.\n\nFirefox will return to the original interface when the study finishes. You can also turn off the new design from the Add-ons Manager at any time.";
const CONFIRM_TITLE = "Activate a new Firefox interface for a week?";

const PREF_ALREADY_INSTALLED = PREF_PREFIX + TEST_ID + ".alreadyInstalled";
const PREF_METADATA = PREF_PREFIX + TEST_ID + ".metadata";
const PREF_PROMPTED = PREF_PREFIX + TEST_ID + ".prompted";
const PREF_SHUTDOWN = PREF_PREFIX + TEST_ID + ".shutdown";
const PREF_TESTPILOT = ADDON_PREF + "testpilot";

let modules = {};
Cu.import("resource://gre/modules/AddonManager.jsm", modules);
Cu.import("resource://gre/modules/Services.jsm", modules);
let {AddonManager, Services} = modules;




// -------------------------------- META DATA --------------------------------
exports.experimentInfo = {

  testName: "New Blank Tab A/B Testing",
  testId: TEST_ID, 
  testInfoUrl: "https://testpilot.mozillalabs.com/testcases/newtabpage",  // URL of page explaining your study
  summary: "Detect what users do after opening a new blank tab",
  thumbnail: "https://testpilot.mozillalabs.com/testcases/new-tab-study/newtabstudy-thumbnail.png", // URL of image representing your study (90x90)

  versionNumber: 1,
  duration: 5,       // days
  minTPVersion: "1.0a1",
  minFXVersion: "4.0b1",

  recursAutomatically: false,
  recurrenceInterval: 60, // days

  startDate: null,
  optInRequired: false,

  randomDeployment: { rolloutCode: "ur", minRoll: 61, maxRoll: 90},

  runOrNotFunc: function() {
   // Don't run for users on release channel
   let Application = Cc["@mozilla.org/fuel/application;1"]
     .getService(Ci.fuelIApplication);
   return (Application.prefs.getValue("app.update.channel", "") != "release");
 }

};

// METHOD CODES:
// unknown
//-----------------------start
//  command_t
//  plus_btn
//  double_click
//  file_menu
//------------------------ navigation
//  urlbar_enter
//  urlbar_go_btn
//  urlbar_drop_click
//  urlbar_drop_enter
//  urlbar_drop_button
//  search_enter
//  search_go_btn
//  search_drop_enter
//  search_drop_click
//  bookmark_bar
//  bookmark_menu
//  bookmark_top_sites
//  history_menu
//	addon_click
//------------------------leave
//  leave
//  close
//------------------------addon
//	addon_installed
//	addon_uninstalled
//	addon_prompted
//	addon_disabled
//	addon_enabled
//	addon_denied
//	addon_existed


exports.dataStoreInfo = {

  fileName: "new_tab_study.sqlite", // created in user's profile directory
  tableName: "new_tab_study",
  columns: [
    {property: "timestamp", type: BaseClasses.TYPE_DOUBLE, displayName: "Time"},
    {property: "addon", type: BaseClasses.TYPE_INT_32, displayName: "Tab Type"}, // addon=0 original tab; addon=1 newly designed tab.
    {property: "tab_id", type: BaseClasses.TYPE_DOUBLE, displayName: "Unique tab ID"}, //this is same as the timestamp when the tab is created
    {property: "event", type: BaseClasses.TYPE_STRING, displayName: "Event"},
    {property: "detail", type: BaseClasses.TYPE_STRING, displayName: "Method"},
    {property: "url", type: BaseClasses.TYPE_STRING, displayName: "URL"}
  ]
};

// addon status record
function addonRecord(addonType, eventString, detailString) {
  exports.handlers.record({
  	timestamp:	Date.now(),
    addon:		addonType,
    tab_id:		-1,
    event:		eventString,
    detail:		detailString,
    url:		""
  });
}

// new tab action record
function fullRecord(tabID, eventString, detailString, hashedURL) {
  exports.handlers.record({
  	timestamp:	Date.now(),
    addon:		UserAction.addon,
    tab_id:		tabID,
    event:		eventString,
    detail:		detailString,
    url:		hashedURL
  });
}

// UserAction object saves some features related with user action
// which will be used in identifying a tab, what and how a user does sth
var UserAction = {
  addon: 0,  //addon=0 no awesomeTab addon; addon=1 has awesomeTab
  tabID: null,
  urlbarDownPressed: false,
  searchbarDownPressed: false,
  method: null,
  event: null,

  clearAction: function() {
    // not change the tabID
    this.event = null;
    this.method = null;
    this.urlbarDownPressed = false;
    this.searchbarDownPressed = false;
    //dump("clear\n");
  },

  getTabID: function() {
    return this.tabID;
  },
  setTabID: function(tid) {
    this.tabID = tid;
  },
  clearTabID: function() {
    this.tabID = null;
  },
  getMethod: function() {
    //dump("get Method: "+this.method+"\n");
    return this.method;
  },
  setMethod: function(mtd) {
    this.method = mtd;
    //dump("set Method: "+this.method+"\n");
  },
  clearMethod: function() {
    this.method = null;
  },
  clearKeydownTrack: function() {
    this.urlbarDownPressed = false;
    this.searchbarDownPressed = false;
  }
};


//-------------------------------
// Define a per-window observer class by extending the generic one from
// BaseClasses:
function NewTabWindowObserver(window, globalInstance) {
  NewTabWindowObserver.baseConstructor.call(this, window, globalInstance);
}

BaseClasses.extend(NewTabWindowObserver, BaseClasses.GenericWindowObserver);



// -----------------------------
// assistant functions

// give a string, hash it in MD5
NewTabWindowObserver.prototype.hashedString = function(str) {
  try{
    let converter = exports.handlers.converterService;
    let md5 = exports.handlers.md5Service;

    //let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
    converter.charset = "UTF-8";
    //let md5 = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
    md5.init(md5.MD5);

    let result = {};
    let data = converter.convertToByteArray(str, result);
    md5.update(data, data.length);
    let hash = md5.finish(false);

    let toHexString = function(charCode) {
      return ("0"+charCode.toString(16)).slice(-2);
    }

    let s = [toHexString(hash.charCodeAt(i)) for (i in hash)].join("");
    //dump("hashed: "+str+"-->"+s+"\n");
    return s;
  }catch(err){
    //dump("[hashedString() ERROR] "+err+'\n');
    return "";
  }

}

// Get URL string from the url bar
NewTabWindowObserver.prototype.getUrlBarString = function() {
  try{
    let urlBar = this.window.document.getElementById("urlbar");
    let iOService = exports.handlers.iOService;
    let parsedUrl = iOService.newURI(urlBar.value, null, null);
    //return parsedUrl.scheme+"://"+parsedUrl.host;
    return this.hashedString(parsedUrl.host);
  }catch(err){
    //dump("[ERROR] getUrlBarString(): "+err+"\n");
  }
  return "";
};


// Get clipbord text
// and determine whether the text is a valid Url!
NewTabWindowObserver.prototype.getClipboard = function(){
  var clipboard = {content:"", isUrl: 0};
  try{
    let clip = exports.handlers.clipService;
    let trans = exports.handlers.transService;
    clip.getData(trans, clip.kGlobalClipboard);
    let str = {};
    let strLength = {};
    let clipboardText = "";
    trans.getTransferData("text/unicode", str, strLength);

    if(str) {
      str = str.value.QueryInterface(Components.interfaces.nsISupportsString);
      clipboardText = str.data.substring(0, strLength.value / 2);
      clipboardText = clipboardText.substring(0,10); // only get the first 10 characters
      var isClipboardUrl = 0;
      if(clipboardText.substring(0,4) == "http" || clipboardText.substring(0,3) == "www")
        isClipboardUrl = 1;

      clipboard.content = clipboardText;
      clipboard.isUrl = isClipboardUrl;
    }

  }catch(err){
    //dump("[ERROR] getClipboard(): "+ err +"\n");
  }
  return clipboard;
};



// Handling the tabID of current tab
NewTabWindowObserver.prototype.getCurrentTabID = function(){
  if(this.window.gBrowser != null) {
    let currentTab = this.window.gBrowser.selectedTab;
    let tabIDString = exports.handlers.sessionService.getTabValue(currentTab, "id");
    // if "id" is not set before, it will be undefined
    let tabID = 0;
    if(tabIDString.length >0 )
      tabID = parseInt(tabIDString);
    return tabID;
  }
};


NewTabWindowObserver.prototype.setCurrentTabID = function(){
  if(this.window.gBrowser != null) {
    let newTabID = Date.now();
    let currentTab = this.window.gBrowser.selectedTab;
    exports.handlers.sessionService.setTabValue(currentTab, "id", newTabID);
    return newTabID;
  }
};



// callback function for TabSelect event
// "this" in this function refers to "NewTabWindowObserver"
// tab id is saved in session for this tab
// if no id, it is a new tab; otherwise it is old.
NewTabWindowObserver.prototype.newTabSelected = function(event) {

  var prevTabID = UserAction.getTabID();
  var currentMethod = UserAction.getMethod();
  var tabID = this.getCurrentTabID();
  var domain = this.getUrlBarString();

  //dump("-[TabSelected] current tabID: " + tabID + "; prev tabID: "+prevTabID+"; domain: "+domain+", method: "+currentMethod+"\n");

  UserAction.clearTabID();
  UserAction.clearAction();

  try{

    if( tabID <= 0 && domain.length <= 0) {
      // START a new blank tab
      // so we give it an unique id
      let newTabID = this.setCurrentTabID();
      UserAction.setTabID(newTabID);
      //dump(Date.now() + " > new tab created: set tab id as "+newTabID+"\n");
      let clip = this.getClipboard();

      let startMethod = currentMethod;
      if(!startMethod)
        startMethod = "unknown";
      else if (startMethod == "close")
        startMethod = "unknown";

      dump(Date.now()+"-[START] " + startMethod + "; clipboard: " + clip.content + "\n");
      fullRecord(newTabID, "start", startMethod, "");
    }

    if(prevTabID>0) {
      ///// LEAVE
      let leaveMethod = currentMethod;
      if(leaveMethod != "leave" && leaveMethod != "close")
        leaveMethod = "leave";

      dump("-[LEAVE]" + leaveMethod + ", domain: " + domain + "\n");
      fullRecord(prevTabID, "leave", leaveMethod, domain);
    }

  }catch(err) {
    //dump("[newTabSelected ERROR] "+err+"\n");
  }

};



// callback function for loading a new page
// "this" in this function refers to "NewTabWindowObserver"
NewTabWindowObserver.prototype.newPageLoad = function(event) {

  var method = UserAction.getMethod();
  var tabID = this.getCurrentTabID();
  //var tabID = UserAction.getTabID();
  var domain = this.getUrlBarString();

  //dump("NEW PAGE LOADED DETECTED! "+tabID+","+method+","+domain+"\n");
  try {
    if(tabID > 0 && method && domain.length > 0 ) {
      dump("-[NAVIGATION] " + method + ", domain: " + domain + "\n");
      fullRecord(tabID, "navigation", method, domain);
      UserAction.clearAction();
    }
  }catch(err) {
    //dump("[newPageLoad() ERROR] "+err+"\n");
  }


};

// -------------------------------------------------------
// initialization function whenever a new window is opened
//
NewTabWindowObserver.prototype.install = function() {
  /*
  let window = this.window;
  let self = this;
  let gBrowser = window.gBrowser;
  */
  let self = this;
  let {window} = self;
  let {BrowserSearch, document, gBrowser, gURLBar, setTimeout} = window;
  if (gBrowser == null)
    return;


  // ------------------------------------------------
  // 0. OPEN/ClOSE A NEW BLANK TAB

  //// Tab selection event detection
  //// if this is a new tab, initialize the currentTabID
  //// otherwise currentTabID is reset
  //// Attention: use "self.newTabSelected()" so that in the newTabSelected funtion, "this" can refer to windowObserver and therefore "this.getUrlString()" & other similar calls make sense
  gBrowser.tabContainer.addEventListener("TabSelect", function() {self.newTabSelected();}, true);
  //window.gBrowser.tabContainer.addEventListener("TabOpen", function(evt){ dump("[open a tab]\n");}, false);
  gBrowser.tabContainer.addEventListener("TabClose", function(evt){
              //dump(" > close a tab\n");
              if(UserAction.getMethod() != "double_click")
              UserAction.setMethod("close");
            }, false);



  // ------------------------------------------------
  // 1. HOW TO OPEN A NEW TAB


  // 1.1 click the new tab button
    let tabBar = window.document.getElementById("TabsToolbar");
    this._listen(tabBar, "mouseup", function(evt) {
                  if (evt.button == 0) {
                    let targ = evt.originalTarget;
                    if (targ.id == "new-tab-button" || targ.className == "tabs-newtab-button") {
                      //dump(" > click the new tab button (+).\n");
                      UserAction.setMethod("plus_btn");
                    }
                  }
                }, false);


    // 1.2 double-click
    // double-click on tabbar may not open a new tab
    // even it opens a new tab, it cannot fire a "TabSelect" event
    this._listen(tabBar, "dblclick", function(evt) {
                   UserAction.setMethod("double_click");
                   //dump(Date.now() +" > double click. \n");
                   //self.newTabSelected("dblclick"); // trigger the event manually
                 }, true);


    // 1.3 File->New Tab
    // 1.4 command+T
    let filemenubutton = window.document.getElementById("key_newNavigatorTab");
    this._listen(filemenubutton, "command", function(evt){
                   //dump(" > FILE menu button!! \n");
                   UserAction.setMethod("command_t");
                 }, true);



  // ----------------------------------------------------
  // 2. NAVIGATION ACTIONS AFTER OPENGING A NEW BLANK TAB

  let appcontent = window.document.getElementById("appcontent");
  if (appcontent) {
    this._listen(appcontent, "DOMContentLoaded", this.newPageLoad, true);
  }

  // 2.1 Search Bar

  // search bar dropdown
  let searchBarDropdown = window.document.getElementById("PopupAutoComplete");
  this._listen(searchBarDropdown, "click", function(evt){
               //dump(" > click search bar dropdown.\n");
               UserAction.setMethod("search_drop_click");
               }, false);


  // Listen on search bar, by keyboard
  let searchBar = window.document.getElementById("searchbar");
  this._listen(searchBar, "keydown", function(evt) {
          if(evt.keyCode == 40) { // Down key

            //dump(" > search bar down key pressed.\n");
            UserAction.searchbarDownPressed = true;
          }
          if (evt.keyCode == 13) { // Enter key
            //dump("searchbar enter.\n");
            if(UserAction.searchbarDownPressed)
              UserAction.setMethod("search_drop_enter");
            else
              UserAction.setMethod("search_enter");
            UserAction.searchbarDownPressed = false; // reset once the enter is pressed
          }
        }, false);


  // Listen on search bar, by mouse
  this._listen(searchBar, "mouseup", function(evt) {
          if (evt.originalTarget.getAttribute("anonid") == "search-go-button") {
            //dump(" > search bar go button is clicked.\n");
            UserAction.setMethod("search_go_btn");
          }
           }, false);


  // 2.2 URL Bar
  // Listen on URL bar:
  let urlBar = window.document.getElementById("urlbar");
  this._listen(urlBar, "keydown", function(evt) {
          if(evt.keyCode == 40) { // Down key
            //dump(" > url bar down key pressed.\n");
            UserAction.urlbarDownPressed = true;
          }
          if (evt.keyCode == 13) { // Enter key
            // Enter key
            if(UserAction.urlbarDownPressed)
              UserAction.setMethod("urlbar_drop_enter");
            else
              UserAction.setMethod("urlbar_enter");
            UserAction.urlbarDownPressed = false;
          }

        }, false);


  // URLbar click go-button
  let urlGoButton = window.document.getElementById("urlbar-go-button");
  this._listen(urlGoButton, "mouseup", function(evt) {
          // Click URL bar go button
          //dump(' > url bar go-button.\n');
          UserAction.setMethod("urlbar_go_btn");
         }, false);


  // Dropdown
  // Observe when the most-frequently-used menu in the URL bar is opened

  this._listen(urlBar, "command", function(evt) {
           if (evt.originalTarget.getAttribute("anonid") == "historydropmarker") {
            // Click URL bar go button
            //dump(" > url bar drop button click.\n");
            UserAction.setMethod("urlbar_drop_btn");
           }
           }, false);


  // Get clicks on items in URL bar drop-down

  let urlbarDropdown = window.document.getElementById("PopupAutoCompleteRichResult");
  this._listen(urlbarDropdown, "click", function(evt){
          //dump(" > url bar dropdown click!!!!!\n");
          UserAction.setMethod("urlbar_drop_click");
        }, false);



  //2.3 Bookmarks

  // Bookmark main menu button -> bookmark item click

  let bookmarkmemu = window.document.getElementById("bookmarksMenuPopup");
  this._listen(bookmarkmemu, "command", function(evt){
          //dump(" > bookmark main menu click.\n");
          UserAction.setMethod("bookmark_menu");
        }, false);



  // Bookmark bar click
  let bookmarkbar = window.document.getElementById("PlacesToolbar");
  this._listen(bookmarkbar, "click", function(evt){
          //dump(" > bookmark bar clicked! \n");
          UserAction.setMethod("bookmark_bar");
        }, true);


  //2.4 History

  let historymenu = window.document.getElementById("goPopup");
  this._listen(historymenu, "command", function(evt){
                 //dump(" > history click.\n");
                 UserAction.setMethod("history_menu");
              }, true);
        
  // 2.5 Addon action
  this._listen(,,{});
  

}; // END of install()






// -------------------------------
function NewTabGlobalObserver() {
  // Call base class constructor.  Must pass in the class name of the
  // per-window observer class we want to use; the base class will register
  // it so that an instance gets constructed on every window open.
  NewTabGlobalObserver.baseConstructor.call(this, NewTabWindowObserver);

}


BaseClasses.extend(NewTabGlobalObserver,
                   BaseClasses.GenericGlobalObserver);




/* Other methods of the base class that you can override are:
 * .onNewWindow(window)
 * .onWindowClosed(window)
 ** .onAppStartup()
 ** .onAppShutdown()
 ** .onExperimentStartup(store)
 * .onExperimentShutdown()
 * .onEnterPrivateBrowsing()
 * .onExitPrivateBrowsing()
 * .doExperimentCleanup() // browser config reset
 * all these methods are called automatically at the apprporate times. */

// ------------------------------------------------------------------
// .onExperimentStartup(store)

/* onExperimentStartup() method gets called when the experiment 
 * starts up (which means once when the experiment starts 
 * for the first time, and then again every time Firefox restarts
 * until the experiment duration is over.) */
NewTabGlobalObserver.prototype.onExperimentStartup = function(store) {
  // "store" is a connection to the database table

  // *************
  // Install the add-on if it's not installed yet
  // Update UserAction.addon 
  function installAddon() {
    AddonManager.getAddonByID(ADDON_ID, function(addon) {
      // Set various prefs to remember our state
      let installed = addon != null;
      Services.prefs.setBoolPref(PREF_ALREADY_INSTALLED, installed)
      Services.prefs.setBoolPref(PREF_PROMPTED, true);

      // Configure the random testing [0, 3]
      Services.prefs.setIntPref(PREF_TESTPILOT, Math.floor(Math.random() * 4));

      // Already installed so nothing to do
      if (installed) {
      	dump("addon existed.\n");
      	UserAction.addon = 1;
        addonRecord(1, "addon", "addon_existed");
        return;
      }

      // Download and install the xpi
      AddonManager.getInstallForURL(INSTALL_URL, function(install) {
        // Make sure the user lets us install so canceling prevents future prompts
        let bag = Cc["@mozilla.org/hash-property-bag;1"].
                  createInstance(Ci.nsIWritablePropertyBag2).
                  QueryInterface(Ci.nsIWritablePropertyBag);
        bag.setProperty("promptType", "confirm");
        bag.setProperty("text", CONFIRM_QUESTION);
        bag.setProperty("title", CONFIRM_TITLE);

        // Open a dialog with a prompt to confirm
        let url = "chrome://global/content/commonDialog.xul";
        let features = "centerscreen,chrome,titlebar";
        let win = Services.ww.openWindow(null, url, "_blank", features, bag);

        // Set the icon to show test pilot
        win.addEventListener("DOMContentLoaded", function() {
          let icon = win.document.getElementById("info.icon");
          icon.style.listStyleImage = "url(" + CONFIRM_ICON + ")";
          dump("addon is prompted.\n");
          addonRecord(1, "addon", "addon_prompted");
        }, false);

        // Only install on accepting the prompt
        win.addEventListener("dialogaccept", function() {
          install.install();
          UserAction.addon = 1;
        }, false);

        // Record that the user said no
        win.addEventListener("dialogcancel", function() {
          dump("addon is denied.\n");
          addonRecord(1, "addon", "addon_denied");
        }, false);

        // Close this prompt if the study finishes or gets cancelled
        unload(function() win.close());
        
      }, "application/x-xpinstall", INSTALL_HASH);
    });
  }



  // All other settings and public services
  let self = this;
  NewTabGlobalObserver.superClass.onExperimentStartup.call(this, store);

  /* Any code that you only want to run once per Firefox session
   * can go here.  It can install additional observers if you like.
   * You also have access to XPCOM components through predefined
   * symbols Cc and Ci: */
   
  // *************
  // Track when the add-on changes state
  self.listener = {};
  ["disabled", "enabled", "installed", "uninstalled"].forEach(function(state) {
    let method = "on" + state[0].toUpperCase() + state.slice(1);
    self.listener[method] = function({id}) {
      if (id == ADDON_ID)
        addonRecord(1, "addon", "addon_"+state);
    };
  });
  AddonManager.addAddonListener(self.listener)
  unload(function() {
    AddonManager.removeAddonListener(self.listener);
    self.listener = null;
  });


  // *************
  // Keep checking if we should install the addon
  // Only half the users are asked to install the new tab add-on
  self.timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
  self.timer.initWithCallback({
    notify: function(timer) {
      let {testId} = exports.experimentInfo;
      // Only prompt to install once for this study
      try {
        if (Services.prefs.getBoolPref(PREF_PROMPTED))
          return;
      }
      catch(ex) {}

      // Only install after some time has passed
      let startDate = PREF_PREFIX + "startDate." + testId;
      let timeDiff = Date.now() - new Date(Services.prefs.getCharPref(startDate));
      if (timeDiff < CONFIRM_CHECK_TRIGGER)
        return;

      // Install the addon with some special configs
      // Only half the users will be asked, if the ur randomizer is even
      let Application = Cc["@mozilla.org/fuel/application;1"]
                        .getService(Ci.fuelIApplication);
      if(Application.prefs.getValue("extensions.testpilot.deploymentRandomizer.ur", "") % 2 == 0)
        installAddon();
    }
  }, CONFIRM_CHECK_EVERY, Ci.nsITimer.TYPE_REPEATING_SLACK);
  unload(function() {
    self.timer.cancel();
    self.timer = null;
  });



  // *************
  // Some public service in Firefox, call them once in order to speed up
  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

  this.iOService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

  this.clipService = Cc["@mozilla.org/widget/clipboard;1"].getService(Ci.nsIClipboard);
  this.transService = Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable);
  this.transService.addDataFlavor("text/unicode");

  this.sessionService = Cc["@mozilla.org/browser/sessionstore;1"].getService(Ci.nsISessionStore);

  //// for hash
  this.converterService = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
  this.converterService.charset = "UTF-8";
  this.md5Service = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
  this.md5Service.init(this.md5Service.MD5);


};

//---------------------------------------------
// .onAppShutdown()

GlobalObs.prototype.onAppShutdown = function() {
  // Ignore normal shutdowns
  if (Services.prefs.getBoolPref("extensions.testpilot.runStudies"))
    return;

  // Disable the add-on when turning off studies
  AddonManager.getAddonByID(ADDON_ID, function(addon) {
    if (addon == null)
      return;
    // Disable the add-on and remember that we did
    addon.userDisabled = true;
    Services.prefs.setBoolPref(PREF_SHUTDOWN, true);
  });
};


//---------------------------------------------
// .onAppStartup()

GlobalObs.prototype.onAppStartup = function() {
  // No need to restart if not previously shutdown
  if (!Services.prefs.prefHasUserValue(PREF_SHUTDOWN))
    return;

  // Re-enable the add-on when turning on studies
  AddonManager.getAddonByID(ADDON_ID, function(addon) {
    if (addon == null)
      return;

    // Enable the add-on and forget that it was shutdown
    addon.userDisabled = false;
    Services.prefs.clearUserPref(PREF_SHUTDOWN, true);
  });
};


// ----------------------------------------------
// reset the browser settings
// .doExperimentCleanup()

GlobalObs.prototype.doExperimentCleanup = function() {
  // Test pilot doesn't correctly shutdown before cleaning
  this.onExperimentShutdown();

  // Read out the add-on state for metadata
  AddonManager.getAddonByID(ADDON_ID, function(addon) {
    if (addon == null)
      return;

    // Remember the original state if we need to restore
    let origDisabled = addon.userDisabled;

    // Disable the add-on to get various prefs to be written
    addon.userDisabled = true;

    // Read out the important bits of the provider data
    let meta = {};
    try {
      let providerData = Services.prefs.getCharPref(ADDON_PREF + "providers");
      meta.providers = JSON.parse(providerData).map(function(data) {
        let {category, defaultIndex, hidden, providers, showIcon} = data;
        return {
          category: category,
          default: providers[defaultIndex].name,
          hidden: hidden,
          showIcon: showIcon,
        };
      });
    }
    catch(ex) {}

    // Remember what configuration was used
    try {
      meta.testpilot = Services.prefs.getIntPref(PREF_TESTPILOT);
      Services.prefs.clearUserPref(PREF_TESTPILOT);
    } catch(ex) {}

    // Track the usage behavior
    try {
      meta.usage = JSON.parse(Services.prefs.getCharPref(ADDON_PREF + "usage"));
    } catch(ex) {}

    // Save the metadata for later
    Services.prefs.setCharPref(PREF_METADATA, JSON.stringify(meta));

    // See if we need to uninstall the add-on
    let already = false;
    try {
      already = Services.prefs.getBoolPref(PREF_ALREADY_INSTALLED);
      Services.prefs.clearUserPref(PREF_ALREADY_INSTALLED);
    }
    catch(ex) {}

    // Restore the disabled state if the user had the add-on
    if (already)
      addon.userDisabled = origDisabled;
    // Remove the addon (which will clear prefs) to clean up
    else
      addon.uninstall();
  });

  // Clear out various prefs that get set during the study
  // NB: PREF_METADATA isn't cleared so that it can be read out later
  [PREF_PROMPTED, PREF_SHUTDOWN].forEach(function(pref) {
    try {
      Services.prefs.clearUserPref(pref);
    }
    catch(ex) {}
  });
};





// Instantiate and export the global observer (required!)
exports.handlers = new NewTabGlobalObserver();





// Finally, we make the web content, which defines what will show up on the
// study detail view page.
function NewTabWebContent()  {
  NewTabWebContent.baseConstructor.call(this, exports.experimentInfo);
}

BaseClasses.extend(NewTabWebContent, BaseClasses.GenericWebContent);


NewTabWebContent.prototype.__defineGetter__("dataCanvas",
  function() {
      return '<h4>Everyday activity:</h4><div id="data-plot-div1"></div>'+this.saveButtons + '</div>'
      + '<h4>Frequencies of Domains (The actual domain names are not recorded. We encrypt the domain names in a way that it is impossible for us to recover the domain names.):</h4><div id="data-plot-div2"></div>'+this.saveButtons+'</div>'
      + '<h4>Browsing methods:</h4><div id="data-plot-div3"></div>'+this.saveButtons + '</div>'
      + '<div class="dataBox"><h3>View Your Data:</h3>' +
        this.dataViewExplanation +
        this.rawDataLink;
  });



NewTabWebContent.prototype.__defineGetter__("dataViewExplanation",
  function() {
    return "<p>The study is used to collect data about how users behave after opening a new tab.</p>"
    +"<p>During the study from <span id='study-start-date-span'></span> to <span id='study-end-date-span'></span>, you have opened <span id='new-tab-num-span'></span> new tabs and loaded pages in new tabs for <span id='pageload-num-span'></span> times.</p>"
    +"<p>The frequency of loading a new page with different methods:<div id='method-freq-div'></div></p>"
    +"<p>Does the clipboard contain a URL when opening a new tab:<div id='clipboard-freq-div'></div></p>";
  });



// This function is called when the experiment page load is done
NewTabWebContent.prototype.onPageLoad = function(experiment,
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


  experiment.getDataStoreAsJSON(function(rawData) {

    let getFormattedDateString = function(timestamp) {
      let date = new Date(timestamp);
      let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
              "Sep", "Oct", "Nov", "Dec"];
      return months[date.getMonth()] + " " + date.getDate() + ", "
          + date.getFullYear();
    };

    var tabCounter = 0;
    var pageloadCounter = 0;

    var lastDate = "";
    var everydayTabs = {};
    var everydayDomains = {};

    var domains = [];
    var domainHash = {};
    var domainCounter = 0;

    var clipUrl = {'yes':0, 'no':0};
    var methodList = ["urlbar", "search", "bookmark", "history"];
    var methodHash = {"urlbar":0, "search":0, "bookmark":0, "history":0};

    var startTimestamp = 0;
    var lastTimestamp = Date.now();

    for each (let row in rawData) {

      let evt = row.event.toString();
      let mtd = row.method.toString();
      let ts = row.timestamp;
      let currentDate = getFormattedDateString(ts);
      let url = row.url.toString();
      let isClipUrl = parseInt(row.is_clipboard_url);

      if(startTimestamp == 0)
        startTimestamp = ts;

      if(currentDate != lastDate) {
        everydayTabs[currentDate] = 0;
        everydayDomains[currentDate] = 0;
        lastDate = currentDate;
      }

      if(evt == "start") {
        everydayTabs[lastDate] += 1;
        tabCounter += 1;
        if(isClipUrl == 1)
          clipUrl.yes += 1;
        else if(isClipUrl == 0)
          clipUrl.no += 1;
      }

      if(evt == "navigation" && url != "") {
        everydayDomains[lastDate] += 1;
        domains.push(url);
        pageloadCounter += 1;
        domainHash[url] = 0;
        if(methodList.indexOf(mtd.split('_')[0]) > -1)
          methodHash[mtd.split('_')[0]] += 1;
      }
    }

    for each (let url in domains) {
      domainHash[url] += 1;
    }

       // preparing data for everyday activity
       let i = 0;
       let everydayTabData = [];
       let everydayDomainData = [];
       let everydayAxisLabels = [];
       for (let dt in everydayTabs) {
         everydayTabData.push([i,everydayTabs[dt]]);
         everydayDomainData.push([i,everydayDomains[dt]]);
         everydayAxisLabels.push([i, dt]);
         i += 1;
       }

    // preparing data for domain counting
    //let domainString = "<ul>";
    //for(let url in domainHash)
    //  domainString += "<li>"+url+":"+domainHash[url]+"</li>";
    //domainString += "</ul>";

    let domainFreq = [];
    let domainData = [];
    let domainAxisLabels = [];
    i = 0;
    for each (let freq in domainHash)
      domainFreq.push( parseInt(freq) );
    domainFreq.sort( function(a,b){return b-a;} );
    for each (let freq in domainFreq) {
      domainData.push([i, freq]);
      domainAxisLabels.push([i+0.5, i+1]);
      i += 1;
    }

    // preparing for method counting
    let methodData = [];
    let methodString = "<ul>";
    let axisLabels = [];
    i = 0;
    for(let mtd in methodHash) {
      methodString += "<li>" + mtd + ":" + methodHash[mtd] + "</li>";
      methodData.push([i, methodHash[mtd]]);
      axisLabels.push([i+0.5, mtd]);
      i += 1;
    }
    methodString += "</ul>";

    let startSpan = document.getElementById("study-start-date-span");
    let endSpan = document.getElementById("study-end-date-span");
    if(startSpan) startSpan.innerHTML = getFormattedDateString(startTimestamp);
    if(endSpan) endSpan.innerHTML = getFormattedDateString(lastTimestamp);

    let numNewtabSpan = document.getElementById("new-tab-num-span");
    if(numNewtabSpan) numNewtabSpan.innerHTML = tabCounter;

    let pageloadSpan = document.getElementById("pageload-num-span");
    if(pageloadSpan) pageloadSpan.innerHTML = pageloadCounter;

    //let numDomainSpan = document.getElementById("main-domain-num-span");
    //if(numDomainSpan) numDomainSpan.innerHTML = domainString;

    let clipboardFreqDiv = document.getElementById("clipboard-freq-div");
    if(clipboardFreqDiv) clipboardFreqDiv.innerHTML = "<ul><li>Yes: " + clipUrl.yes + "</li><li>No:  " + clipUrl.no + "</li></ul>";

    let methodDiv = document.getElementById("method-freq-div");
    if(methodDiv) methodDiv.innerHTML = methodString;

    // Do plotting

    let plotDiv1 = document.getElementById("data-plot-div1");
    plotDiv1.style.width="500px";
    plotDiv1.style.height="300px";
    graphUtils.plot(plotDiv1,
            [{label: "#tabs", data: everydayTabData},
            {label: "#webpages", data: everydayDomainData}],
            {
              series:{lines: {show:true}, points: {show:true}},
              xaxis: {ticks:everydayAxisLabels},
              yaxis: {},
            }
            );

    let plotDiv2 = document.getElementById("data-plot-div2");
    plotDiv2.style.width="500px";
    plotDiv2.style.height="300px";
    graphUtils.plot(plotDiv2, [{label: "frequency of ranked domains",
                   data: domainData,
                   bars: {show: true}
                   }],
            {xaxis: {ticks:domainAxisLabels},
             yaxis: {},
            }
            );

    let plotDiv3 = document.getElementById("data-plot-div3");
    plotDiv3.style.width="500px";
    plotDiv3.style.height="300px";
    graphUtils.plot(plotDiv3, [{label: "frequency of browsing methods",
                   data: methodData,
                   bars: {show: true}
                   }],
            {xaxis: {ticks:axisLabels},
             yaxis: {},
            }
          );


   });


};

// Instantiate and export the web content (required!)
exports.webContent = new NewTabWebContent();

// Register any code we want called when the study is unloaded:
require("unload").when(
  function destructor() {
    // Do any module cleanup here.
  });
