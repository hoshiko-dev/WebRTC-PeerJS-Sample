'use strict';
var librtc = librtc || {};
// Compatibility shim
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

var yourPeer = null;
var yourStream = null;

//
// Camere/MicroPhone Setup
//
librtc.initYourCamera = function(width,height,maxRate,minRate,cameraId,callbacks) {
  if (navigator.getUserMedia) {
    // デバイスを取得
    navigator.getUserMedia(librtc.setupUserMediaSetting(width,height,maxRate,minRate,cameraId), function (stream) {
      librtc.debugLog("create Your Camera");
      yourStream = stream;
      if (callbacks['init']) {
        var func = callbacks['init'];
        func(stream);
      }
    }, function (err) {
      console.log(err);
      // PCのデバイス状況によりエラーになるケースがあるので、リトライ等実装したほうがよい
      // 1)width/heightの値がデバイスの許容を超えるケース(サイズを調整してリトライ)
      // 2)デバイスは正常だがPC側の問題でタイミングが早すぎるケース(時間をおいてリトライ)
      alert('Camera Device Error');
    });
  } else {
    // ブラウザ非対応
    alert('API：getUserMedia Not Found');
  }
}

//
// getUserMediaのパラメータ設定
//
librtc.setupUserMediaSetting = function(width,height,maxRate,minRate,cameraId) {
  let params = {audio: true,
                video: {
                    mandatory: {
                        minWidth: width ,
                        minHeight: height ,
                        maxWidth: width ,
                        maxHeight: height ,
                        maxFrameRate: maxRate,
                        minFrameRate: minRate
                    },
                    optional: [{
                        minFrameRate: minRate
                    }]
                }
              };
  if (cameraId !== undefined && cameraId !== '') {
    params['video']['optional'].push({'sourceId':cameraId});
  }
  console.log('getUserMedia params:',params);
  return params;
}

//
// Peer接続処理
//
librtc.createYourPeer = function(host,port,key,config,debug,path,secure,id) {
  var params = librtc.setPeerParams(host,port,key,config,debug,path,id);
  yourPeer = new Peer(params);
  librtc.debugLog("Create Your Peer Start");
}

// Peer接続パラメータのセット
librtc.setPeerParams = function(host,port,key,config,debug,path,id) {
  var params = {}
  if (host != undefined && host != null) {
    params['host'] = host;
  }
  if (port != undefined && port != null) {
    params['port'] = port;
  }
  if (key != undefined && key != null) {
    params['key'] = key;
  }
  if (config != undefined && config != null) {
    params['config'] = config;
  }
  if (debug != undefined && debug != null) {
    params['debug'] = debug;
  }
  if (path != undefined && path != null) {
    params['path'] = path;
  }
  if (id != undefined && id != null) {
    params['id'] = id;
  }
  return params;
}
// Peerオブジェクトのイベント登録
librtc.setPeerEvent = function(callbacks) {
  // Peer接続完了時
  yourPeer.on('open', function (id) {
    librtc.debugLog('Create Your Peer OK ID:' + id);
    if (callbacks['open']) {
      var func = callbacks['open'];
      func(id);
    }
  });
  // [Media]Offer受信時の処理
  yourPeer.on('call', function (media) {
    librtc.debugLog('Media Offer Reciver ID:' + media.peer);
    // Answer送信
    media.answer(yourStream);
    //librtc.setMediaEvent(media);
    if (callbacks['call']) {
      var func = callbacks['call'];
      func(media);
    }
  });

  // データコネクション接続完了受信時
  yourPeer.on('connection', function (data) {
    librtc.debugLog('Your Data Connection OK:' + data.id);
    if (data) {
      if (callbacks['connection']) {
        var func = callbacks['connection'];
        func(data);
      }
    }
  });

  // Peerの切断を検知
  yourPeer.on('disconnected', function () {
      librtc.debugLog('Your Peer Disconnected');
      if (callbacks['disconnected']) {
        var func = callbacks['disconnected'];
        func();
      }
  });
  // Peerの切断完了を検知
  yourPeer.on('close', function () {
      librtc.debugLog('Your Peer closed');
      if (callbacks['close']) {
        var func = callbacks['close'];
        func();
      }
  });

  // Peer　エラー検出次
  yourPeer.on('error', function (err) {
    librtc.debugLog('Peer error:' + err.type);
    if (callbacks['error']) {
      var func = callbacks['error'];
      func(err);
    }
  });
}


