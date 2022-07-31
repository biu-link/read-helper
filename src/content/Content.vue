<template>
  <div class="read-helper-wrapper" v-if="show">
    <button @click="hide">Hide</button>
  </div>
</template>

<script setup>
import {ref, watchEffect} from "vue";

const props = defineProps({
  show: Boolean,
});

async function hide() {
  chrome.runtime.sendMessage({command: "close-read-helper-extension"});
}

watchEffect(() => console.log("props.show = ", props.show));
</script>

<style>
.read-helper-wrapper {
  position: fixed;
  right: 10px;
  top: 10px;
  bottom: 10px;
  width: 200px;

  background-color: #dcdcdc;
  opacity: 0.6;
  border: 1px solid rgb(161, 161, 161);
  border-radius: 10px;
  box-shadow: 0px 0px 10px #494949;

  z-index: 9999;
}
</style>
