BaseClasses = require("study_base_classes.js");

// -------------------------------- META DATA --------------------------------
exports.experimentInfo = {

	testName: "New Tab Study",
	testId: "new_tab_study",	//  unique
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

// EVENT CODES:
// unknown
//-----------------------start
//	command_t
//	plus_btn
//	double_click
//	file_menu
//------------------------ navigation / cancelled_navigation
//	urlbar_enter
//	urlbar_go_btn
//	urlbar_drop_click
//	urlbar_drop_enter
//	urlbar_drop_button
//	search_enter
//	search_go_btn
//	search_drop_enter
//	search_drop_click
//	bookmark_bar
//	bookmark_menu
//  bookmark_top_sites
//	history_menu
//------------------------leave
//	leave
//	close


exports.dataStoreInfo = {

	fileName: "new_tab_study.sqlite", // created in user's profile directory
	tableName: "new_tab_study",
	columns: [
		{property: "timestamp", type: BaseClasses.TYPE_DOUBLE, displayName: "Time"},
		{property: "tab_id", type: BaseClasses.TYPE_DOUBLE, displayName: "Unique tab ID"}, //this is same as the timestamp when the tab is created
		{property: "event", type: BaseClasses.TYPE_STRING, displayName: "Event"},
		{property: "method", type: BaseClasses.TYPE_STRING, displayName: "Method"},
		{property: "url", type: BaseClasses.TYPE_STRING, displayName: "URL"},
		{property: "clipboard", type: BaseClasses.TYPE_STRING, displayName: "Clip Board"}, // this "clipboard" attribute is only used for testing, should be removed later
		{property: "is_clipboard_url", type: BaseClasses.TYPE_INT_32, displayName: "does Clip Board contain URL"}
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

// action related
NewTabWindowObserver.prototype.action = {

	clearAction: function() {
		exports.handlers.action.event = null;
		exports.handlers.action.method = null;
		exports.handlers.action.urlbarDownPressed = false;
		exports.handlers.action.searchbarDownPressed = false;
	},
	
	getMethod: function() {
		var mtd = exports.handlers.action.method;
		if(!mtd) {
			mtd = "unknown";
		}
		return mtd;
	},

	setMethod: function(mtd) {
		exports.handlers.action.method = mtd;
	},

	clearMethod: function() {
		exports.handlers.action.method = null;
	},

	clearKeydownTrack: function() {
		exports.handlers.action.urlbarDownPressed = false;
		exports.handlers.action.searchbarDownPressed = false;
	}
};



// Get URL string from the url bar
NewTabWindowObserver.prototype.getUrlBarString = function() {
	let urlBar = this.window.document.getElementById("urlbar");
	let parsedUrl = exports.handlers.iOService.newURI(urlBar.value, null, null);
	return parsedUrl.scheme+"://"+parsedUrl.host;
}



// Get clipbord text
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
			clipboardText = cbtext.substring(0,10); // only get the first 10 characters
			dump('clipboardData: ' + ClipboardText + '\n');
			var isClipboardUrl = 0;
			if(clipboardText.substring(0,4) == "http")
				isClipboardUrl = 1;
				
			clipboard.content = clipboardText;
			clipboard.isUrl = isClipboardUrl;
			
		}
		
	}catch(err){
		clipboardText = "";
		dump("[ERROR] getClipboardText(): "+ err +"\n");
	}
	return clipboard;
}



// Handling the tabID of current tab
NewTabWindowObserver.prototype = {
	getCurrentTabID: function(){
		let currentTab = this.window.gBrowser.selectedTab;
		let tabID = exports.handlers.sessionService.getTabValue(currentTab, "id");
		dump("tabID: "+tabID);
		// if "id" is not set before, it will be undefined
		return tabID;
	},
	
	setCurrentTabID: function(tabID){
		let currentTab = this.window.gBrowser.selectedTab;
		exports.handlers.sessionService.setTabValue(currentTab, "id", tabID);
	}
}