// Mediaオブジェクトのイベント登録
librtc.setMediaEvent = function(targetMedia,callbacks) {
  // 対向PeerのMediaストリームが確立
  targetMedia.on('stream', function (stream) {
    librtc.debugLog('Create Media Stream. Target ID:' + targetMedia.peer);
    if (callbacks['stream']) {
      var func = callbacks['stream'];
      func(stream);
    }
  });
  // リモートからのMedia切断を検出
  targetMedia.on('close', function () {
    librtc.debugLog('Close Media. Target ID:' + targetMedia.peer);
    if (callbacks['close']) {
      var func = callbacks['close'];
      func(targetMedia.peer);
    }
  });
  // Mediaエラーを検出
  targetMedia.on('error', function (err) {
    librtc.debugLog('Media Error. Target ID:' + targetMedia.peer);
    if (callbacks['err']) {
      var func = callbacks['err'];
      func(err);
    }
  });
}

// Dataオブジェクトのイベント登録
librtc.setDataEvent = function(targetData,callbacks) {
  // Dataオブジェクト生成完了
  targetData.on('open', function () {
    librtc.debugLog('Data Open.' + targetData.peer);
    if (callbacks['open']) {
      var func = callbacks['open'];
      func();
    }
  });
  // データ受信時
  targetData.on('data', function (data) {
    if (data) {
      librtc.debugLog('Recive Data ID:' + targetData.peer);
      if (callbacks['data']) {
        var func = callbacks['data'];
        func(data);
      }
    }
  });
  // リモートからの切断を検出
  targetData.on('close', function () {
    librtc.debugLog('Close Data. ID:' + targetData.peer);
    if (callbacks['close']) {
      var func = callbacks['close'];
      func();
    }
  });
// Dataエラーを検出
  targetData.on('error', function (err) {
    librtc.debugLog('Data Error. Target ID:' + targetData.peer);
    if (callbacks['err']) {
      var func = callbacks['err'];
      func(err);
    }
  });
}


// Mediaコネクション確立(ビデオチャット開始)
librtc.createRtcMedia = function(targetId) {
  librtc.debugLog('create Media. Target ID:' + targetId);
  return yourPeer.call(targetId, yourStream);
}

// Dataコネクション確立(データ通信用セッション)
librtc.createRtcData = function(targetId) {
  librtc.debugLog('create Data. Target ID:' + targetId);
  // // データコネクション生成
  var data = yourPeer.connect(targetId, {
      reliable: false
  });
  return data;
}

// ビデオチャット切断
librtc.closeMedia = function(targetMedia) {
  if (targetMedia) {
    targetMedia.close();
  }
}
// 指定のデータコネクションへデータ送信
librtc.sendData = function(targetCon,data) {
  if (targetCon && data) {
    targetCon.send(data);
  }
}

// 指定のデータコネクションをClose
librtc.closeData = function(targetCon) {
  if (targetCon) {
    targetCon.close();
  }
}

// あなたのPeerを切断
librtc.disconnect = function() {
  if (yourPeer) {
    yourPeer.disconnect();
  }
}

// あなたのPeerを強制切断
librtc.destroy = function() {
  if (yourPeer) {
    yourPeer.destroy();
  }
}
// PeerJS-Serverに接続中のPeer情報を取得
// ただし、接続状態は保証されない
librtc.getAllPeers = function(callback) {
  if (yourPeer) {
    librtc.debugLog("getAllPeers ");
    yourPeer.listAllPeers(librtc.onListAllPeers.bind(this,callback));
  }
}

// PeerJS-Serverから有効なPeerIdを受信
librtc.onListAllPeers = function(callback,peers) {
  if (peers && peers.length > 0) {
    for (var i = 0; i < peers.length; i++) {
      librtc.debugLog("peer ID:"+peers[i]);
    }
    callback(peers);
  }
}

// デバッグ用
librtc.debugLog = function(data) {
  if (debug) {
     var date = new Date();
     date = '[' + [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('/') + ' ' + date.toLocaleTimeString() + '] ';
     console.log(date + data);
  }
}
