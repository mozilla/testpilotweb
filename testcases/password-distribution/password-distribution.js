const TYPE_INT_32 = 0;
const TYPE_DOUBLE = 1;

exports.experimentInfo = {
  startDate: null,
  duration: 1,
  testName: "Password Frequency Study",
  testId: 3,
  testInfoUrl: "",
  testResultsUrl: "",
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

exports.webContent = {
  inProgressHtml: '\
    <h3>Thank you for participating in the Password Distribution study!</h3>\
    <p>If you don\'t want to participate, please \
    <a href="chrome://testpilot/content/status-quit.html?eid=3">click \
    here to quit</a>.</p>\
    <p><a onclick="showRawData(3);">Click here for the raw data set</a>.</p>\
    <canvas id="passwd-pie-canvas" width="500" height="300"></canvas>\
                  ',
  completedHtml: "",
  upcomingHtml: "",
  onPageLoad: function(experiment, document, graphUtils) {
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
          sites = sites + " site";
        } else {
          sites = sites + " sites";
        }
        let line1 = ordinal[i] + ": " + sites + " (" + percent + "%)";
        ctx.mozDrawText( line1 );
        ctx.restore();
      }
    }
  }
};