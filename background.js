chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Forward the message to content.js
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, request, function(response) {
        // Handle the response from content.js
        sendResponse(response);
      });
    });
    // Indicate that we want to send a response asynchronously
    return true;
  });

  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'recordAudio') {
      const audioBlob = await recordAudio();
      sendResponse({ audioBlob: audioBlob });
    }
    return true; // Indicates an asynchronous response
  });