BaseClasses = require("study_base_classes.js");

// Our Test Pilot study must implement and expose four things:
// 1. experimentInfo
// 2. dataStoreInfo
// 3. handlers
// 4. webContent
// We use the Cuddlefish 'exports' object to expose these.
const EVENT_CODE_STUDY_STARTUP = 0;

//global store variable
var dbstore;

// experimentInfo is an obect providing metadata about the study.
exports.experimentInfo = {

  testName: "Evaluation of New Security Feature",
  testId: 1338,  // must be unique across all test pilot studies
  testInfoUrl: "https://testpilot.mozillalabs.com/testcases/secure-sites-compatibility.html", // URL of page explaining your study, uncomment when ready
  summary: "This study is designed by the Web Security groups of Carnegie Mellon University"+
	  " and Stanford University to evaluate the backward compatibility of a new security feature.",
  thumbnail: "http://websec.sv.cmu.edu/images/seclab-128.png", // URL of image representing your study
  // (will be displayed at 90px by 90px)
  versionNumber: 1, // update this when changing your study
    // so you can identify results submitted from different versions

  duration: 3, // a number of days - fractions OK.
  minTPVersion: "1.0a1", // Test Pilot versions older than this
    // will not run the study.
  minFXVersion: "4.0b10", // Firefox versions older than this will
    // not run the study.

  // For studies that automatically recur:
  recursAutomatically: false,
  recurrenceInterval: 60, // also in days

  // When the study starts:
  startDate: null, // null means "start immediately".
  optInRequired: false // opt-in studies not yet implemented
};


// dataStoreInfo describes the database table in which your study's
// data will be stored (in the Firefox built-in SQLite database)
exports.dataStoreInfo = {
  fileName: "testpilot_entry_isolation_v2_results.sqlite",
  tableName: "testpilot_entry_isolation_v2_study",
  columns: [
    {property: "urlHash", type: BaseClasses.TYPE_STRING,
     displayName: "URL hash"},
    {property: "entryIndex", type: BaseClasses.TYPE_INT_32,
     displayName: "Index of entry host"},
    {property: "entryViolation", type: BaseClasses.TYPE_INT_32,
	    displayName: "Entry would violate policy?", displayValue:["No","Yes","Partially"]},
    {property: "hasParameter", type: BaseClasses.TYPE_INT_32,
	    displayName: "Violation caused by parameter?", displayValue:["No","Yes"]},
    {property: "pathHash", type:BaseClasses.TYPE_STRING,
	    displayName: "path hash"} 
  ]
};


// Define a per-window observer class by extending the generic one from
// BaseClasses:
function EntryPointWindowObserver(window, globalInstance) {
  // Call base class constructor (Important!)
  EntryPointWindowObserver.baseConstructor.call(this, window, globalInstance);
}
// set up EntryPointWindowObserver as a subclass of GenericWindowObserver:
BaseClasses.extend(EntryPointWindowObserver,
                   BaseClasses.GenericWindowObserver);
