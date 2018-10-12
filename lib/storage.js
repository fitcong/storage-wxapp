'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultInvaildTime = 1000 * 60 * 60 * 24 * 7;
var isInit = false;
var storageMap = {};
var tempStorage = {};

function _init() {
  var debug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

  if (!isInit) {
    _logger2.default._initLogger(debug);
    // 从现有的缓存数据中取出相关数据进行同步
    var realStorage = _pullStorageSync();
    storageMap = realStorage.allStorage;
    isInit = true;
  }
}

/**
 * 同步现有缓存,先清除,后更新
 */
function _pullStorageSync() {
  _logger2.default.time('starte pull storage sync ------');
  try {
    // 取出现有缓存数据信息
    var res = wx.getStorageInfoSync();
    var keys = res.keys;
    var allStor = keys.reduce(function (set, current) {
      return set[current] = _getStorage(current);
    });
    return {
      currentSize: res.currentSize,
      maxSize: res.limitSize,
      allStorage: allStor
    };
  } catch (e) {
    return {
      currentSize: 0,
      maxSize: 0,
      allStorage: {}
    };
  }
}

/**
 * 存储数据至缓存,同时转换缓存有效时长,将其转化为有效的时间节点
 * @param {*String} k 缓存key
 * @param {*Object|String|Boolean} v 缓存value
 * @param {*String|Date} d 缓存有效时长 格式 xxd 天 xxm 分 xxs 秒.也可以传入相应的时间节点对象 默认7天
 */
function _setStorage(k, v) {
  return wx.setStorageSync(k, v);
}
/**
 *  从缓存中获取
 * @param {*String} k 缓存key
 */
function _getStorage(k) {
  var tV = wx.getStorageSync(k) || '';
  return tV;
}
/**
 *
 * @param {*String} k 缓存key
 * @param {*Object|Boolean|String} v 缓存value
 * @param {*Object} options 可选项,d:失效时长
 */
function setStorage(k, v) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (typeof k !== 'string') {
    _logger2.default.err('please check input ' + k + ',' + v + ',' + options);
  }
  var tV = {};
  tV.value = _utils2.default.deepCopy(v);
  tV.invalidTime = transformDate(options.d || 0);
  tV.ismkstorage = true;
  storageMap[k] = tV;
  tempStorage[k] = tV;
  _logger2.default.info('save storage ------    ' + k + ',' + v + ',' + options);
  options.now && _setStorage(k, tV);
}
/**
 *  从缓存中获取,失效的不予返回
 * @param {*String} k 缓存key
 */
function getStorage(k) {
  if (typeof k !== 'string') {
    _logger2.default.err('please check input ' + k);
  }
  var currentTime = new Date().getTime();
  var temp = storageMap[k] || _getStorage(k);
  if (!temp) {
    return {};
  }
  _logger2.default.info('get data form storage ------    ' + k + ',' + temp);
  if (temp.ismkstorage) {
    // 过滤失效缓存
    if (temp.invalidTime >= currentTime) {
      return temp.value;
    } else {
      temp.isInvaild = true;
      temp.value = {};
      removeStorage(k);
    }
    return temp.value;
  } else {
    return temp;
  }
}
/**
 * 清除指定key的缓存
 * @param {*String} k 要清除的缓存key
 */
function removeStorage(k) {
  _logger2.default.info('remove storage ------    ' + k);
  storageMap[k] = {};
  tempStorage[k] = {};
  wx.removeStorageSync(k);
}

/**
 * 将内存中的更改的重置到缓存中
 */
function flushAll() {
  _logger2.default.info('flush all data ------    ' + tempStorage);
  for (var key in tempStorage) {
    if (tempStorage.hasOwnProperty(key)) {
      _setStorage(key, tempStorage[key]);
    }
  }
  tempStorage = {};
}
/**
 * 清除缓存
 */
function clearAll() {
  _logger2.default.info('clean all');
  storageMap = {};
  tempStorage = {};
  wx.clearStorage();
}

/**
 * 缓存时间时长转化
 * @param {*Date|String} dateStr 时间节点
 */
function transformDate(dateStr) {
  var currentTime = new Date().getTime();
  var defaultTime = currentTime + defaultInvaildTime;
  if (!dateStr) {
    return defaultTime;
  }
  // 时间节点直接返回
  if (dateStr instanceof Date) {
    return dateStr.getTime();
  }
  // 匹配相应规则
  var regx = /^([0-9]+)([dhms]{1})$/;
  if (typeof dateStr == 'string') {
    var result = dateStr.match(regx);
    if (!result) {
      return defaultTime;
    } else {
      // 获取时间基数
      return currentTime + result[1] * 1 * getDateBaseNum(result[2]);
    }
  }
}
/**
 * 获取对应的时间基数,计算转换效率
 * @param {*String} base smhd
 */
function getDateBaseNum(base) {
  var baseNum = {
    s: 1000,
    m: 1000 * 60,
    h: 1000 * 60 * 60,
    d: 1000 * 60 * 60 * 24
  };
  return baseNum[base] || 0;
}

exports.default = {
  flushAll: flushAll,
  getStorage: getStorage,
  init: _init,
  setStorage: setStorage,
  clearAll: clearAll,
  removeStorage: removeStorage
};