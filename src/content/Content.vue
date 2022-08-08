<template>
  <div class="read-helper-wrapper" v-if="show" @click="onClick" @mousemove="onMouseMove">
    <div class="tool-bar">
      <span @click="hide" class="close-read-helper">Hide</span>
    </div>
    <div v-if="result && result.sentences" id="content-box" @mouseup="onSelectionChange">
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
    <div v-if="selectionTranslate && selectionTranslate.sentences" id="selection-box">
      <div v-for="(item, index) in selectionTranslate.sentences" :key="index">
        <input class="origin" :value="item.orig" @change="translateWord($event.target.value)">
        <p class="result"><a :href='`https://dict.youdao.com/result?word=${encodeURIComponent(item.orig)}&lang=en`'
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
  </div>
</template>

<script setup>
import {computed, onMounted, ref, watchEffect} from "vue";
import {debounce} from "../utils/tool.js";

const props = defineProps({
  show: Boolean,
});

const text = ref('');
const result = ref(undefined);
const selectionTranslate = ref(undefined);
const currentWord = ref('');
let lastContent = null;

const debounceTranslate = debounce(translate, 200);

const debounceGetWordAtPoint = debounce(getWordAtPoint, 100);

async function hide() {
  chrome.runtime.sendMessage({command: "close-read-helper-extension"});
}

function onClick(e) {
  e.stopPropagation();
}

function onMouseMove(e) {
  e.stopPropagation();
}

function onSelectionChange(e) {
  let selection = document.getSelection().toString();
  selection = selection.trim();
  if (selection && selection.length > 0) {
    translateWord(selection)
  } else {
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
  });
}

function init() {

  document.addEventListener('click', (e) => {
    if (!props.show) {
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
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (!props.show) {
      return;
    }

    debounceGetWordAtPoint(e.x, e.y);
  });

}

function showSelectionBox(e) {

  let box = document.getElementById('read_helper_extension_box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'read_helper_extension_box';
    const body = document.querySelector('body');
    body.appendChild(box);
  }

  let rect = e.target.getBoundingClientRect();
  let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const pos = {
    left: rect.left + scrollLeft - 5,
    top: rect.top + scrollTop - 5,
    width: rect.width + 6,
    height: rect.height + 6
  };

  box.setAttribute('style', `box-sizing: content-box; pointer-events: none; position:absolute; border: 2px solid #ed4014; `
      + `top:${pos.top}px; left:${pos.left}px; height:${pos.height}px; width:${pos.width}px;`);

}

function translate(content) {
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

function getWordAtPoint(x, y) {
  var range = document.caretRangeFromPoint(x, y);

  if (range.startContainer.nodeType === Node.TEXT_NODE) {
    range.expand('word');
    const word = range.toString().trim();
    currentWord.value = word;
    if (word) {
      translateWord(word);
    }
  }

  return null;
}

const matchWord = computed(() => (word) => {
  if (currentWord.value && word && word.indexOf(currentWord.value) >= 0) {
    return true;
  }
});

onMounted(() => {
  init();
});

</script>

<style lang="scss" scoped>
.read-helper-wrapper {
  position: fixed;
  right: 10px;
  top: 10px;
  bottom: 10px;
  width: 250px;

  padding: 0 4px 10px 4px;

  background-color: #fcfcfc;
  opacity: 0.9;
  border: 1px solid rgb(161, 161, 161);
  border-radius: 10px;
  box-shadow: 0px 0px 10px #494949;

  z-index: 9999;

  display: flex;
  flex-direction: column;

  &:hover {
    opacity: 1;
  }

  .tool-bar {
    text-align: right;
    padding: 10px 0 0 10px;
    flex: none;
    font-size: 12px;

    .close-read-helper {
      display: inline-block;
      padding: 2px 5px;
      border: 1px solid #999999;
      border-radius: 4px;
      cursor: pointer;
      background-color: #d0d0d0;

      &:hover {
        background-color: #efefef;
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
  }

  #selection-box {
    min-height: 200px;
    max-height: 200px;
    padding: 5px;
    flex: none;

    .origin {
      margin-bottom: 5px;
    }
  }

  .result {
    line-height: 20px;
  }

  .current-word {
    background-color: gold;
  }

}
</style>
