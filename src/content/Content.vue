<template>
  <div id="read-helper-wrapper"
       ref="readHelperWrapper"
       :style="style"
       v-if="show"
       @click.stop="()=>{}"
       @mousemove.stop="()=>{}"
  >
    <div id="read-helper-tool-bar">
      <span @click.stop="clear"
            @mousemove.stop="()=>{}"
            @mouseup.stop="()=>{}"
            id="clear-read-helper"
      >Clear</span>
      <span @click="hide" id="close-read-helper">Close</span>
    </div>
    <div v-if="result && result.sentences" id="content-box">
      <ul>
        <li v-for="(item, index) in result.sentences" :key="index">
          <span class="origin">
            <span v-for="(word, wordIndex) in item.orig.split(/\s/)" :key="wordIndex"
                  :class="{'current-word': matchWord(word)}">{{ word }}&nbsp;</span>
          </span>
          <p class="result">{{ item.trans }}</p>
        </li>
      </ul>
    </div>
    <div v-else id="content-box" class="read-helper-tip">
      <div>
        <ul>
          <li>点击目标区域进行翻译</li>
          <li>按住 Alt 移动鼠标到目标区域进行翻译</li>
          <li>F2 朗读鼠标所指单词</li>
        </ul>
      </div>
    </div>
    <div v-if="selectionTranslate && selectionTranslate.sentences" id="selection-box">
      <div v-for="(item, index) in selectionTranslate.sentences" :key="index" id="selectionDiv">
        <input class="origin"
               :value="item.orig"
               @change="translateWord($event.target.value)"
               @click.stop="()=>{}"
               @mousemove.stop="()=>{}"
               @keydown.stop="onKeydown"
               @mouseup.stop="()=>{}"
        >
        <p class="result"><a :href='transUrl(item.orig)'
                             target="_blank">{{ item.trans }}</a>
        </p>
        <ul v-if="selectionTranslate.dict">
          <li v-for="(sub, index) in selectionTranslate.dict" :key="index">
            <span>{{ sub.pos }}</span>
            <p>{{ sub.terms.join(', ') }}</p>
          </li>
        </ul>
      </div>
    </div>
    <textarea id="translate_content"></textarea>
  </div>
</template>

<script setup>
import {computed, nextTick, onMounted, ref, watchEffect} from "vue";
import {debounce} from "../utils/tool.js";
import {Howl, Howler} from 'howler';
import {useDraggable} from '@vueuse/core'

const props = defineProps({
  show: Boolean,
});

const text = ref('');
const result = ref(undefined);
const selectionContent = ref('');
const selectionTranslate = ref(undefined);
const currentWord = ref('');
const lastTTSWord = ref('');
const lastTTSAudio = ref('');
const translateSite = ref('Google');

let lastContent = null;
let lastMouseDownTarget = null;

const debounceTranslate = debounce(translate, 200);
const debounceGetWordAtPoint = debounce(getWordAtPoint, 100);

const readHelperWrapper = ref();

// `style` will be a helper computed for `left: ?px; top: ?px;`
const {style} = useDraggable(readHelperWrapper, {
  exact: true,
  axis: 'x',
  preventDefault: true,
  stopPropagation: true,
  initialValue: {
    y: 10,
    x: document.body.clientWidth - 10 - 250,
  }

})

async function hide() {
  chrome.runtime.sendMessage({command: "close-read-helper-extension"});
}

watchEffect(() => {
  if (!props.show) {
    result.value = undefined;
    currentWord.value = '';
    selectionTranslate.value = undefined;
  }
})

function onSelectionChange(e) {
  let target = document.getSelection().anchorNode;
  if (target && target.id === 'selectionDiv') {
    return;
  }

  let selection = document.getSelection().toString();
  selection = selection.trim();
  if (selection && selection.length > 0) {
    translateWord(selection)
    selectionContent.value = selection;
  } else {
    selectionContent.value = '';
    debounceGetWordAtPoint(e.x, e.y);
    // setTimeout(()=>{}, 1000);
  }
}

