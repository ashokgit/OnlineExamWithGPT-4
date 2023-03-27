  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'getDocumentBody') {
      // Get the document body and send it back to popup.js
      var documentBody = document.body.innerHTML;
      sendResponse(documentBody);
    }
  });