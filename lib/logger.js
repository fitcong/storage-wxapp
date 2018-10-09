"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var isDebug = false;
var logger = console;

var loggerInstance = function () {
  function _initLogger() {
    var debug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    isDebug = debug;
  }
  function info(msg) {
    return isDebug && logger.info(msg);
  }
  function err(msg) {
    return logger.error(msg);
  }
  function time(msg) {
    return isDebug && logger.info(msg, "---" + new Date().toLocaleString());
  }
  return {
    info: info,
    err: err,
    time: time,
    _initLogger: _initLogger
  };
}();

exports.default = loggerInstance;