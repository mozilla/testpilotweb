const TYPE_INT_32 = 0;
const TYPE_DOUBLE = 1;

exports.experimentInfo = {
  startDate: null,
  duration: 0.00347222,  // 5 mins
  testName: "Accounts and Passwords Study",
  testId: 3,
  testInfoUrl: "https://testpilot.mozillalabs.com/testcases/account-password.html",
  summary: "Remembering which username/password combination to use on a "
           + "given site can be very frustrating. Firefox tries to help solve "
           + "a part of this  problem with the Password Manager feature. "
           + "Can it be more helpful? ",
  optInRequired: false,
  recursAutomatically: false,
  recurrenceInterval: 0,
  versionNumber: 1
};

var COLUMNS = [
  {property: "password_id", type: TYPE_INT_32, displayName: "Password No."},
  {property: "frequency", type: TYPE_INT_32, displayName: "Number of Uses"}];

exports.dataStoreInfo = {
  fileName: "testpilot_password_dist_experiment_results.sqlite",
  tableName: "password_dist_experiment",
  columns: COLUMNS
};

exports.handlers = {
  onNewWindow: function(window) {},
  onWindowClosed: function(window) {},
  onAppStartup: function() {},
  onAppShutdown: function() {},
  onExperimentStartup: function(store) {
    store.wipeAllData();
    // Code by Mike Connor:
    var logins = Cc["@mozilla.org/login-manager;1"]
                   .getService(Ci.nsILoginManager).getAllLogins({});
    var counts = {}, output = [];
    for (var i = 0;i < logins.length;i++) {
      if (!counts[logins[i].password])
        counts[logins[i].password] = 0;
      counts[logins[i].password] += 1;
    }
    for each (var j in counts) {
      output.push(j);
    }
    function compareNumbers(a,b) { return b - a; }
    output.sort(compareNumbers);

    for (i = 0; i < output.length; i++) {
      store.storeEvent({password_id: i, frequency: output[i]});
    }
  },
  onExperimentShutdown: function() {},
  onEnterPrivateBrowsing: function() {},
  onExitPrivateBrowsing: function() {}
};

const FINE_PRINT = '<p><strong>The fine print:</strong></p>\
    <ul>\
    <li>At the end of the test, you will be able to choose whether to submit\
    your test data or not.</li>\
    <li>All test data you submit will be anonymized and will not be personally \
    identifiable.</li>\
    <li>If you don\'t want to participate, please \
    <a href="chrome://testpilot/content/status-quit.html?eid=3">click \
    here to quit the study</a>.</li></ul>';

const PIE_CHART = '<p><a onclick="showRawData(3);">\
    Click here to see the raw data set</a>,\
    exactly as it will be transmitted to Mozilla.</p>\
    <canvas id="passwd-pie-canvas" width="500" height="300"></canvas>';

