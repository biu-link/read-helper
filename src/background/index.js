console.info('chrome-ext template-vue-js background script')

// Check when the extension button is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, {command: "open-read-helper-extension"});
});

chrome.runtime.onMessage.addListener(
  function(request, sender) {
    if (request.command === "close-read-helper-extension") {
      chrome.tabs.sendMessage(sender.tab.id, {command: "close-read-helper-extension"});
    }
  }
);
