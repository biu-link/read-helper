console.info('chrome-ext template-vue-js content script')

import {createApp, h, reactive} from 'vue'
import App from './Content.vue'

const props = reactive({
  show: false
});

function initVue() {
  const body = document.querySelector('body')
  const anchor = document.createElement('div')
  anchor.id = 'read_helper_extension_root'
  body.appendChild(anchor)

  createApp(
    {
      render() {
        return h(App, props)
      }
    }).mount(anchor);
}

initVue();

function handleExtensionMessage(request) {
  if (request.command === "open-read-helper-extension") {
    props.show = !props.show;
  } else if (request.command === "close-read-helper-extension") {
    props.show = false;
    const box = document.getElementById("read_helper_extension_box");
    if (box) {
      box.remove();
    }
  }
}

chrome.runtime.onMessage.addListener(
  function (request) {

    const el = document.getElementById('read_helper_extension_root');
    if (!el) {
      initVue();
      setTimeout(() => {
        handleExtensionMessage(request)
      }, 1000);
      return;
    }

    handleExtensionMessage(request);
  }
);
