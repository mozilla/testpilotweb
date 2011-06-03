BaseClasses = require("study_base_classes.js");

// -------------------------------- META DATA --------------------------------
exports.experimentInfo = {

  testName: "New Tab Study",
  testId: 1010,				//  unique
  testInfoUrl: "https://",	// URL of page explaining your study
  summary: "Detect what the users do after open a new blank tab",
  thumbnail: "http://", // URL of image representing your study (90x90)
  
  versionNumber: 1, 
  duration: 5, 			// days
  minTPVersion: "1.0a1",
  minFXVersion: "4.0", 
  
  recursAutomatically: false,
  recurrenceInterval: 60, // days

  startDate: null, 
  optInRequired: false 
};

// --------------- variables

const EVENTS = {
	START: 0,
	LOAD_PAGE: 1,
	LEAVE: 2
}

const METHODS = {
	COMMAND_T: 		000,	
	PLUS_BTN: 		001,	
	DOUBLE_CLICK: 	002,	
	MENU: 			003,
	//--------------------
	BAR_ENTER: 		100,	
	BAR_GO_BTN: 	101,	
	BAR_DROP_CLICK:	102,
	BAR_DROP_ENTER:	103,
	
	SEARCH_ENTER:	110,	
	SEARCH_GO_BTN:	111,
	
	TOP_SITES:		120,	
	BOOKMARK_BAR:	121,	
	BOOKMARK_MENU:	122,
	
	HISTORY_MENU:	130,
	
	BAR_DROP: 		199,
	//--------------------
	LEAVE: 			200,		
	CLOSE: 			201
}


// ----------------- database schema

// CODE
//tab_id: 
//		same as the timestamp when the tab was first created
// event:
//		0. start
//		1. load a page
//		2. leave (or kill) 
// method:
//		00. command+T; 01. plus-button; 02. double-click; 03. File->New Tab;
//		10. URLbar ENTER; 11. URLbar go-button; 12. URLbar drop-down ENTER/click; 13. search-box ENTER; 14. search-box search-go-button; 15. top site/most visited; 16. bookmark bar; 17. bookmarks menu			
//		20. navigate away; 21. close
//


exports.dataStoreInfo = {

  fileName: "new_tab_study.sqlite", // created in user's profile directory
  tableName: "new_tab_study",
  columns: [
    {property: "timestamp", type: BaseClasses.TYPE_DOUBLE, displayName: "Time"},
    {property: "tabid", type: BaseClasses.TYPE_DOUBLE, displayName: "Unique tab ID"}, //this is same as the timestamp when the tab is created
    {property: "event", type: BaseClasses.TYPE_INT_32, displayName: "Event"},
    {property: "method", type: BaseClasses.TYPE_INT_32, displayName: "Method"},
    {property: "url", type: BaseClasses.TYPE_STRING, displayName: "URL"}
  ]
};




//-------------------------------
// Define a per-window observer class by extending the generic one from
// BaseClasses:
function NewTabWindowObserver(window, globalInstance) {
  NewTabWindowObserver.baseConstructor.call(this, window, globalInstance);
}

BaseClasses.extend(NewTabWindowObserver,
                   BaseClasses.GenericWindowObserver);



// -----------------------------
// URL BAR STRING
NewTabWindowObserver.prototype.getUrlBarString = function() {
	let urlBar = this.window.document.getElementById("urlbar");
	//if(urlBar.value == "") {
	//	return "about:blank";
	//}else{
		arr = urlBar.value.split("/",3);
		return arr.join("/");
	//}
}


NewTabWindowObserver.prototype.newPageLoad = function(event) {
	var evt = exports.handlers.event;
	var evt_str = exports.handlers.event_string;
	var mtd = exports.handlers.method;
	var mtd_str = exports.handlers.method_string;
	
	exports.handlers.urlbar_down_pressed = false;
	exports.handlers.event = -1;
	exports.handlers.event_string = "";
	exports.handlers.method = -1;
	exports.handlers.method_string = "";
	
	var tid = exports.handlers.current_tab_id;
	var domain = this.getUrlBarString();
	
	if(tid>0 && mtd>0 && evt>0) {
		dump("[RECORD] "+Date.now()+","+tid+","+evt_str+","+mtd_str+","+domain+"\n");
		this.record ({
			timestamp:Date.now(), 
			tabid:tid, 
			event:evt, 
			method:mtd, 
			url:domain
		});

	}
}

