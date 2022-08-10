import {translate, tts} from "../utils/api.js";

console.info('chrome-ext template-vue-js background script')

// Check when the extension button is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, {command: "open-read-helper-extension"});
});

chrome.runtime.onMessage.addListener(
  function ({command, data}, sender, sendResponse) {

    switch (command) {

      case 'close-read-helper-extension':
        chrome.tabs.sendMessage(sender.tab.id, {command: "close-read-helper-extension"});
        break;

      case 'translate':
        translate(data.content).then((res) => {
          sendResponse(res.data)
        });
        break;

      case 'tts':
        tts(data.content).then((res) => {
          const base64String = btoa(String.fromCharCode(...new Uint8Array(res.data)));
          sendResponse(base64String);
        })
        break;

    }

    // return true keeps the sendResponse function valid
    return true;
  }
);
