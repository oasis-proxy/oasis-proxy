<script setup>
import { onMounted, ref } from 'vue'
import RequestTable from './RequestTable.vue'
import RequestTab from './RequestTab.vue'
import { getRules, checkRules } from '@/core/rules_pretest.js'
import Browser from '@/Browser/main'

const tableList = ref([])
const tabsList = ref([])
const activeRules = ref({})
const maxRows = ref(1000)
const contentFilter = ref('')
const selectedTabsId = ref('')

const copyShow = ref(false)

onMounted(async () => {
  await getPolicyRules()
  Browser.Runtime.addMessageListener(function (request) {
    if (request.instruction == 'sendRequestItem')
      handleOne(request.data.mode, request.data.details)
  })
  Browser.Tabs.addRemovedListener((tabId) => {
    const index = tabsList.value.findIndex((e) => e.tabId == tabId)
    tabsList.value[index].valid = false
  })
  Browser.Tabs.addUpdatedListener((tabId, changeInfo) => {
    if (changeInfo.title != null) {
      const index = tabsList.value.findIndex((e) => e.tabId == tabId)
      tabsList.value[index].title = changeInfo.title
    }
  })
  Browser.Storage.changed(function (changes, areaName) {
    if (areaName === 'local' && changes.status_proxyKey != null) {
      getPolicyRules()
    }
  })
})

function filterTabsId(tabId) {
  selectedTabsId.value = tabId
}

async function changeTabName(tabId) {
  const index = tabsList.value.findIndex((e) => e.tabId == tabId)
  if (tabId == Browser.Tabs.TAB_ID_NONE) {
    tabsList.value[index].title = Browser.I18n.getMessage(
      'aside_label_nonetabs'
    )
    return
  }
  const tab = await Browser.Tabs.get(tabId)
  tabsList.value[index].title = tab.title
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text)
  copyShow.value = true
  setTimeout(() => {
    copyShow.value = false
  }, 3000)
}

function handleSearch(event) {
  contentFilter.value = event.target.value
}

function handleEmpty() {
  tableList.value = []
  tabsList.value = []
}

function handleOne(mode, details) {
  let index = tableList.value.findIndex((e) => e.requestId == details.requestId)
  if (details.url.startsWith('chrome')) return
  if (index == -1) {
    if (mode != 'beforeRequest') return
    tableList.value.push({
      tabId: details.tabId,
      requestId: details.requestId,
      timeStamp: details.timeStamp,
      data: {}
    })
    index = tableList.value.findIndex((e) => e.requestId == details.requestId)
    if (tabsList.value.findIndex((e) => e.tabId == details.tabId) == -1) {
      tabsList.value.push({
        tabId: details.tabId,
        title: '',
        valid: true
      })
      changeTabName(details.tabId)
    }
  }
  let tmp
  switch (mode) {
    case 'beforeRequest':
      tmp = converBeforeRequest(details)
      Object.keys(tmp).forEach((key) => {
        tableList.value[index][key] = tmp[key]
      })
      tableList.value[index].data.beforeRequest = { timeStamp: tmp.timeStamp }
      break
    case 'beforeRedirect':
      tableList.value[index].requestId = 'r_' + tableList.value[index].requestId
      tableList.value[index].status = 'redirect'
      tableList.value[index].redirectUrl = details.redirectUrl
      tableList.value[index].fromCache = details.fromCache
      tableList.value[index].ip = details.ip == null ? '-' : details.ip
      tableList.value[index].duration = Math.round(
        details.timeStamp - tableList.value[index].data.beforeRequest.timeStamp
      )
      break
    case 'responseStart':
      tableList.value[index].status = 'active'
      tableList.value[index].ip = details.ip == null ? '-' : details.ip
      tableList.value[index].fromCache = details.fromCache
      break
    case 'completed':
      tableList.value[index].status = 'complete'
      tableList.value[index].fromCache = details.fromCache
      tableList.value[index].ip = details.ip == null ? '-' : details.ip
      tableList.value[index].duration = Math.round(
        details.timeStamp - tableList.value[index].data.beforeRequest.timeStamp
      )
      break
    case 'errorOccurred':
      tableList.value[index].status = 'error'
      tableList.value[index].error = details.error
      tableList.value[index].fromCache = details.fromCache
      tableList.value[index].duration = Math.round(
        details.timeStamp - tableList.value[index].data.beforeRequest.timeStamp
      )
      break
  }
  if (index >= maxRows.value) {
    const shiftItem = tableList.value.shift()
    if (!tableList.value.find((e) => e.tabId == shiftItem.tabId)) {
      tabsList.value.splice(
        tabsList.value.findIndex((e) => e.tabId == shiftItem.tabId),
        1
      )
    }
  }
}

async function getPolicyRules() {
  const result = await Browser.Storage.getLocalAll()
  if (result[result.status_proxyKey] == null) {
    return
  }
  activeRules.value = getRules(result[result.status_proxyKey])
}

function converBeforeRequest(details) {
  const res = {}
  const policyRule = checkRules(details.url, activeRules.value)
  res.requestId = details.requestId
  res.date = new Date(details.timeStamp).toLocaleTimeString()
  res.timeStamp = Math.round(details.timeStamp)
  res.status = 'active'
  res.host = new URL(details.url).hostname
  res.fromCache = details.fromCache
  res.policy = policyRule.policy
  res.group = policyRule.group
  res.rule = policyRule.rule == '' ? '-' : policyRule.rule
  res.ip = '-'
  res.duration = '-'
  res.method = details.method
  res.url = details.url
  res.initiator = details.initiator
  res.tabId = details.tabId
  res.type = details.type
  return res
}
</script>
<template>
  <RequestTab
    class="col-2 sidebar vstack"
    :tabsList="tabsList"
    @filterTabsId="filterTabsId"
  ></RequestTab>
  <div class="col-10 h-100 vstack">
    <div>
      <div class="hstack gap-4">
        <button class="btn btn-sm btn-primary" @click="handleEmpty">
          <i class="bi bi-trash-fill me-2"></i>
          <span>
            {{ Browser.I18n.getMessage('btn_label_empty') }}
          </span>
        </button>
        <div class="ms-auto"></div>
        <Transition>
          <div v-show="copyShow">
            <i class="bi bi-check-circle-fill me-2 icon-btn"></i>
            <span>{{ Browser.I18n.getMessage('desc_copy') }}</span>
          </div>
        </Transition>
        <div class="input-group input-group-sm" style="width: 200px">
          <label class="input-group-text">{{
            Browser.I18n.getMessage('form_label_max_rows')
          }}</label>
          <select class="form-select form-select-sm" v-model="maxRows">
            <option value="1000">1000</option>
            <option value="2000">2000</option>
            <option value="5000">5000</option>
            <option value="10000">10000</option>
          </select>
        </div>
        <div class="input-group-sm input-group" style="width: 320px">
          <span class="input-group-text">{{
            Browser.I18n.getMessage('form_label_filter')
          }}</span>
          <input
            class="form-control form-control-sm"
            :placeholder="Browser.I18n.getMessage('placeholder_filter_request')"
            type="text"
            :value="contentFilter"
            @blur="handleSearch"
          />
        </div>
      </div>
    </div>
    <hr />
    <div class="overflow-auto" style="min-height: 60%">
      <RequestTable
        :contentFilter="contentFilter"
        :tabIdFilter="selectedTabsId"
        :tableList="tableList"
        @copyToClipboard="copyToClipboard"
      ></RequestTable>
    </div>
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
