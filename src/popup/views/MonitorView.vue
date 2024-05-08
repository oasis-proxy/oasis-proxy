<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import Browser from '@/Browser/main'

const router = useRouter()

const tableList = ref([])
const quickEnabled = ref(false)
const copyShow = ref(false)

onMounted(async () => {
  getMessage()
  setInterval(() => {
    getMessage()
  }, 2000)
})

async function getMessage() {
  const tabs = await Browser.Tabs.query({ active: true, currentWindow: true })
  const activeTabId = tabs[0].id

  const requestSession = await Browser.Storage.getSession(
    activeTabId.toString()
  )
  Object.keys(requestSession[activeTabId]).forEach((key) => {
    for (const item of tableList.value) {
      if (item.host == key) return
    }
    // todo delete loading
    tableList.value.push({
      host: key,
      ip: requestSession[activeTabId][key].ip,
      status: requestSession[activeTabId][key].status
    })
    if (requestSession[activeTabId][key].status == 'Error') {
      quickEnabled.value = true
    }
  })
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text)
  copyShow.value = true
  setTimeout(() => {
    copyShow.value = false
  }, 3000)
}
</script>
<template>
  <div class="row justify-content-between px-3 py-2 mt-1">
    <div
      class="col-4 d-inline-flex align-items-center cursor-point"
      @click="router.push('/')"
    >
      <i class="bi bi-send-check me-2"></i>
      <span>{{ Browser.I18n.getMessage('desc_proxy_selection') }}</span>
    </div>
    <div class="col-4 d-inline-flex">
      <Transition>
        <div v-show="copyShow">
          <i class="bi bi-check-circle-fill me-2 icon-btn"></i>
          <span>{{ Browser.I18n.getMessage('desc_copy') }}</span>
        </div>
      </Transition>
    </div>
    <div class="col-4 d-inline-flex">
      <div
        class="d-inline-flex align-items-center cursor-point"
        v-if="quickEnabled"
        @click="router.push('/quick')"
      >
        <span>{{ Browser.I18n.getMessage('desc_quick_add') }}</span>
        <i class="bi bi-plus-circle ms-2"></i>
      </div>
    </div>
  </div>
  <hr class="my-1" />
  <div class="px-3 pb-1">
    <table class="table table-sm" id="monitorTable">
      <thead>
        <tr>
          <th scope="col">Host</th>
          <th scope="col">IP</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in tableList" :key="index">
          <td>
            <span
              class="truncate-text d-inline-block text-nowrap cursor-point"
              style="width: 150px"
              :title="item.host"
              @click="copyToClipboard(item.host)"
              >{{ item.host }}</span
            >
          </td>
          <td>
            <span
              class="truncate-text d-inline-block text-nowrap cursor-point"
              style="width: 120px"
              :title="item.ip"
              @click="copyToClipboard(item.ip)"
              >{{ item.ip }}</span
            >
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
