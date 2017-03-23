var cp = require('child_process'), fs = require('fs'), path = require('path');

var bootstrap = fs.readFileSync(path.join(__dirname, 'bootstrap.js'), 'utf8');

module.exports = Worker;
function Worker(file, type) {
  if (type === true) {
    type = 'eval';
  } else {
    type = 'require';
  }

  var self = this;
  this.child = cp.fork(path.join(__dirname, type + 'worker.js'));

  if (type === 'eval') {
    file = bootstrap + '\n' + fs.readFileSync(file, 'utf8');
  }

  this.child.send(file);
  this.child.on('message', function(msg) {
    var parsed = JSON.parse(msg);
    self.onmessage && self.onmessage.call(self, parsed);
    if (self.handlers['message']) {
      self.handlers['message'].forEach(func => func.call(self, parsed));
    }
  });
  this.child.on('error', function(err) {
    self.onerror && self.onerror(err);
    if (self.handlers['error']) {
      self.handlers['error'].forEach(func => func.call(self, err));
    }
  });

  this.handlers = {};
}

Worker.prototype.postMessage = function(msg) {
  this.child.send(JSON.stringify({data: msg}));
};

Worker.prototype.terminate = function() {
  this.child.kill();
};

Worker.prototype.addEventListener = function(eventName, cb) {
  if (!this.handlers[eventName]) {
    this.handlers[eventName] = [];
  }
  this.handlers[eventName].push(cb);
};

Worker.prototype.removeEventListener = function(eventName, cb) {
  const eventHandlers = this.handlers[eventName];
  if (eventHandlers) {
    this.handlers[eventName] = eventHandlers.filter(func => func !== cb);
  }
};
