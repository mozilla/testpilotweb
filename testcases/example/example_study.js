// This file is an example study.  It doesn't do anything, but it
// provides a basis for you to start creating your own Test Pilot study.


// We're using the Cuddlefish JS module framework, so importing a module
// is done with require().  Here we import the base classes we'll build on.
BaseClasses = require("study_base_classes.js");

// Our Test Pilot study must implement and expose four things:
// 1. experimentInfo
// 2. dataStoreInfo
// 3. handlers
// 4. webContent
// We use the Cuddlefish 'exports' object to expose these.


// experimentInfo is an obect providing metadata about the study.
exports.experimentInfo = {

  testName: "Example",
  testId: 1010,  // must be unique across all test pilot studies
  testInfoUrl: "https://", // URL of page explaining your study
  summary: "A sentence or two explaining what your study is about",
  thumbnail: "http://", // URL of image representing your study
  // (will be displayed at 90px by 90px)
  versionNumber: 1, // update this when changing your study
    // so you can identify results submitted from different versions

  duration: 5, // a number of days - fractions OK.
  minTPVersion: "1.0a1", // Test Pilot versions older than this
    // will not run the study.
  minFXVersion: "4.0",

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

  fileName: "testpilot_example_results.sqlite", // this file will be
  // created in user's profile directory

  tableName: "testpilot_example_study",

  // Define the columns in the database table; must have at least 1,
  // can have any number.  Each column object must define a "property",
  // which is the object property name it maps to, a type (using codes
  // defined in BaseClasses) and a displayName (for showing the user).
  columns: [
    {property: "event", type: BaseClasses.TYPE_INT_32,
     displayName: "What you did"},
    {property: "timestamp", type: BaseClasses.TYPE_DOUBLE,
     displayName: "When you did it"}
  ]
};


/* Now for the actual observation of the events that we care about.
 * We must register a global observer object; we can optionally also
 * register a per-window observer object.  Each will get notified of
 * certain events, and can install further listeners/observers of their own.
 */

// Define a per-window observer class by extending the generic one from
// BaseClasses:

function ExampleStudyWindowObserver(window, globalInstance) {
  // Call base class constructor:
  ExampleStudyWindowObserver.baseConstructor.call(this, window, globalInstance);
}
// I use a helper method for extending classes, since I always get
// Javascript inheritance wrong otherwise ;-)
BaseClasses.extend(ExampleStudyWindowObserver,
                   BaseClasses.GenericWindowObserver);
ExampleStudyWindowObserver.prototype.install = function() {

  /* This .install() method will get called whenever a new window
   * is opened (also it will get called for each window already open
   * when the experiment starts up). */

  // we have access to the window object as this.window
  let someElement = this.window.document.getElementById("foo");

  if (someElement) {
    /* For installing a listener on a XUL element in the window,
     * we can use the this._listen helper method.  This method puts
     * the listener function into a registry that will automatically
     * handle the cleanup for us.
     * Arguments of this._listen() are:
     * 1. elemnt to register listener on
     * 2. name of event to listen for
     * 3. Function to call when event happens
     * 4. use bubbling?*/

    let self = this;
    self._listen(someElement, "mouseup", function(evt) {
                   // The record() method will write an object to the
                   // database.  The object must have properties matching
                   // the "property" names of the columns in dataStoreInfo.
                   self.record({ event: 1, timestamp: Date.now()});

                   // We can use console.info, console.warn etc. for
                   // debugging:
                   console.info("User clicked foo.  I recorded event 1.");
                 }, false);
  }

};


// Now we'll define the global observer class by extending the generic one:
function ExampleStudyGlobalObserver() {
  // Call base class constructor.  Must pass in the class name of the
  // per-window observer class we want to use; the base class will register
  // it so that an instance gets constructed on every window open.
  ExampleStudyGlobalObserver.baseConstructor.call(this,
                                                  ExampleStudyWindowObserver);
}
BaseClasses.extend(ExampleStudyGlobalObserver,
                   BaseClasses.GenericGlobalObserver);

/* Override the onExperimentStartup() method - this method gets called
 * when the experiment starts up (which means once when the experiment
 * starts for the first time, and then again every time Firefox restarts
 * until the experiment duration is over.) */
ExampleStudyGlobalObserver.prototype.onExperimentStartup = function(store) {
  /* "store" is a connection to the database table, which has been
   * automatically created for us from our dataStoreInfo spec.
   * So you have direct access to it here if you want to do anything
   * low-level with it. */

  // you MUST call the base class onExperimentStartup:
  ExampleStudyGlobalObserver.superClass.onExperimentStartup.call(this, store);

  /* Any code that you only want to run once per Firefox session
   * can go here.  It can install additional observers if you like.
   * You also have access to XPCOM components through predefined
   * symbols Cc and Ci: */

  let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                        .getService(Ci.nsIWindowMediator);

  /* If you want to record data, use the .record() method instead of
   * writing to store directly -- it's easier, and the record() method
   * automatically respects Private Browsing Mode. */
  this.record({event: 2, timestamp: Date.now()});
  console.info("Example study starting up!  Recorded event 2.");
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
 * all these methods are called automatically at the apprporate times. */


// Instantiate and export the global observer (required!)
exports.handlers = new ExampleStudyGlobalObserver();


// Finally, we make the web content, which defines what will show up on the study
// detail view page.
function ExampleWebContent()  {
  ExampleWebContent.baseConstructor.call(this, exports.experimentInfo);
}
// Again, we're extending a generic web content class.
BaseClasses.extend(ExampleWebContent, BaseClasses.GenericWebContent);
// it's all implemented as getters, and unfortunately the syntax for
// overriding getters is way ugly -- thinking of changing this.
ExampleWebContent.prototype.__defineGetter__("dataCanvas",
  function() {
      return '<div class="dataBox"><h3>View Your Data:</h3>' +
      this.dataViewExplanation +
      this.rawDataLink +
      '<div id="data-plot-div" style="width:480x;height:800px"></div>' +
      this.saveButtons + '</div>';
  });
ExampleWebContent.prototype.__defineGetter__("dataViewExplanation",
  function() {
    return "This is a totally made up example study that means nothing.";
  });

ExampleWebContent.prototype.onPageLoad = function(experiment,
                                                       document,
                                                       graphUtils) {

}

// Instantiate and export the web content (required!)
exports.webContent = new ExampleWebContent();


require("unload").when(
  function destructor() {
    // Do any module cleanup here.
  });