<script setup>
import { ref, onMounted, getCurrentInstance, onUnmounted } from 'vue'

import Browser from '@/Browser/main'

const instance = getCurrentInstance()
const toastMessage = instance?.appContext.config.globalProperties.$toastMessage

const tableList = ref([])
const iptags = ref({})

onMounted(async () => {
  await getIptags()
  await getMessage()
  Browser.Runtime.addMessageListener(handleMessageReceived)
})

function handleMessageReceived(request) {
  if (request.instruction == 'updateList') getMessage()
  else if (request.instruction == 'clearList') clearMessage()
}

onUnmounted(() => {
  Browser.Runtime.removeMessageListener(handleMessageReceived)
})

async function getIptags() {
  const res = await Browser.Storage.getLocal('config_iptags')
  if (res.config_iptags != null) {
    iptags.value = res.config_iptags
  }
}

async function clearMessage() {
  tableList.value = []
}

async function getMessage() {
  const tabs = await Browser.Tabs.getActiveTab()
  const activeTabId = 'tabId_' + tabs[0].id.toString()

  const requestSession = await Browser.Storage.getSession(activeTabId)
  if (!requestSession[activeTabId]) {
    tableList.value = []
    return
  }
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
  })
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text)
  toastMessage.info(Browser.I18n.getMessage('desc_copy'))
}
</script>
<template>
  <div class="px-3 pb-1 mt-1">
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
      <tbody v-show="tableList.length == 0">
        <tr>
          <td colspan="2" class="text-center text-muted">
            {{ Browser.I18n.getMessage('desc_list_empty') }}
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
