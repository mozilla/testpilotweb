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

  testName: "Evaluation of Proposed Security Standard",
  testId: 1337,  // must be unique across all test pilot studies
  testInfoUrl: "https://testpilot.mozillalabs.com/testcases/secure-sites-compatibility.html", // URL of page explaining your study, uncomment when ready
  summary: "This study is designed by the Web Security group of Carnegie Mellon University"+
	  " to evaluate the backward compatibility of a new security feature.",
  thumbnail: "http://websec.sv.cmu.edu/images/seclab-128.png", // URL of image representing your study
  // (will be displayed at 90px by 90px)
  versionNumber: 1, // update this when changing your study
    // so you can identify results submitted from different versions

  duration: 3, // a number of days - fractions OK.
  minTPVersion: "1.0a1", // Test Pilot versions older than this
    // will not run the study.
  minFXVersion: "3.6", // Firefox versions older than this will
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
  fileName: "testpilot_entry_isolation_results.sqlite",
  tableName: "testpilot_entry_isolation_study",
  columns: [
    {property: "urlHash", type: BaseClasses.TYPE_STRING,
     displayName: "URL HASH"},
    {property: "entryIndex", type: BaseClasses.TYPE_INT_32,
     displayName: "Index of entry host"},
    {property: "entryViolation", type: BaseClasses.TYPE_INT_32,
	    displayName: "Entry would violate policy?", displayValue:["No","Yes","Partially"]}
  ]
};


