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

exports.GenericGlobalObserver = function(windowHandler) {
  this.privateMode = false;
  this._store = null;
  this._windowObservers = [];
  this._windowObserverClass = windowHandler;
};
exports.GenericGlobalObserver.prototype = {
  _getObserverForWindow: function(window) {
    for (let i = 0; i < this._windowObservers.length; i++) {
      if (this._windowObservers[i].window === window) {
        return this._windowObservers[i];
      }
    }
    return null;
  },

  _registerWindow: function(window) {
    if (this._windowObserverClass) {
      if (this._getObserverForWindow(window) == null) {
        let newObserver = new this._windowObserverClass(window);
        newObserver.install();
        this._windowObservers.push(newObserver);
      }
    }
  },

  onNewWindow: function(window) {
    this._registerWindow(window);
  },

  onWindowClosed: function(window) {
    let obs = this._getObserverForWindow(window);
    if (obs) {
      obs.uninstall();
      let index = this._windowObservers.indexOf(obs);
      this._windowObservers[index] = null;
      this._windowObservers.splice(index, 1);
    }
  },

  onAppStartup: function() {
  },

  onAppShutdown: function() {
  },

  onExperimentStartup: function(store) {
    this._store = store;
    // Install observers on all windows that are already open:
    let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                    .getService(Ci.nsIWindowMediator);
    let enumerator = wm.getEnumerator("navigator:browser");
    while(enumerator.hasMoreElements()) {
      let win = enumerator.getNext();
      this._registerWindow(win);
    }
    dump("GenericGlobalObserver.onExperimentStartup.\n");
  },

  onExperimentShutdown: function() {
    dump("ExperimentShutdown called.\n");
    this.uninstallAll();
  },

  onEnterPrivateBrowsing: function() {
    // Don't record any events when in private mode
    this.privateMode = true;
  },

  onExitPrivateBrowsing: function() {
    this.privateMode = false;
  },

  uninstallAll: function() {
    dump("Gonna uninstall All window observers.\n");
    for (let i = 0; i < this._windowObservers.length; i++) {
      dump("Uninstalling a window observer!\n");
      this._windowObservers[i].uninstall();
    }
    this._windowObservers = [];
  }
};

exports.GenericWindowObserver = function(window) {
  dump("GenericWindowObserver constructed for " + window +".\n");
  this.window = window;
  this._registeredListeners = [];
};
exports.GenericWindowObserver.prototype = {
  _listen: function GenericWindowObserver__listen(container,
                                                  eventName,
                                                  method,
                                                  catchCap) {
    dump("Installing a listener.\n");
    // Keep a record of this so that we can automatically unregister during
    // uninstall:
    let self = this;
    let handler = function(event) {
      method.call(self, event);
    };
    container.addEventListener(eventName, handler, catchCap);

    this._registeredListeners.push(
      {container: container, eventName: eventName, handler: handler,
       catchCap: catchCap});
  },

  install: function GenericWindowObserver_install() {
  },

  uninstall: function ToolbarWindowObserver_uninstall() {
    dump("Uninstalling ye window observer.\n");
    for (let i = 0; i < this._registeredListeners.length; i++) {
      dump("Uninstalling a listener.\n");
      let rl = this._registeredListeners[i];
      rl.container.removeEventListener(rl.eventName, rl.handler, rl.catchCap);
    }
  }
};

exports.extend = function(subClass, baseClass) {
  //http://www.kevlindev.com/tutorials/javascript/inheritance/index.htm
  function inheritance() {}
  inheritance.prototype = baseClass.prototype;

  subClass.prototype = new inheritance();
  subClass.prototype.constructor = subClass;
  subClass.baseConstructor = baseClass;
  subClass.superClass = baseClass.prototype;
};