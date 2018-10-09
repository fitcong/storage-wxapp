let isDebug = false;
const logger = console;

const loggerInstance = (function() {
  function _initLogger(debug = false) {
    isDebug = debug;
  }
  function info(msg) {
    return isDebug && logger.info(msg);
  }
  function err(msg) {
    return logger.error(msg);
  }
  function time(msg) {
    return (
      isDebug &&
      logger.info(msg, `---${new Date().toLocaleString()}`)
    );
  }
  return {
    info: info,
    err: err,
    time: time,
    _initLogger,
  };
})();

export default loggerInstance;