exports.webContent = {
  inProgressHtml: '\
    <h3>Thank you for participating in the \
    <a href="https://testpilot.mozillalabs.com/testcases/account-password.html">\
    Accounts and Passwords</a> study!</h3>\
    <p>Good day, Test  Pilot!</p>\
    <p>You are currently in a study helping design better ways for you to \
    manage online accounts and passwords.</p>\
    For this study, you will contribute to the <a href="http://mozillalabs.com/weave/">Weave project</a>\
    from <a href="http://mozillalabs.com">Mozilla Labs</a>.\
    In order to understand how people use the Firefox to manage accounts \
    and passwords online, we will simply count how many unique passwords you \
    use and the number of times you reuse each password. Don\'t worry: no actual \
    passwords will be collected.</p>\
    This study will be short and it is also associated with a survey. Please \
    <a href="chrome://testpilot/content/take-survey.html?eid=account_password_survey">\
    check out the survey</a> before you submit the data!</p>'
    + FINE_PRINT + PIE_CHART,

  completedHtml: '\
     <h3>Thank you for completing the \
     <a href="https://testpilot.mozillalabs.com/testcases/account-password.html">\
     Accounts and Passwords</a> study!</h3>\
     <p id="next-step-here"></p><br/>'
    + FINE_PRINT + PIE_CHART,

  upcomingHtml: "",

  _unifiedUpload: function(experiment, document, answers) {
    /* glom together survey results with data collected from study.
     * This is a hack because the needed feature is missing from the
     * extension core. */
    let uploadStatus = document.getElementById("upload-status");
    uploadStatus.innerHTML = "Now uploading data...";

    let experimentData = experiment._prependMetadataToCSV();
    let hack = {
      _prependMetadataToCSV: function() {
        return experimentData + "\npassword_survey_answers\n" + answers;
      }
    };
    hack.__proto__ = experiment;

    hack.upload(function(success) {
      if (success) {
        uploadStatus.innerHTML = "<h2>Thank you for submitting your data!</h2>"
          + "<p>This study is no longer collecting data, and the data that "
          + "was collected has been deleted from your computer.  You can now "
          + "close this tab or navigate away from this page.</p>"
          + "<p>The results of the study will be available soon.  When they "
          + "are ready for viewing, Test Pilot will let you know.";
      } else {
        uploadStatus.innerHTML = "<p>Oops!  There was an error connecting to "
          + "the Mozilla servers.  Maybe your network connection is down?</p>"
          + "<p>Test Pilot will retry automatically, so it's OK to close this"
          + " page now.</p>";
      }
    });
  },

  onPageLoad: function(experiment, document, graphUtils) {
    this._drawPieChart(experiment, document, graphUtils);
    let nextStep = document.getElementById("next-step-here");
    if (nextStep) {
      // A hack to get study results and survey submitted together.  First,
      // check the db contents to see whether survey is complete or not.  If
      // it is, put the submit button.  If it is not, put the link to the
      // survey.

      // The survey results are stored in:
      let prefName = "surveyAnswers.account_password_survey";
      let prefs = Cc["@mozilla.org/preferences-service;1"]
                    .getService(Ci.nsIPrefService);
      prefs = prefs.getBranch("extensions.testpilot.");

      if (prefs.prefHasUserValue(prefName)) {
        nextStep.innerHTML = '<div class="home_callout_continue">\
  <img class="homeIcon" src="chrome://testpilot/skin/images/home_computer.png">\
  <span id="upload-status"><a id="submit-link">Submit your data \
          &raquo;</a></span></div>';
        let self = this;
        let answers = prefs.getCharPref(prefName);
        let uploadLink = document.getElementById("submit-link");
        uploadLink.addEventListener("click", function() {
                                      self._unifiedUpload(experiment,
                                                          document,
                                                          answers);
                                    }, false);
      } else {
        nextStep.innerHTML = 'Please take a moment to fill out \
          <a href="chrome://testpilot/content/take-survey.html?eid=account_password_survey">\
          this survey</a> about how you manage your passwords.';
      }
    }
  },

  _drawPieChart: function(experiment, document, graphUtils) {
    let origin  = { x: 110, y: 125 };
    let radius = 100;
    let rawData = experiment.dataStoreAsJSON;
    if (rawData.length == 0) {
      return;
    }
    let canvas = document.getElementById("passwd-pie-canvas");
    if (!canvas) {
      return;
    }
    let ctx = canvas.getContext("2d");

    let i, total = 0;
    for (i = 0; i < rawData.length; i++) {
      total += rawData[i].frequency;
    }

    let colors = ["red", "blue", "green", "yellow", "black", "orange",
                  "purple", "white", "pink", "grey"];
    let ordinal = ["Your Most Common Password",
                   "Second Most Common",
                   "Third Most Common"];
    // TODO algorithmically generate colors so we have an infinite number
    // with high contrast!
    ctx.mozTextStyle = "12pt sans serif";
    let sumAngle = 0;
    for (i = 0; i < rawData.length; i++) {
      let angle = 2*Math.PI * rawData[i].frequency / total;
      ctx.fillStyle = colors[i % (colors.length)];

      ctx.beginPath();
      ctx.moveTo( origin.x, origin.y);
      ctx.lineTo( origin.x + radius * Math.cos( sumAngle ),
                  origin.y + radius * Math.sin( sumAngle ) );
      ctx.arc( origin.x, origin.y, radius, sumAngle, sumAngle + angle, false);
      ctx.lineTo( origin.x, origin.y );
      ctx.fill();
      ctx.stroke();

      sumAngle += angle;

      if (i < 3) {
        ctx.mozTextStyle = "10pt sans serif";
        ctx.fillStyle = colors[i];
        ctx.fillRect( 220, 10 + 30 * i, 20, 20);
        ctx.strokeRect( 220, 10 + 30 * i, 20, 20);
        ctx.fillStyle = "black";
        ctx.save();
        ctx.translate( 245, 25 + 30 * i );
        let sites = rawData[i].frequency;
        let percent = Math.round( 100 * sites /total);
        if (sites == 1) {
          sites = sites + " page";
        } else {
          sites = sites + " pages";
        }
        let line1 = ordinal[i] + ": " + sites + " (" + percent + "%)";
        ctx.mozDrawText( line1 );
        ctx.restore();
      }
    }
  }
};