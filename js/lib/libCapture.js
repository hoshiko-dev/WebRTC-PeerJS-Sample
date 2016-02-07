'use strict';
var libCapture = libCapture || {};
// Compatibility shim
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

if (!navigator.webkitGetUserMedia){
  // ブラウザ非対応
  alert('API：getUserMedia Not Found');
}
var capMediaId = null;
var capExtensionId = null;

libCapture.startDesktopCapture = function(extId,params,callbacks) {
  capExtensionId = extId;
  chrome.runtime.sendMessage(extId, { 'action': 'start'},
  function(response) {
      console.log("Capture Messsage recieve: " ,response);
      if (response !== undefined) {
        capMediaId = response.requestId;
        console.log('set mediaId ',capMediaId,response.mediaId);
        navigator.webkitGetUserMedia({
              audio:false,
              video: {
                      mandatory: {
                        maxWidth: params['width'],
                        maxHeight: params['height'],
                        maxFrameRate: params['maxFrameRate'],
                        minFrameRate: params['minFrameRate'],
                        chromeMediaSource: "desktop",
                        chromeMediaSourceId: response.mediaId
                      },
                      optional: [{
                          minFrameRate: params['minFrameRate']
                      }]
              }
            }, function(stream) {
              if (callbacks['init']) {
                var func = callbacks['init'];
                func(stream);
              }
            },function(err) {
              console.log(err);
              alert('Desktop capture Error');
            }
        );
      }

  });
}
libCapture.stopCapture = function() {
  if (capMediaId) {
    console.log('stopCapture',capMediaId);
    try {
      chrome.runtime.sendMessage(capExtensionId, { 'action': 'stop','requestId':capMediaId});
    } catch(e) {
      console.log('Capture Cancel Call Exception.');
    }
    capMediaId = null;
  }
}
