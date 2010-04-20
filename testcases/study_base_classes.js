exports.TYPE_INT_32 = 0;
exports.TYPE_DOUBLE = 1;

exports.STD_FINE_PRINT = '<h3>The fine print:</h3> \
      <ul> \
	<li>The websites (URLs) that you visit will never be recorded.</li> \
    <li>At the end of the test, you will be able to choose if you want to submit your test data or not.</li> \
       <li>All test data you submit will be anonymized and will not be personally identifiable.</li> \
</ul>';

exports.rawDataLink = function(expId) {
    return '<p><a onclick="showRawData(' + expId + ');">Click here</a> to see a display of all\
  the collected data in its raw form, exactly as it will be sent.</p>';
};

exports.optOutLink = function(expId) {
  return '<p>If you are not comfortable submitting your data this time, \
   <a href="chrome://testpilot/content/status-quit.html?eid=' + expId
    + '"> click here to cancel</a>.</p>';
};

exports.UPLOAD_DATA = '<b>Please submit your test data.</b>\
    <p>&nbsp;</p> \
    <div class="home_callout_continue">\
<img class="homeIcon" src="chrome://testpilot/skin/images/home_computer.png">\
<span id="upload-status"><a onclick="uploadData();">Submit your data &raquo;</a>\
</span></div> \
    <p>&nbsp;</p>';
