<script setup>
import Browser from '@/Browser/chrome/chrome.js'
import { ref } from 'vue'
const message = ref('')
async function getLocal() {
  const result = await Browser.Storage.getLocalAll()
  message.value = JSON.stringify(result)
}
async function getSync() {
  const result = await Browser.Storage.getSync(null)
  message.value = JSON.stringify(result)
}
function clearSync() {
  Browser.Storage.clearSync()
}
</script>
<template>
  <div class="tab-pane fade show" id="v-pills-debug">
    <div class="card">
      <div class="card-header">
        <span class="fw-bold">其他</span>
      </div>
      <div class="card-body">
        <div class="hstack gap-2 mb-2">
          <div>
            <button class="btn btn-primary btn-sm" @click="getLocal">
              获取本地
            </button>
          </div>
        </div>
        <div class="hstack gap-2 mb-2">
          <div>
            <button class="btn btn-primary btn-sm" @click="getSync">
              获取远程
            </button>
          </div>
        </div>
        <div class="hstack gap-2 mb-2">
          <div>
            <button class="btn btn-primary btn-sm" @click="clearSync">
              清除云端
            </button>
          </div>
        </div>
        <div>{{ message }}</div>
      </div>
    </div>
  </div>
</template>