function translateWord(word) {

  if (word.endsWith(',')) {
    word = word.substring(0, word.length - 1).trim();
  }

  chrome.runtime.sendMessage({
    command: "translate",
    data: {
      content: word
    }
  }, (res) => {
    console.info('res:', res);
    selectionTranslate.value = res;
    currentWord.value = word;
  });
}

function init() {

  chrome.storage.local.get(['translateSite'], (result) => {
    if (result && result.translateSite) {
      translateSite.value = result.translateSite;
    }
  })

  document.addEventListener('click', (e) => {
    if (!props.show) {
      return;
    }

    if (e.target !== lastMouseDownTarget) {
      return;
    }

    let content = e.target.innerText;
    debounceTranslate(content);

    showSelectionBox(e);

  });

  document.addEventListener('mousemove', (e) => {
    if (!props.show) {
      return;
    }

    if (e.altKey) {
      let content = e.target.innerText;
      debounceTranslate(content);

      showSelectionBox(e);

      const input = document.getElementById('translate_content');
      input.value = content;
      input.select();
      document.execCommand('copy');
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (!props.show) {
      return;
    }

    debounceGetWordAtPoint(e.x, e.y);
  });

  document.addEventListener('mousedown', (e) => {
    if (!props.show) {
      return;
    }

    lastMouseDownTarget = e.target;

  });

  document.addEventListener('keydown', (e) => {
    if (!props.show) {
      return;
    }
    if (e.key === 'F2') {
      setTimeout(tts, 50);
    }
  });

  document.addEventListener('mouseup', (e) => {
    if (!props.show) {
      return;
    }

    setTimeout(() => {
      onSelectionChange(e)
    }, 50);
  });

} // init

function showSelectionBox(e) {

  let box = document.getElementById('read_helper_extension_box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'read_helper_extension_box';
    const body = document.querySelector('body');
    body.appendChild(box);
  }

  let rect = e.target.getBoundingClientRect();
  const body = document.getElementsByTagName("body")[0];
  const bodyRect = body.getBoundingClientRect();

  body.style.position = "relative";

  const pos = {
    left: rect.left - bodyRect.left - 5,
    top: rect.top - bodyRect.top - 5,
    width: rect.width + 6,
    height: rect.height + 6
  };

  box.setAttribute('style', `z-index: 999999; box-sizing: content-box; pointer-events: none; position:absolute; border: 2px solid #ed4014; `
      + `top:${pos.top}px; left:${pos.left}px; height:${pos.height}px; width:${pos.width}px;`);

}

async function translate(content) {
  if (content && content.length > 5000) {
    content = content.substring(0, 5000);
  }

  if (!content) {
    return;
  }

  if (content === lastContent) {
    return;
  }

  lastContent = content;

  content = encodeURIComponent(content);
  console.info('content:', content);

  text.value = content;

  chrome.runtime.sendMessage({
    command: "translate",
    data: {
      content: text.value
    }
  }, (res) => {
    console.info('res:', res);
    result.value = res;
  });

}

function tts() {
  const word = currentWord.value;
  if (word.length <= 1) {
    return;
  }

  if (word === lastTTSWord.value) {
    playAudio(word, lastTTSAudio.value);
    return;
  }

  chrome.runtime.sendMessage({
    command: "tts",
    data: {
      content: word,
    }
  }, (res) => {
    playAudio(word, res);
  });
}

function playAudio(word, audio) {

  lastTTSWord.value = word;
  lastTTSAudio.value = audio;

  const sound = new Howl({
    src: `data:audio/ogg;base64,${audio}`,
    html5: true,
    onloaderror(id, error) {
      lastTTSWord.value = '';
      console.info('audio player load error:', id, error);
    },

    onplayerror(id, error) {
      lastTTSWord.value = '';
      console.info('audio player play error:', id, error);
    },

  });

  sound.play();
}

function getWordAtPoint(x, y) {

  if (selectionContent.value) {
    return;
  }

  var range = document.caretRangeFromPoint(x, y);

  if (range.startContainer.nodeType === Node.TEXT_NODE) {
    range.expand('word');
    let word = range && range.toString();
    if (word) {
      word = word.trim();
    }
    if (word.length <= 1) {
      return;
    }
    if (word !== currentWord.value) {
      currentWord.value = word;
      if (word) {
        translateWord(word);
      }
    }
  }

  return null;
}

function onKeydown(e) {
  if (e.key === 'F2') {

  } else {
    e.stopPropagation();
  }
}

function clear(e) {
  text.value = '';
  result.value = undefined;
  selectionContent.value = '';
  selectionTranslate.value = undefined;
  currentWord.value = '';
  lastContent = null;

  const box = document.getElementById("read_helper_extension_box");
  if (box) {
    box.remove();
  }

  e.stopPropagation();
}

const matchWord = computed(() => (word) => {
  if (currentWord.value && word && word.indexOf(currentWord.value) >= 0) {
    return true;
  }
});

const transUrl = computed(() => (word) => {
  if (translateSite.value === 'Youdao') {
    return `https://dict.youdao.com/result?word=${encodeURIComponent(word)}&lang=en`;
  } else if (translateSite.value === 'Google') {
    return `https://translate.google.com/?sl=en&tl=zh-CN&text=${encodeURIComponent(word)}&op=translate`;
  }
});

onMounted(() => {
  init();
});

</script>

<style lang="scss" scoped>
#read-helper-wrapper {
  position: fixed;
  bottom: 10px;
  width: 250px;
  font-size: 12px;
  line-height: 14px;

  text-align: left;

  padding: 0 4px 10px 4px;

  background-color: #fcfcfc;
  opacity: 0.9;
  border: 1px solid rgb(161, 161, 161);
  border-radius: 10px;
  box-shadow: 0px 0px 10px #494949;

  z-index: 9999999999;

  display: flex;
  flex-direction: column;

  &:hover {
    opacity: 1;
  }

  #read-helper-tool-bar {
    text-align: right;
    width: 110px;
    margin-left: 130px;
    padding: 10px 5px 0 10px;
    flex: none;

    #close-read-helper, #clear-read-helper {
      display: inline-block;
      padding: 4px 5px;
      border: 1px solid #999999;
      border-radius: 4px;
      cursor: pointer;
      background-color: #dedede;

      &:hover {
        background-color: #efefef;
      }
    }

    #clear-read-helper {
      background-color: #67c23a;
      border: 1px solid #67c23a;
      margin-right: 5px;
      color: #fff;

      &:hover {
        background-color: #95d475;
      }
    }
  }

  #content-box, #selection-box {
    margin: 10px 0 0 0;
    padding: 5px 0 0 0;
    flex: auto;
    overflow-y: auto;
    overflow-x: hidden;
    overflow-wrap: anywhere;
    font-size: 16px;
    line-height: 20px;

    border: 1px solid #cecece;
    border-radius: 4px;

    &::-webkit-scrollbar {
      width: 5px;
      background: #EDEDED;
      border-radius: 5px;
    }

    &::-webkit-scrollbar-thumb {
      background: #ff9800;
      border-radius: 5px;
    }

    ul {
      padding-left: 25px;

      li {
        padding-left: 0;
        list-style: disc;
        background: none;
        line-height: 20px;
        margin: 0;
      }
    }

    p, ul {
      line-height: 20px;
      margin: 0 0 10px 0;
    }

    .current-word {
      background-color: gold;
    }

    .result {
      line-height: 20px;
    }

    &.read-helper-tip {
      padding: 6px !important;
      display: flex;
      justify-content: center;
      align-items: center;

      div {
        font-size: 12px !important;
        color: #3f3f3f !important;
      }
    }
  }

  #selection-box {
    min-height: 200px;
    max-height: 200px;
    padding: 5px;
    flex: none;

    .origin {
      margin-bottom: 5px;
      width: 100%;
      outline: none;
    }
  }

  #translate_content {
    position: absolute;
    top: -999px;
    width: 1px;
    height: 1px;
  }

}
</style>
