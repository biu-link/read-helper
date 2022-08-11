<template>
  <main>
    <h3>Read-Helper Options</h3>

    <h6>v 0.0.1</h6>

    <label>External translation website: </label>
    <select id="translateSite" v-model="translateSite">
      <option value="Google">Google</option>
      <option value="Youdao">Youdao</option>
    </select>

    <br>
    <br>

    <button @click="onSave">Save</button>
    <br>
    <br>

    <a href="#">Power by {{ crx }}</a>
  </main>
</template>

<script setup>
import {ref} from 'vue'

const crx = ref('biu.link')
const translateSite = ref('Google');

function onSave() {
  chrome.storage.local.set({translateSite: translateSite.value});
}

function init() {
  chrome.storage.local.get(['translateSite'], (result)=>{
    console.info('local storage:', result);
    translateSite.value = result.translateSite;
  });
}

init();

</script>


<style>
main {
  text-align: center;
  padding: 1em;
  margin: 0 auto;
}

h3 {
  color: #42b983;
  font-size: 1.5rem;
  font-weight: 200;
  line-height: 1.2rem;
  margin: 2rem auto;
}

h6 {
  font-size: 0.5rem;
  color: #999999;
  margin: 0.5rem;
}

a {
  font-size: 0.5rem;
  margin: 0.5rem;
  color: #cccccc;
  text-decoration: none;
}

@media (min-width: 480px) {
  h3 {
    max-width: none;
  }
}

@media (prefers-color-scheme: light) {
  a:hover {
    color: #747bff;
  }

  h6 {
    color: #333333;
  }
}
</style>
