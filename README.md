# storage-wxapp

小程序缓存辅助工具,由于小程序缓存性能不佳,以及使用中的管理不规范,才自己写了这个工具

### 安装

> npm i storage-wxapp --save

### 初始化

```JavaScript
import storage from 'storage-wxapp';
App({
  onLoad:function(){
    // 初始化
    storage.init();
  }
  onHide:function(){
    // 将所有缓存进行存储
    storage.flushAll();
  }
})
```

### 使用

```JavaScript
import storage from 'storage-wxapp';
Page({
  customMethods:function(){
    // 储存
    storage.setStorage("user",{userName:"fitcong",id:1234},{d:'3d'});
    // 获取
    storage.getStorage("user");
    // 清除
    storage.removeStorage("user");
    // 清除全部
    storage.cleanAll();
    // 将临时数据存入缓存
    storage.flushAll();
  }
})
```
