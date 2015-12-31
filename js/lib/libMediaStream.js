'use strict';
var libMs = libMs || {};
// Compatibility shim
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

if (typeof MediaStreamTrack === 'undefined'){
  // ブラウザ非対応
  alert('API：HTML5 Media Stream Not Supported. ');
}

//
// Camera Device Controles
//
libMs.getMediaStreams = function(setter) {
  MediaStreamTrack.getSources(function(setter,data) {
      // デバイスを取得
      let no = 1;
      for (var i = 0; i != data.length; ++i) {
        var name = 'No.' + no + ':';
        var id = '';
        if ((data[i].kind === 'video')) {
          if (data[i].facing === 'user') {
            // Android フロントカメラ
            name += ' SP フロントカメラ';
          } else if (data[i].facing === 'environment') {
            // Android バックカメラ
            name += ' SP 背面カメラ';
          } else {
            name += ' Webカメラ';
          }
          // PCの場合はfacing表示なしらしい
          var info = {'id':data[i].id,'name':name,'label': data[i].label};
          setter(info);
          no++;
        }
      }
      // 取得完了シグナル送信
      setter(null);
    }.bind(null,setter));
}