// "this" in this function refers to "NewTabWindowObserver"
// tab id is saved in session for this tab
// if no id, it is a new tab; otherwise it is old.
NewTabWindowObserver.prototype.newTabSelected = function(event) {
	var tabID = this.getCurrentTabID();
	var method = this.action.getMethod();
	var domain = this.getUrlBarString();
	this.clearaction();	
	if(tabID == undefined)
	{
		// START a new blank tab
		// so we give it an unique id
		let newTabID = Date.now();
		this.setCurrentTabID(newTabID);
		
		let clip = this.getClipboard();
		
		dump("[START] " + method + "; clipboard: " + clip.content + "\n");			
		this.record ({
			timestamp:	Date.now(), 
			tab_id:		newTabID,
			event:		"start", 
			method:		method, 
			url:		"",
			clipboard:	clip.content,
			is_clipboard_url: clip.isUrl
		});
		
	}else if(tabID) {
		
		///// LEAVE
		this.action.clearAction();
		dump("[LEAVE]" + method + ", domain: " + domain + "\n");
		this.record ({
			timestamp:	Date.now(), 
			tab_id:		tabID, 
			event:		"leave", 
			method:		method, 
			url:		domain,
			clipboard:	null,
			is_clipboard_url: null
		});
		
	}
	
}


	
// "this" in this function refers to "NewTabWindowObserver"
NewTabWindowObserver.prototype.newPageLoad = function(event) {

	var method = this.action.getMethod();
	var tabID = this.getCurrentTabID();
	var domain = this.getUrlBarString();
	this.action.clearKeydownTrack();
	this.action.clearMethod();
	
	if(tabID) {
		dump("[NAVIGATION] " + method + ", domain: " + domain + "\n");
		this.record ({
			timestamp:Date.now(), 
			tab_id:		tabID, 
			event:		"navigation", 
			method:		method, 
			url:		domain,
			clipboard:	null,
			is_clipboard_url: null
		});
	}
	
}




