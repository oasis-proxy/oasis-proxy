<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import Browser from '@/Browser/main'

const router = useRouter()

const tableList = ref([])
const quickEnabled = ref(false)
const copyShow = ref(false)
const iptags = ref({})

onMounted(async () => {
  await getIptags()
  await getMessage()
  chrome.runtime.onMessage.addListener(function (request) {
    if (request.instruction == 'updateList') getMessage()
    if (request.instruction == 'clearList') clearMessage()
  })
})

async function getIptags() {
  const res = await Browser.Storage.getLocal('config_iptags')
  if (res.config_iptags != null) {
    iptags.value = res.config_iptags
  }
}

async function clearMessage() {
  tableList.value = []
  quickEnabled.value = false
}

async function getMessage() {
  const tabs = await Browser.Tabs.getActiveTab()
  const activeTabId = 'tabId_' + tabs[0].id.toString()

  const requestSession = await Browser.Storage.getSession(activeTabId)
  Object.keys(requestSession[activeTabId]).forEach((key) => {
    for (const index in tableList.value) {
      if (tableList.value[index].host == key) {
        if (['Loading', 'Redirect'].includes(tableList.value[index].ip)) {
          tableList.value[index].ip = requestSession[activeTabId][key].ip
          tableList.value[index].status =
            requestSession[activeTabId][key].status
        }
        return
      }
    }
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
  <div class="position-fixed w-100 bg-body shadow-sm">
    <div class="row justify-content-between px-3 py-2 mt-1">
      <div
        class="col-4 d-inline-flex align-items-center cursor-point"
        @click="router.push('/')"
      >
        <i class="bi bi-send-check me-2"></i>
        <span>{{ Browser.I18n.getMessage('desc_proxy_selection') }}</span>
      </div>
      <div class="col-4 d-inline-flex justify-content-center">
        <Transition>
          <div v-show="copyShow">
            <i class="bi bi-check-circle-fill me-2 icon-btn"></i>
            <span>{{ Browser.I18n.getMessage('desc_copy') }}</span>
          </div>
        </Transition>
      </div>
      <div class="col-4 d-inline-flex justify-content-end">
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
  </div>
  <div class="px-3 pb-1 mt-5">
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
              >{{ iptags[item.ip] ? iptags[item.ip] : item.ip }}</span
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
