'use strict';
var libMs = libMs || {};
// Compatibility shim
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

if (typeof navigator.mediaDevices === 'undefined'){
  // ブラウザ非対応
  alert('API：MediaDevice not supported. ');
}

//
// Camera Device Controles
//
libMs.getMediaStreams = function(setter) {
  let devices = navigator.mediaDevices.enumerateDevices()
    .then(function(devices) {
      let no = 1;
      devices.forEach(function(device) {
        if (device.kind === 'videoinput') {
          let name = 'No.' + no + ':';
          if (device.facing === 'user') {
            // Android フロントカメラ
            name += ' SP フロントカメラ';
          } else if (device.facing === 'environment') {
            // Android バックカメラ
            name += ' SP 背面カメラ';
          } else {
            name += ' Webカメラ';
          }
          // PCの場合はfacing表示なしらしい
          let info = {'id':device.deviceId,'name':name,'label': device.label};
          setter(info);
          no++;
        }
        //console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
      });
      // 取得完了シグナル送信
      setter(null);
    }).catch(function(err) {
      alert(err.name + ": " + error.message);
    });
}