//.install() method will get called whenever a new window is opened
NewTabWindowObserver.prototype.install = function() {

	let window = this.window;
	let self = this;
	
	// ------------------------------------------------
	// 0. OPEN/ClOSE A NEW BLANK TAB
	
	//// Tab selection event detection
	//// if this is a new tab, initialize the currentTabID
	//// otherwise currentTabID is reset
	//// Attention: use "self.newTabSelected()" so that in the newTabSelected funtion, "this" can refer to windowObserver and therefore "this.getUrlString()" & other similar calls make sense 
	window.gBrowser.tabContainer.addEventListener("TabSelect", function() {self.newTabSelected();}, false);
	//window.gBrowser.tabContainer.addEventListener("TabOpen", function(evt){ dump("[open a tab]\n");}, false);
	window.gBrowser.tabContainer.addEventListener("TabClose", function(evt){self.action.setMethod("close");}, false);
    
	
	
	// ------------------------------------------------
	// 1. HOW TO OPEN A NEW TAB
	
	
	// 1.1 click the new tab button
    let tabBar = window.document.getElementById("TabsToolbar");
    this._listen(tabBar, "mouseup", function(evt) {
					if (evt.button == 0) {
						let targ = evt.originalTarget;
						if (targ.id == "new-tab-button" || targ.className == "tabs-newtab-button") {
							dump(" > click the new tab button (+)!!\n");
							self.action.setMethod("plus_button");
						} 
					}
    			}, false);
    
    
    // 1.2 double-click
    // double-click on tabbar may not open a new tab
    // even it opens a new tab, it cannot fire a "TabSelect" event
    this._listen(tabBar, "dblclick", function(evt) {
					dump(" > double click!!\n");
					self.action.setMethod("double_click");
					self.newTabSelected(); // trigger the event manually
    			}, false);
    
    
    // 1.3 File->New Tab
    // 1.4 command+T
    let filemenubutton = window.document.getElementById("menu_newNavigatorTab");
    this._listen(filemenubutton, "command", function(evt){
    				dump(" > FILE menu button!! \n");
    				self.action.setMethod("command_t");
    			}, false);
    


	// ----------------------------------------------------
	// 2. ACTIONS AFTER OPENNING A NEW TAB
	
	let appcontent = window.document.getElementById("appcontent");
	if (appcontent) {
		this._listen(appcontent, "DOMContentLoaded", this.newPageLoad, true);
	}					
	
	// 2.1 Search Bar
	
	// search bar dropdown
	let searchBarDropdown = window.document.getElementById("PopupAutoComplete");
	this._listen(searchBarDropdown, "click", function(evt){
					dump(" > click search bar dropdown");
					self.action.setMethod("search_drop_click");
				}, false);
	
	
	// Listen on search bar, by keyboard
	let searchBar = window.document.getElementById("searchbar");
	this._listen(searchBar, "keydown", function(evt) {
					if(evt.keyCode == 40) { // Down key
					
						dump(" > search bar down key pressed.\n");
						exports.handlers.action.searchbarDownPressed = true;					
					}
					if (evt.keyCode == 13) { // Enter key
					
						exports.handlers.action.searchbarDownPressed = false; // reset once the enter is pressed
						dump("searchbar enter.\n");						
						if(exports.handlers.action.searchbarDownPressed) {
							self.action.setMethod("search_drop_enter");
						}else {
							self.action.setMethod("search_enter");
						}						
					}
				}, false);
	
	
	// Listen on search bar, by mouse
	this._listen(searchBar, "mouseup", function(evt) {
					if (evt.originalTarget.getAttribute("anonid") == "search-go-button") {
						dump(" > search bar go button is clicked.\n");
						self.action.setMethod("search_go_btn");
					}
	   			}, false);
	
	
	// 2.2 URL Bar
	// Listen on URL bar:
	let urlBar = window.document.getElementById("urlbar");
	this._listen(urlBar, "keydown", function(evt) {				
					if(evt.keyCode == 40) { // Down key
						dump(" > url bar down key pressed.\n");
						exports.handlers.action.urlbarDownPressed = true;
					}					
					if (evt.keyCode == 13) { // Enter key
						// Enter key
						exports.handlers.action.urlbarDownPressed = false;
						if(exports.handlers.action.urlbarDownPressed) {
							self.action.setMethod("urlbar_drop_enter");
						}else{
							self.action.setMethod("urlbar_enter");
						}
					}
					
				}, false);
	
	
	// URLbar click go-button
	let urlGoButton = window.document.getElementById("urlbar-go-button");
	this._listen(urlGoButton, "mouseup", function(evt) {
					// Click URL bar go button
					dump(' > url bar go-button.\n');
					self.action.setMethod("urlbar_go_btn");
				 }, false);
	

	// Dropdown
	// Observe when the most-frequently-used menu in the URL bar is opened
	
	this._listen(urlBar, "command", function(evt) {
		 			if (evt.originalTarget.getAttribute("anonid") == "historydropmarker") {
						// Click URL bar go button
						dump(" > url bar drop button click.\n");
						self.action.setMethod("urlbar_drop_btn");					
		 			}
	   			}, false);

	
	// Get clicks on items in URL bar drop-down
	
	let urlbarDropdown = window.document.getElementById("PopupAutoCompleteRichResult");
	this._listen(urlbarDropdown, "click", function(evt){
					dump("url bar dropdown click!!!!!\n");
					self.action.setMethod("urlbar_drop_click");
				}, false);
	
	
	
	//2.3 Bookmarks
	
	// Bookmark main menu button -> bookmark item click
	
	let bookmarkmemu = window.document.getElementById("bookmarksMenuPopup");
	this._listen(bookmarkmemu, "command", function(evt){
					dump(" > bookmark main menu click.\n");
					self.action.setMethod("boookmark_menu");
				}, false);



	// Bookmark bar click
	let bookmarkbar = window.document.getElementById("PlacesToolbar");
	this._listen(bookmarkbar, "click", function(evt){			
					dump(" > bookmark bar clicked! \n");
					self.action.setMethod("bookmark_bar");	
				}, true);
	
	
	//2.4 History
	
	let historymenu = window.document.getElementById("goPopup");
	this._listen(historymenu, "command", function(evt){
					dump(" > history click.\n");
					self.action.setMethod("history_menu");
				}, true);
	
	
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


/* Override the onExperimentStartup() method - this method gets called
 * when the experiment starts up (which means once when the experiment
 * starts for the first time, and then again every time Firefox restarts
 * until the experiment duration is over.) */
NewTabGlobalObserver.prototype.onExperimentStartup = function(store) {
  // "store" is a connection to the database table
	
	NewTabGlobalObserver.superClass.onExperimentStartup.call(this, store);

  /* Any code that you only want to run once per Firefox session
   * can go here.  It can install additional observers if you like.
   * You also have access to XPCOM components through predefined
   * symbols Cc and Ci: */

  	let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

	this.action = {
		currentTabID: null,  
		urlbarDownPressed: false,
		searchbarDownPressed: false,
		method: null
	};
	
	this.iOService = Cc["@mozilla.org/network/io-service;1"]
					.getService(Ci.nsIIOService);
	
	this.clipService = Cc["@mozilla.org/widget/clipboard;1"]
						.getService(Components.interfaces.nsIClipboard),
	
	this.transService = Cc["@mozilla.org/widget/transferable;1"]
						.createInstance(Components.interfaces.nsITransferable);
	
	this.transService.addDataFlavor("text/unicode");
	
	this.sessionService = Cc["@mozilla.org/browser/sessionstore;1"]
						.getService(Components.interfaces.nsISessionStore);
  
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
      return '<h4>Frequencies of Domains (we do not collect actual domains but the hashed strings which cannot be recovered ack to the real domain names):</h4><div id="data-plot-div"></div>' +
      	this.saveButtons + '</div>'
      	+'<h4>Browsing methods:</h4><div id="data-plot-div2"></div>' +
      	this.saveButtons + '</div>'
      	+'<div class="dataBox"><h3>View Your Data:</h3>' +
      	this.dataViewExplanation +
      	this.rawDataLink;
  });