//.install() method will get called whenever a new window is opened
NewTabWindowObserver.prototype.install = function() {
	
	dump("Starting to install listeners for NewTabWindowObserver. " +Date.now() +"\n");
	let window = this.window;
	let self = this;
	// ------------------------------------------------
	// 1. OPEN A NEW BLANK TAB
	
	//// Tab selection event detection
	//// if this is a new tab, initialize the current_tab_id
	//// otherwise current_tab_id is reset
	window.gBrowser.tabContainer.addEventListener("TabSelect", newTabSelected, false);
	function newTabSelected(event) {
		
		//var browser = window.gBrowser.selectedBrowser;
		var url_domain = self.getUrlBarString();
		if( url_domain == "" )
		{
			//// START a new tab
			exports.handlers.current_tab_id = Date.now();
			
			dump("[RECORD] start "+Date.now()+","+exports.handlers.current_tab_id+","+EVENTS.START+","+ METHODS.COMMAND_T+",about:blank"+"\n");			
			self.record ({
				timestamp:	Date.now(), 
				tabid:		exports.handlers.current_tab_id, 
				event:		EVENTS.START, 
				method:		METHODS.COMMAND_T, 
				url:		"about:blank"
			});
			
		}else{
			if(exports.handlers.current_tab_id >0) {
				//// LEAVE a new tab
				
				dump("[RECORD] leave "+Date.now()+","+exports.handlers.current_tab_id+","+EVENTS.LEAVE+","+ METHODS.LEAVE+","+url_domain+"\n");
				self.record ({
					timestamp:	Date.now(), 
					tabid:		exports.handlers.current_tab_id, 
					event:		EVENTS.START, 
					method:		METHODS.LEAVE, 
					url:		url_domain
				});
				exports.handlers.current_tab_id = -1;
				
				dump(" > current_tab_id="+exports.handlers.current_tab_id+'\n');
				
			}
		}
		
		dump("Tab selected | current_tab_id="+exports.handlers.current_tab_id+" |Domain:"+self.getUrlBarString()+"\n");
		exports.handlers.urlbar_down_pressed = false;
		
	}
	
	
	// ----------------------------------------------------
	// 2. ACTIONS AFTER OPENNING A NEW TAB
	
	
	let appcontent = window.document.getElementById("appcontent");
	if (appcontent) {
		dump("add newpageload listener.\n");
		this._listen(appcontent, "DOMContentLoaded", this.newPageLoad, true);
	}
    					
	
	// 2.1 Search Bar
	
	// Listen on search bar, by keyboard
	let searchBar = window.document.getElementById("searchbar");
	this._listen(searchBar, "keydown", function(evt) {
				 if (evt.keyCode == 13) { 
				 	// Enter key
				 	if(exports.handlers.current_tab_id>0) {
				 		dump("searchbar enter.\n");
				 		exports.handlers.event = EVENTS.LOAD_PAGE;
				 		exports.handlers.event_string = "EVENTS.LOAD_PAGE";
				 		exports.handlers.method = METHODS.SEARCH_ENTER;
				 		exports.handlers.method_string = "METHODS.SEARCH_ENTER";		 		
					}
				 }
			   }, false);
	
	// Listen on search bar, by mouse
	this._listen(searchBar, "mouseup", function(evt) {
				 if (evt.originalTarget.getAttribute("anonid") == "search-go-button") {
					// Click search go button
					if(exports.handlers.current_tab_id>0) {
						dump("search bar click.\n");
				 		exports.handlers.event = EVENTS.LOAD_PAGE;
				 		exports.handlers.event_string = "EVENTS.LOAD_PAGE";
				 		exports.handlers.method = METHODS.SEARCH_GO_BTN;
				 		exports.handlers.method_string = "METHODS.SEARCH_GO_BTN";
					}
				 }
			   }, false);
	
	
	
	// 2.2 URL Bar
	// Listen on URL bar:
	let urlBar = window.document.getElementById("urlbar");
	this._listen(urlBar, "keydown", function(evt) {
				if(evt.keyCode == 40) {
					exports.handlers.urlbar_down_pressed = true;
					dump("url bar down key pressed.\n");
				}
				
				if (evt.keyCode == 13) { 
					// Enter key
					if(exports.handlers.current_tab_id>0) {
				 		exports.handlers.event = EVENTS.LOAD_PAGE;
				 		exports.handlers.event_string = "EVENTS.LOAD_PAGE";
						if(exports.handlers.urlbar_down_pressed)
						{
							exports.handlers.method = METHODS.BAR_DROP_ENTER;
				 			exports.handlers.method_string = "METHODS.BAR_DROP_ENTER";
						}else{
							exports.handlers.method = METHODS.BAR_ENTER;
				 			exports.handlers.method_string = "METHODS.BAR_ENTER";
						}						
					}
					exports.handlers.urlbar_down_pressed = false;
				}
			}, false);
	
	// URLbar click go-button
	let urlGoButton = window.document.getElementById("urlbar-go-button");
	this._listen(urlGoButton, "mouseup", function(evt) {
					// Click URL bar go button
					if(exports.handlers.current_tab_id>0) {
						dump('url bar go-button.\n');
				 		exports.handlers.event = EVENTS.LOAD_PAGE;
				 		exports.handlers.event_string = "EVENTS.LOAD_PAGE";
				 		exports.handlers.method = METHODS.BAR_GO_BTN;
				 		exports.handlers.method_string = "METHODS.BAR_GO_BTN";
					}
				 }, false);
	

	// Dropdown
	// Observe when the most-frequently-used menu in the URL bar is opened
	
	this._listen(urlBar, "command", function(evt) {
				 if (evt.originalTarget.getAttribute("anonid") == "historydropmarker") {
					// Click URL bar go button
					
					
					dump(urlBar.childNodes.length+"\n");
					for(var i=0; i<urlBar.childNodes.length; i++) {
						dump(urlBar.childNodes[i].className+"\n");
						if(urlBar.childNodes[i].className == "autocomplete-result-popupset") {
							return urlBar.childNodes[i];
						}
					}
	
	
					if(exports.handlers.current_tab_id>0) {
						dump("bar drop click.\n");
						exports.handlers.event = EVENTS.LOAD_PAGE;
				 		exports.handlers.event_string = "EVENTS.LOAD_PAGE";
				 		exports.handlers.method = METHODS.BAR_DROP_CLICK;
				 		exports.handlers.method_string = "METHODS.BAR_DROP_CLICK";						
					}
				 }
			   }, false);
	/* TODO Get clicks on items in URL bar drop-down (or whether an awesomebar
	* suggestion was hilighted when you hit enter?)  */
	
	
	//2.3 Bookmarks
	
	// Bookmark main menu button -> bookmark item click
	
	let bookmarkmemu = window.document.getElementById("bookmarksMenuPopup");
	this._listen(bookmarkmemu, "command", function(evt){
	
	    	dump("bookmark main menu click.\n");
			exports.handlers.event = EVENTS.LOAD_PAGE;
			exports.handlers.event_string = "EVENTS.LOAD_PAGE";
			exports.handlers.method = METHODS.BOOKMARK_MENU;
			exports.handlers.method_string = "METHODS.BOOKMARK_MENU";		 
				 		
	    	// function newPageLoad(event) {
 	    	//	dump(" > Page loaded!\n");
			// 	    		dump("[RECORD] "+Date.now()+","+exports.handlers.current_tab_id+",EVENTS.LOAD_PAGE, METHODS.BOOKMARK_MENU,"+self.getUrlBarString()+"\n");
			// 	    	
			// 				self.record ( {timestamp: Date.now(), tabid: exports.handlers.current_tab_id, event: EVENTS.LOAD_PAGE, method: METHODS.BOOKMARK_MENU, url: self.getUrlBarString()} );
			// 				
			// 				window.gBrowser.removeEventListener("load", newPageLoad, true);				
			// 	    	}
			// window.gBrowser.addEventListener("load", newPageLoad, true);

	    }, true);

	// Bookmark bar click
	let bookmarkbar = window.document.getElementById("PlacesToolbar");
	this._listen(bookmarkbar, "click", function(evt){			
			if(exports.handlers.current_tab_id>0) {
				dump("bookmark bar clicked! id="+evt.target.id+"\n");
				exports.handlers.event = EVENTS.LOAD_PAGE;
				exports.handlers.event_string = "EVENTS.LOAD_PAGE";
				exports.handlers.method = METHODS.BOOKMARK_BAR;
				exports.handlers.method_string = "METHODS.BOOKMARK_BAR";
			}			
	}, true);
	
	
	//2.4 History
	
	let historymenu = window.document.getElementById("goPopup");
	    this._listen(historymenu, "command", function(evt){	    	
			dump("history click.\n");
			exports.handlers.event = EVENTS.LOAD_PAGE;
			exports.handlers.event_string = "EVENTS.LOAD_PAGE";
			exports.handlers.method = METHODS.HISTORY_MENU;
			exports.handlers.method_string = "METHODS.HISTORY_MENU";			
	    }
	    , true);
};






