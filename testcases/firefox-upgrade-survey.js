exports.surveyInfo = {
  surveyId: "firefox_upgrade_survey",
  surveyName: "Firefox Upgrade Survey",
  surveyUrl: "http://www.surveygizmo.com/s3/569257/TestPilot-Firefox-Upgrade-Survey",
  summary: "If you see this survey, most likely you are using Firefox 3.6 currently.  There is also a completely new version of Firefox which was released in March this year. Through this survey, We're interested to understand why you have not upgraded so that we can better meet your needs in our future products. ",
  thumbnail: "https://testpilot.mozillalabs.com/testcases/pilot-survey-thumbnail.png",
  
  runOrNotFunc: function() {
    let Application = Cc["@mozilla.org/fuel/application;1"]
                      .getService(Ci.fuelIApplication);
    let versionComparator = Cc["@mozilla.org/xpcom/version-comparator;1"]
                            .getService(Ci.nsIVersionComparator);
    let ver = Application.version;
    if( versionComparator.compare(ver, "3.6")>=0 && versionComparator.compare(ver, "3.7")<0 )
    	return true;
    else
    	return false;
  }
};