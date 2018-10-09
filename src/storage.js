import Logger from './logger';
import utils from './utils';
const defaultInvaildTime = 1000 * 60 * 60 * 24 * 7;
var isInit = false;
var storageMap = {};
var tempStorage = {};

function _init(debug = false) {
  if (isInit) {
    return;
  }
  Logger._initLogger(debug);
  // 从现有的缓存数据中取出相关数据进行同步
  const realStorage = _pullStorageSync();
  storageMap = realStorage.allStorage;
  //
  isInit = true;
}

/**
 * 同步现有缓存,先清除,后更新
 */
function _pullStorageSync() {
  Logger.time(`starte pull storage sync ------`);
  try {
    // 取出现有缓存数据信息
    var res = wx.getStorageInfoSync();
    let keys = res.keys;
    let allStor = keys.reduce((set, current) => {
      return (set[current] = _getStorage(current));
    });
    return {
      currentSize: res.currentSize,
      maxSize: res.limitSize,
      allStorage: allStor,
    };
  } catch (e) {
    return {
      currentSize: 0,
      maxSize: 0,
      allStorage: {},
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
  let tV = wx.getStorageSync(k) || '';
  return tV;
}
/**
 *
 * @param {*String} k 缓存key
 * @param {*Object|Boolean|String} v 缓存value
 * @param {*Object} options 可选项,d:失效时长
 */
function setStorage(k, v, options = {}) {
  if (typeof k !== 'string') {
    Logger.err(`please check input ${k},${v},${options}`);
  }
  let tV = {};
  tV.value = utils.deepCopy(v);
  tV.invalidTime = transformDate(options.d || 0);
  tV.ismkstorage = true;
  storageMap[k] = tV;
  tempStorage[k] = tV;
  Logger.info(`save storage ------    ${k},${v},${options}`);
  options.now && _setStorage(k, tV);
}
/**
 *  从缓存中获取,失效的不予返回
 * @param {*String} k 缓存key
 */
function getStorage(k) {
  if (typeof k !== 'string') {
    Logger.err(`please check input ${k}`);
  }
  let currentTime = new Date().getTime();
  let temp = storageMap[k] || _getStorage(k);
  if (!temp) {
    return {};
  }
  Logger.info(`get data form storage ------    ${k},${temp}`);
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
  Logger.info(`remove storage ------    ${k}`);
  storageMap[k] = {};
  tempStorage[k] = {};
  wx.removeStorageSync(k);
}

/**
 * 将内存中的更改的重置到缓存中
 */
function flushAll() {
  Logger.info(`flush all data ------    ${tempStorage}`);
  for (const key in tempStorage) {
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
  Logger.info(`clean all`);
  storageMap = {};
  tempStorage = {};
  wx.clearStorage();
}

/**
 * 缓存时间时长转化
 * @param {*Date|String} dateStr 时间节点
 */
function transformDate(dateStr) {
  let currentTime = new Date().getTime();
  let defaultTime = currentTime + defaultInvaildTime;
  if (!dateStr) {
    return defaultTime;
  }
  // 时间节点直接返回
  if (dateStr instanceof Date) {
    return dateStr.getTime();
  }
  // 匹配相应规则
  let regx = /^([0-9]+)([dhms]{1})$/;
  if (typeof dateStr == 'string') {
    let result = dateStr.match(regx);
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
  let baseNum = {
    s: 1000,
    m: 1000 * 60,
    h: 1000 * 60 * 60,
    d: 1000 * 60 * 60 * 24,
  };
  return baseNum[base] || 0;
}

export default {
  flushAll: flushAll,
  getStorage: getStorage,
  init: _init,
  setStorage: setStorage,
  clearAll: clearAll,
  removeStorage: removeStorage,
};