NewTabWebContent.prototype.__defineGetter__("dataViewExplanation",
  function() {
    return "<p>The study is used to collect data about how users behave after opening a new tab.</p>"
    +"<p>During the study from <span id='study-start-date-span'></span> to <span id='study-end-date-span'></span>, you have opened <span id='new-tab-num-span'></span> new tabs and loaded pages in new tabs for <span id='pageload-num-span'></span> times.</p>"
    +"<p>The browsing frequency of the main domains:<div id='main-domain-num-span'></div></p>"
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
	
		var tagCounter = 0;
		var pageloadCounter = 0;
		
		var domains = [];
		var domainHash = {};
		var domainCounter = 0;
		
		var clipbUrl = {'yes':0, 'no':0};
		var methodHash = {"urlbar":0, "search":0, "bookmark":0, "history":0};
		
		var startTimestamp = 0;
		var lastTimestamp = Date.now();
		
		for each (let row in rawData) {
			let evt = row.event;
			let mtd = row.method;
			let ts = row.timestamp;
			let url = row.url.toString();
			let isClipUrl = row.is_clipboard_url;
			
			if(startTimestamp == 0)
				startTimestamp = ts;
				
			if(evt == EVENTS.START) {
				tabCounter += 1;
				if(isClipUrl == 1) 
					clipUrl.yes += 1;
				else
					clipUrl.no += 1;
			}
			
			if(evt == "navigation" && url != "") {
				domains.push(url);
				pageloadCounter += 1;
				domainHash[url] = 0;
				methodHash[Math.floor(row.method/10)] += 1;
			}
		}
		for each (let url in domains) {
			domainHash[url] += 1;
		}
   	
		let domainData = [];
		let domainStr = "<ul>";
		let i = 0;
		for(let url in domainHash) {
			domainString += "<li>"+url+":"+domainHash[url]+"</li>";
			domainData.push([i, domainHash[url]]);
			i += 1;
		}
		domainString += "</ul>";
		domainData.sort(function(a, b) {return a[1] - b[1]});
    
		let methodData = [];
		let methodStrig = "<ul>";
		let axisLabels = [];
		i = 0;
		for(let mtd in methodHash) {
			methodStrig += "<li>" + mtd + ":" + methodHash[code] + "</li>";
			methodData.push([i, methodHash[mtd]]);
			axisLabels.push([i, mtd]);
			i += 1;
		}
		methodStrig += "</ul>";
    
		let getFormattedDateString = function(timestamp) {
			let date = new Date(timestamp);
			let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
							"Sep", "Oct", "Nov", "Dec"];
			return months[date.getMonth()] + " " + date.getDate() + ", "
					+ date.getFullYear();
		};
    
   	let startSpan = document.getElementById("study-start-date-span");
    let endSpan = document.getElementById("study-end-date-span");
    if(startSpan) startSpan.innerHTML = getFormattedDateString(startTimestamp);
    if(endSpan) endSpan.innerHTML = getFormattedDateString(last_timestamp);
    
    let numNewtabSpan = document.getElementById("new-tab-num-span");
    if(numNewtabSpan) numNewtabSpan.innerHTML = tabCounter;
    
    let pageloadSpan = document.getElementById("pageload-num-span");
    if(pageloadSpan) pageloadSpan.innerHTML = pageloadCounter;
    
    let numDomainSpan = document.getElementById("main-domain-num-span");
    if(numDomainSpan) numDomainSpan.innerHTML = domainString;
    
    let clipboardFreqDiv = document.getElementById("clipboard-freq-div");
    if(clipboardFreqDiv) clipboardFreqDiv.innerHTML = "<ul><li>Yes: " + clipUrl.no + "</li><li>No:  " + clipUrl.no + "</li></ul>";
    
    let methodDiv = document.getElementById("method-freq-div");
    if(methodDiv) methodDiv.innerHTML = methodString;
    
    // Do plotting
    
    let plotDiv = document.getElementById("data-plot-div");
    plotDiv.style.width="500px";
    plotDiv.style.height="300px";
    graphUtils.plot(plotDiv, [{label: "frequency of ranked domain",
                               data: domainData,
                               bars: {show: true}
                               }],
                    {xaxis: {},
                     yaxis: {},
                    }
                  );
    
    let plotDiv2 = document.getElementById("data-plot-div2");
    plotDiv2.style.width="500px";
    plotDiv2.style.height="300px";
    graphUtils.plot(plotDiv2, [{label: "frequency of browsing methods",
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