// -------------------------------
function NewTabGlobalObserver() {
  // Call base class constructor.  Must pass in the class name of the
  // per-window observer class we want to use; the base class will register
  // it so that an instance gets constructed on every window open.
  NewTabGlobalObserver.baseConstructor.call(this, NewTabWindowObserver);
  
}


BaseClasses.extend(NewTabGlobalObserver,
                   BaseClasses.GenericGlobalObserver);


/* Override the onExperimentStartup() method - this method gets called
 * when the experiment starts up (which means once when the experiment
 * starts for the first time, and then again every time Firefox restarts
 * until the experiment duration is over.) */
NewTabGlobalObserver.prototype.onExperimentStartup = function(store) {
  // "store" is a connection to the database table
	
	dump("New tab study starts.");
	
	NewTabGlobalObserver.superClass.onExperimentStartup.call(this, store);

  /* Any code that you only want to run once per Firefox session
   * can go here.  It can install additional observers if you like.
   * You also have access to XPCOM components through predefined
   * symbols Cc and Ci: */

  let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                        .getService(Ci.nsIWindowMediator);

//global variables
  this.current_tab_id = -1;  
  this.urlbar_down_pressed = false;
  this.event = -1;
  this.event_string = "";
  this.method = -1;
  this.method_string = "";
  
};

/* Other methods of the bae class that you can override are:
 * .onNewWindow(window)
 * .onWindowClosed(window)
 * .onAppStartup()
 * .onAppShutdown()
 * .onExperimentStartup(store)
 * .onExperimentShutdown()
 * .onEnterPrivateBrowsing()
 * .onExitPrivateBrowsing()
 * .doExperimentCleanup() // browser config reset
 * all these methods are called automatically at the apprporate times. */




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
      return '<div class="dataBox"><h3>View Your Data:</h3>' +
      this.dataViewExplanation +
      this.rawDataLink +
      '<div id="data-plot-div" style="width:480x;height:800px"></div>' +
      this.saveButtons + '</div>';
  });
NewTabWebContent.prototype.__defineGetter__("dataViewExplanation",
  function() {
    return "This is a totally made up example study that means nothing.";
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
};

// Instantiate and export the web content (required!)
exports.webContent = new NewTabWebContent();

// Register any code we want called when the study is unloaded:
require("unload").when(
  function destructor() {
    // Do any module cleanup here.
  });
