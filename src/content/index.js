console.info('chrome-ext template-vue-js content script')

import {createApp, h, reactive} from 'vue'
import App from './Content.vue'

const body = document.querySelector('body')
const anchor = document.createElement('div')
anchor.id = 'read_helper_extension_root'
body.appendChild(anchor)

const props = reactive({
  show: false
});

const app = createApp(
  {
    render() {
      return h(App, props)
    }
  })

app.mount(anchor);

chrome.runtime.onMessage.addListener(
  function (request) {
    if (request.command === "open-read-helper-extension") {
      props.show = !props.show;
    } else if (request.command === "close-read-helper-extension") {
      props.show = false;
    }
  }
);
