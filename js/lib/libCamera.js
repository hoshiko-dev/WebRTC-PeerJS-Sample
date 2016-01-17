'use strict';
var libCamera = libCamera || {};
// Compatibility shim
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

if (!navigator.getUserMedia){
  // ブラウザ非対応
  alert('API：getUserMedia Not Found');
}

//
// Camera Device Controles
//
libCamera.getCameraTestResults = function(param,callback) {
  let params = {
    audio:false,
    video: {
      mandatory: {
        //'minWidth': param['width'],
        'maxWidth': param['width'],
        'minHeight': param['height'],
        'maxHeight': param['height'],
        'maxFrameRate': 30,
        'minFrameRate': 1
      },
      optional: [{
          minFrameRate: 1
      }]
    }
  };
  if (param['camera_id'] !== undefined && param['camera_id'] !== '') {
    params['video']['optional'].push({'sourceId':param['camera_id']});
  }
  navigator.getUserMedia(params, function (stream) {
    param['result'] = true;
    param['stream'] = stream;
    console.log('camera ok!',param);
    callback(param);
  }, function (err) {
    param['result'] = false;
    console.log('camera ng',param,err);
    callback(param);
  });
};