EntryPointWindowObserver.prototype.install = function() {

  //list of domains that opted into entry isolation. We have 4 categories of sites
  //web applications -> gmail, pivoltal tracker, last.fm, chatroulette
  //banking sites -> bank of america, chase, capital one, wellsfargo
  //news site / social network -> CNN, NYtimes, Facebook
  //Web store applications -> grooveshark, flixter
  let host_list = new Array(
		  /^mail\.google\.com$/gi,
		  /^((onlineeast[0-9])|(www)|(sitekey))\.bankofamerica\.com$/gi,
		  /^onlinebanking\.capitalone\.com$/gi,
		  /^chaseonline\.chase\.com$/gi,
		  /^online\.wellsfargo\.com$/gi,
		  /^www\.cisco\.com$/gi,
		  /^www\.pivotaltracker\.com$/gi,
		  /^www\.chatroulette\.com$/gi,
		  /^www\.last\.fm$/gi,
		  /^www\.cnn\.com$/gi,
		  /^www\.nytimes\.com$/gi,
		  /^www\.facebook\.com$/gi,
		  /^listen\.grooveshark\.com$/gi,
		  /^flixster\.rottentomatoes\.com$/gi
		  );
  
  
  //the protection boundary of each domain from the list above
  let allow_nav = new Array(
		  /^mail\.google\.com$/gi,
 		  /^([a-zA-Z0-9-_]+\.)*bankofamerica\.com$/gi,
		  /^([a-zA-Z0-9-_]+\.)*capitalone\.com$/gi,
		  /^([a-zA-Z0-9-_]+\.)*chase\.com$/gi,
		  /^([a-zA-Z0-9-_]+\.)*wellsfargo\.com$/gi,
		  /^([a-zA-Z0-9-_]+\.)*cisco\.com$/gi,
		  /^([a-zA-Z0-9-_]+\.)*pivotaltracker\.com$/gi,
		  /^([a-zA-Z0-9-_]+\.)*chatroulette\.com$/gi,
		  /^([a-zA-Z0-9-_]+\.)*last\.fm$/gi,
		  /^([a-zA-Z0-9-_]+\.)*cnn\.com$/gi,
		  /^([a-zA-Z0-9-_]+\.)*nytimes\.com$/gi,
		  /^([a-zA-Z0-9-_]+\.)*facebook\.com$/gi,
		  /^([a-zA-Z0-9-_]+\.)*grooveshark\.com$/gi,
		  /^([a-zA-Z0-9-_]+\.)*rottentomatoes\.com$/gi
		  );
  

  //entry point paths for our hosts
  let path_list = new Array("/","/","/","/","/","/","/","/","/","/","/","/","/","/");

  //secondary entry points
  let sec_entry = new Array(14);
  sec_entry[0] = new Array(4);   //gmail home page
  sec_entry[0][0] = /^\/a\/[^\/]*\/$/gi;
  sec_entry[0][1] = /^\/a\/[^\/]*\/#inbox\/$/gi;
  sec_entry[0][2] = /^\/mail\/\?hl=[a-zA-Z]*&tab=[a-zA-Z]*\/$/gi; 
  sec_entry[0][3] = /^\/mail\/$/gi;

  sec_entry[1] = new Array(4);//bank of america home page
  sec_entry[1][0] = /^\/cmsContent\/en_US\/eas-docs\/help\/help_tf\.html\/$/gi;
  sec_entry[1][1] = /^\/cmsContent\/en_US\/eas-docs\/help\/help_faq\.html\/$/gi;
  sec_entry[1][2] = /^\/cgi-bin\/ias\/[a-zA-Z]\/[0-9](\/GotoLogout)?\/$/gi;
  sec_entry[1][3] = /^\/cgi-bin\/ias\/[0-9]\/[a-zA-Z](\/GotoLogout)?\/$/gi;


  sec_entry[2] = new Array(3);//capital one home page
  sec_entry[2][0] = /^\/CapitalOne\/$/gi;
  sec_entry[2][1] = /^\/CapitalOne\/Enrollment\.aspx\/$/gi;
  sec_entry[2][2] = /^\/CapitalOne\/Help\.aspx\?[^\/]*\/$/gi;

  sec_entry[3] = new Array(6);//chase home page
  sec_entry[3][0] = /^\/Logon\.aspx\?[^\/]*\/$/gi;
  sec_entry[3][1] = /^\/Logon\.aspx\/$/gi;
  sec_entry[3][2] = /^\/MyAccounts\.aspx\/$/gi;
  sec_entry[3][3] = /^\/Secure\/OSL\.aspx\/$/gi;
  sec_entry[3][4] = /^\/secure\/LogOff\.aspx\/$/gi;
  sec_entry[3][5] = /^\/online\/home\/sso_co_home\.jsp\/$/gi;

  sec_entry[5] = new Array(4); //wellfargo home page
  sec_entry[5][0] = /^\/signon\/$/gi;
  sec_entry[5][1] = /^\/das\/cgi-bin\/session\.cgi\/$/gi;
  sec_entry[5][2] = /^\/das\/signon\/$/gi; 
  sec_entry[5][3] = /^\/das\/channel\/enrollDisplay\/$/gi; 

  sec_entry[5] = new Array(6);//cisco top pages
  sec_entry[5][0] = /^\/web\/learning\/netacad\/$/gi;
  sec_entry[5][1] = /^\/web\/about\/ac40\/about_cisco_careers_home\.html\/$/gi;
  sec_entry[5][2] = /^\/web\/learning\/le3\/learning_career_certifications_and_learning_paths_home\.html\/$/gi; 
  sec_entry[5][3] = /^\/en\/US\/support\/index\.html\/$/gi;
  sec_entry[5][4] = /^\/web\/products\/$/gi;
  sec_entry[5][5] = /^\/web\/login\/index\.html\/$/gi;

  sec_entry[6] = new Array(4);//pivoltal tracker top pages
  sec_entry[6][0] = /^\/signin\/$/gi;
  sec_entry[6][1] = /^\/learnmore\/$/gi;
  sec_entry[6][2] = /^\/help\/gettingstarted\/$/gi;
  sec_entry[6][3] = /^\/help\/thirdpartytools\/$/gi;

  sec_entry[7] = new Array(); //chat roulette

  sec_entry[8] = new Array(2);//last.fm
  sec_entry[8][0] = /^\/listen\/$/gi;
  sec_entry[8][1] = /^\/login\/$/gi;

  sec_entry[9] = new Array(5); // cnn
  sec_entry[9][0] = /^\/WORLD\/$/gi;
  sec_entry[9][1] = /^\/video\/$/gi;
  sec_entry[9][2] = /^\/POLITICS\/$/gi;
  sec_entry[9][3] = /^\/US\/$/gi;
  sec_entry[9][4] = /^\/TECH\/$/gi;

  sec_entry[10] = new Array(5); //NYTimes
  sec_entry[10][0] = /^\/pages\/todayspaper\/index\.html\/$/gi;
  sec_entry[10][1] = /^\/pages\/books\/index\.html\/$/gi;
  sec_entry[10][2] = /^\/best-sellers-books\/overview\.html\/$/gi;
  sec_entry[10][3] = /^\/ref\/membercenter\/nytarchive\.html\/$/gi;
  sec_entry[10][4] = /^\/pages\/opinion\/index\.html\/$/gi;

  sec_entry[11] = new Array(1); //facebook
  sec_entry[11][0] = /^\/login\.php\/$/gi;

  sec_entry[12] = new Array(1); //grooveshark
  sec_entry[12][0] = /^\/popular\/$/gi;

  sec_entry[13] = new Array(); //rottentomatoes

  url_tag = new Array(
		  "a",
		  "img",
		  "frame",
		  "object",
		  "script",
		  "area",
		  "base",
		  "iframe",
		  "input",
		  "link"
		  ); //tags that contain the URL element

  tag_attr = new Array(
		  "href",
		  "src",
		  "src",
		  "data",
		  "src",
		  "href",
		  "href",
		  "src",
		  "src",
		  "href"
		  ); //the attributes of each tag

  let appcontent = this.window.document.getElementById("appcontent");
  if (appcontent){ //listens to the DOM load event
 	this._listen(appcontent, "DOMContentLoaded", function(evt){

		   let content_doc = this.window.document.getElementById("content").contentDocument;
	    	   let my_doc = content_doc.documentElement.innerHTML; //HTML content of the main document
		   if (!my_doc)return false;
		   let doc_loc = ""+content_doc.location; //location of the document, converted to string

		   //Service for URL extraction			
		   let ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
		   //parse the url to extract the host name
		   let parsed_doc_loc = ioService.newURI(doc_loc, null, null);
		   let doc_loc_host = parsed_doc_loc.host;
		   const HOST_LEN = allow_nav.length;

		   //we want skip the study for all same "origin" navigations,  
		   for (var i=0; i<HOST_LEN; i++){
			if(doc_loc_host.search(allow_nav[i])!=-1) return;
		   }

		   //SHA-1, the proper way
		   let url_hash = b64_sha1(doc_loc);
		   //small DB hack to check if we have visited this page, to stop DB explsion
		   let db_query = "SELECT * FROM " + dbstore._tableName + " WHERE urlHash = :row_id";
		   let statement = dbstore._createStatement(db_query);
		   statement.params.row_id=url_hash;

		   var not_visited=1;
		   //we will execute the rest of our study asynchronously
		   //only if our DB does not have the data already
		   statement.executeAsync({
			handleResult: function(aResultSet){
		  	   if (aResultSet.getNextRow()){
				  not_visited=0;
			   }
			},

			handleCompletion: function(aReason) {
				if (not_visited){//a new page!
				   
				   let url_tag_len = url_tag.length;
				   let urls = new Array();

				   for (let i=0; i<url_tag_len; i++){  //for all tags that contain possible URL elements
					let ele_arr = content_doc.documentElement.getElementsByTagName(url_tag[i]); //if they appear on our page
					let ele_arr_len = ele_arr.length;
					
					for(let j=0; j<ele_arr_len; j++){ //for each element found
						let temp_url = ele_arr[j].getAttribute(tag_attr[i]);
						if (temp_url!="" && (temp_url.search(/^https?/gi)!=-1)){ //if it contains a url, we push it
						
							urls.push(temp_url);
						}
					}
				   }

				   let url_len = urls.length;
				   for (var i=0; i<url_len; i++){

					//extract the host name
					let parsed_URL = ioService.newURI(urls[i], null, null);
					let host = parsed_URL.host;

					//check if the hostname matches with one of the entry isolation hosts with our policy enabled
					let host_index = -1;
					let violation = 0;
					for (let j=0; j<HOST_LEN; j++){
						if (host.search(host_list[j])!=-1){ //Host name of our URL matches one of the entry hosts
							host_index = j;
							//now, we check if the relative PATHs match
							let rel_path = parsed_URL.path; 

							if (rel_path[rel_path.length-1]=='#' || rel_path[rel_path.length-1]=='?'){//remove ending '#' '?'
								console.info("First:"+rel_path);
								rel_path = rel_path.substring(0,rel_path.length-1);
								console.info("Second:"+rel_path);
							}

							if (rel_path.length==0)rel_path='/';
							else if (rel_path.length>0 && rel_path[rel_path.length-1]!='/')rel_path+='/'; //add ending back slash
							
							if (rel_path!=path_list[j]) violation=1;//Path mismatch with entry point path
						
							// check for secondary entry points
							for (let sec_ele=0; sec_ele < sec_entry[j].length; sec_ele++)
								if (rel_path.search(sec_entry[j][sec_ele])!=-1) violation=2;
							
							//does the URL have parameters?
							let has_param = 0;
							if (violation>0) has_param = (rel_path.search(/[\?|#]/gi)==-1) ? 0 : 1;	
							
							//we want to hash the path WITHOUT parameters	
							//therefore, remove everything after the '?' and '#' character
							let path_hash = rel_path;
							if (path_hash.search(/\?/gi) != -1){
								let temp_str = path_hash.split(/\?/gi);
								path_hash = temp_str[0];
								if (path_hash[path_hash.length-1]!='/')path_hash +='/';
							}	
							if (path_hash.search(/#/gi) != -1){
								let temp_str = path_hash.split(/#/gi);
								path_hash = temp_str[0];
								if (path_hash[path_hash.length-1]!='/')path_hash +='/';
							}
								
							//hash the path
							path_hash = b64_sha1(path_hash);

							//add element into db, we are not storing any URLs here, only the hash 
							//Note storing the URL hash is neccessary to stop DB from exploding in size
							exports.handlers.record({urlHash: url_hash, 
								entryIndex: host_index, 
								entryViolation: violation, 
								hasParameter: has_param, 
								pathHash:path_hash});
							break;
						}
					}
				   }
			   }
			}
		   });

	}, true);
  }
};


//sha1 crypto function
function b64_sha1(plaintext){

   let converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
	   createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
   converter.charset = "UTF-8"; 

   let result = {};
   let data = converter.convertToByteArray(plaintext, result);
   let ch = Components.classes["@mozilla.org/security/hash;1"].
	   createInstance(Components.interfaces.nsICryptoHash);

   ch.init(ch.SHA1);
   ch.update(data, data.length);
   let ciphertext = ch.finish(true);

   //at this point, url_hash should contain the b64 encode of the hash
   //these three lines are needed to prevent XSS filter from messing up our string
   ciphertext = ciphertext.replace(/\+/gi,"-");
   ciphertext = ciphertext.replace(/\//gi, "_"); 
   ciphertext = ciphertext.replace(/\=/gi, "Z"); //this is fine, since '=' is pading
   
   return ciphertext; 

}


// Now we'll define the global observer class by extending the generic one:
 function EntryPointGlobalObserver() {
   // It's very important that our constructor function calls the base
   // class constructor function:
   EntryPointGlobalObserver.baseConstructor.call(this,
                                                 EntryPointWindowObserver);
 }
 // use the provided helper method 'extend()' to handle setting up the
 // whole prototype chain for us correctly:
 BaseClasses.extend(EntryPointGlobalObserver,
                    BaseClasses.GenericGlobalObserver);


EntryPointGlobalObserver.prototype.onExperimentStartup = function(store) {
  // store is a reference to the live database table connection
  // you MUST call the base class onExperimentStartup and give it the store
  // reference:
  EntryPointGlobalObserver.superClass.onExperimentStartup.call(this, store);
  dbstore = store;
};

// Instantiate and export the global observer (required!)
exports.handlers = new EntryPointGlobalObserver();

// Finally, we make the web content, which defines what will show up on the
// study detail view page.
function StrictEntryWebContent()  {
  StrictEntryWebContent.baseConstructor.call(this, exports.experimentInfo);
}

// Again, we're extending a generic web content class.
BaseClasses.extend(StrictEntryWebContent, BaseClasses.GenericWebContent);

StrictEntryWebContent.prototype.__defineGetter__("dataCanvas",
  function() {
      return '<div class="dataBox"><h3>View Your Data:</h3>' +
      this.dataViewExplanation +
      this.rawDataLink +
      '<canvas id="data-canvas" width="480" height="400"></canvas>' +
      this.saveButtons + '</div>';
  });
StrictEntryWebContent.prototype.__defineGetter__("dataViewExplanation",
  function() {
    return "This study tests each website that you visit against the CMU and Stanford Web Security "
          + "groups' hypothetical &quot;Entry Isolation&quot; security policy.  The graph "
          + "below shows what fraction of the websites "
            + "would be in agreement with such a policy.";
  });


//graphing function
StrictEntryWebContent.prototype.onPageLoad = function(experiment, document, graphUtils){
  let self = this;
  let canvas = document.getElementById("data-canvas");
  experiment.getDataStoreAsJSON(function(rawData){
    let vio_count = 0;
    for each (let row in rawData){
      if (row.entryViolation == 1) vio_count++;
    }
    let row_count = rawData.length;

    if (row_count==0) row_count++; //if no data gathered, then it is 100% compatible

    let dataSet = [ { name: "Would violate policy", frequency: vio_count},
      {name: "Would not violate policy", frequency: row_count - vio_count}];
    self.drawPieChart(canvas, dataSet);
   });
};


// Instantiate and export the web content (required!)
exports.webContent = new StrictEntryWebContent();



// Register any code we want called when the study is unloaded:
require("unload").when(
  function destructor() {
    // Do any module cleanup here.
  });

// We're done!