/* Now for the actual observation of the events that we care about.
 * We must register a global observer object; we can optionally also
 * register a per-window observer object.  Each will get notified of
 * certain events, and can install further listeners/observers of their own.
 */

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

  //list of hosts that hypothetically opted in to strict entry
  let host_list = new Array(
		  "mail.google.com",//gmail first for a reason
		  "www.bankofamerica.com",
		  "www.wellsfargo.com",
		  "www.chase.com",
		  "www.cisco.com",
		  "www.pivotaltracker.com",
		  "www.chatroulette.com",
		  "www.last.fm",
		  "www.cnn.com",
		  "www.nytimes.com");
  //entry point paths for our hosts
  let path_list = new Array("/mail/","/","/","/","/","/","/","/","/","/");

  let appcontent = this.window.document.getElementById("appcontent");
  if (appcontent){ //listens to the DOM load event
 	this._listen(appcontent, "DOMContentLoaded", function(evt){

		   let content_doc = this.window.document.getElementById("content").contentDocument;
	    	   let my_doc = content_doc.documentElement.innerHTML; //HTML content of the main document
		   if (!my_doc)return false;

		   let doc_loc = ""+content_doc.location; //location of the document, converted to string
		   let dummy;
		   const HOST_LEN = host_list.length;

		   //for convenience, if the site belongs to of our strict entry sites, just skip the experiment all together
		   //we will miss some cases but not a big deal,
		   for (var i=0; i<HOST_LEN; i++){
			dummy = doc_loc.indexOf(host_list[i],0);
			if(dummy >= 0)return;
		   }

		   //SHA-1 of the current document location
		   let url_hash = b64_sha1(doc_loc);

		   //db hack to check if we have visited this page
		   let db_query = "SELECT * FROM " + dbstore._tableName + " WHERE urlHash = :row_id";
		   let statement = dbstore._createStatement(db_query);
		   statement.params.row_id=url_hash;

		   if (statement.executeStep()){
			statement.reset();
	   	   	return;
		   }
		   statement.reset();

		   //URL regex
		   let urls = my_doc.match(/(src|href)\s*=\s*['"“”‘’]\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi);

		   let url_len = urls.length;
                   for (var i=0; i<url_len; i++){

			//first, extract the url
			let url_pos = urls[i].search(/\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi);

			let url_str = urls[i].substring(url_pos);

			//extract the host name
			let ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
			let parsed_URL = ioService.newURI(url_str, null, null);
			let host = parsed_URL.host;

			//check if the hostname matches with one of the entry point hosts
			let host_index = -1;
			let violation = 0;
			for (let j=0; j<HOST_LEN; j++){
				if (host_list[j]==host){ //Host name of our URL matches one of the entry hosts
					host_index = j;

					//now, we check if the relative PATHs match
					let rel_path = parsed_URL.path;
					if (rel_path.length>0 && rel_path[rel_path.length-1]!='/')rel_path+='/'; //at ending back slash
					if (rel_path!=path_list[j]) violation=1;//Path mismatch with entry point path

					//We have a special case for gmail, check secondary login pages
					//pages like http://mail.google.com/a/sv.cmu.edu/
					if (j==0 &&
						(rel_path.search(/^\/a\/[^\/]*\/?$/g)!= -1 ||
						rel_path.search(/^\/mail\/\?hl=[a-zA-Z]*&amp;tab=[a-zA-Z]*\/?$/g)!=-1))violation=2;

					break;
				}
			}
			//add element into db
			exports.handlers.record({urlHash: url_hash, entryIndex: host_index, entryViolation: violation});
		   }

	}, true);
  }
};




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
    return "This study tests each website that you visit against the CMU Web Security "
          + "group's hypothetical &quot;Strict Entry&quot; security policy.  The graph "
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



//============================== SHA-1 Implementation =========================/
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = ""; /* base-64 pad character. "=" for strict RFC compliance   */
var chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
function hex_sha1(s){return binb2hex(core_sha1(str2binb(s),s.length * chrsz));}
function b64_sha1(s){return binb2b64(core_sha1(str2binb(s),s.length * chrsz));}
function str_sha1(s){return binb2str(core_sha1(str2binb(s),s.length * chrsz));}
function hex_hmac_sha1(key, data){ return binb2hex(core_hmac_sha1(key, data));}
function b64_hmac_sha1(key, data){ return binb2b64(core_hmac_sha1(key, data));}
function str_hmac_sha1(key, data){ return binb2str(core_hmac_sha1(key, data));}

/*
 * Perform a simple self-test to see if the VM is working
 */
function sha1_vm_test()
{
  return hex_sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d";
}

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function core_sha1(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d)
{
  if(t < 20) return (b & c) | ((~b) & d);
  if(t < 40) return b ^ c ^ d;
  if(t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Calculate the HMAC-SHA1 of a key and some data
 */
function core_hmac_sha1(key, data)
{
  var bkey = str2binb(key);
  if(bkey.length > 16) bkey = core_sha1(bkey, key.length * chrsz);

  var ipad = Array(16), opad = Array(16);
  for(var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
  return core_sha1(opad.concat(hash), 512 + 160);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * Convert an 8-bit or 16-bit string to an array of big-endian words
 * In 8-bit function, characters >255 have their hi-byte silently ignored.
 */
function str2binb(str)
{
  var bin = Array();
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < str.length * chrsz; i += chrsz)
    bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (32 - chrsz - i%32);
  return bin;
}

/*
 * Convert an array of big-endian words to a string
 */
function binb2str(bin)
{
  var str = "";
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < bin.length * 32; i += chrsz)
    str += String.fromCharCode((bin[i>>5] >>> (32 - chrsz - i%32)) & mask);
  return str;
}

/*
 * Convert an array of big-endian words to a hex string.
 */
function binb2hex(binarray)
{
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i++)
  {
    str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
           hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
  }
  return str;
}

/*
 * Convert an array of big-endian words to a base-64 string
 */
function binb2b64(binarray)
{
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789AB";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i += 3)
  {
    var triplet = (((binarray[i   >> 2] >> 8 * (3 -  i   %4)) & 0xFF) << 16)
                | (((binarray[i+1 >> 2] >> 8 * (3 - (i+1)%4)) & 0xFF) << 8 )
                |  ((binarray[i+2 >> 2] >> 8 * (3 - (i+2)%4)) & 0xFF);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > binarray.length * 32) str += b64pad;
      else str += tab.charAt((triplet >> 6*(3-j)) & 0x3F);
    }
  }
  return str;
}

