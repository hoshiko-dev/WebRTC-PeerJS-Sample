chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        console.log("Got request", request, sender);
        console.dir(sender.tab);
        console.dir(sendResponse);
        if (request.action === 'start') {
          var requestId = chrome.desktopCapture.chooseDesktopMedia(
            ["screen", "window"], sender.tab,
                  function(streamId) {
                    console.log(streamId);
                      sendResponse({ 'mediaId': streamId,'requestId': requestId});
                  });
        } else if (request.action === 'stop') {
          chrome.desktopCapture.cancelChooseDesktopMedia(request.requestId);
        } else if(request.action === 'extensions') {
          chrome.management.getAll(function(results){
            sendResponse({ 'results': results});
          });
        }
       return true; // Preserve sendResponse for future use
    }
);
