<script setup>
import { onMounted, ref, computed } from 'vue'
import RequestTable from './RequestTable.vue'
import RequestTab from './RequestTab.vue'
import { getRules, checkRules, getTempRuleList } from '@/core/rules_pretest.js'
import { log } from '@/core/utils.js'
import Browser from '@/Browser/main'

const requestList = ref([])
const tabList = ref([])
const activeRules = ref({})
const maxRows = ref(1000)
const contentFilter = ref('')
const selectedTabsId = ref('')
const copyShow = ref(false)

const list = computed(() => {
  return requestList.value.filter(
    (element) =>
      (!selectedTabsId.value || element.tabId == selectedTabsId.value) &&
      (element.url.indexOf(contentFilter.value) > -1 ||
        element.policy.indexOf(contentFilter.value) > -1 ||
        element.rule.indexOf(contentFilter.value) > -1 ||
        element.ip.indexOf(contentFilter.value) > -1)
  )
})

onMounted(async () => {
  await getPolicyRules()
  Browser.Runtime.addMessageListener(function (request) {
    if (request.instruction == 'sendRequestItem')
      handleRequest(request.data.mode, request.data.details)
  })
  Browser.Tabs.addRemovedListener((tabId) => {
    const index = tabList.value.findIndex((e) => e.tabId == tabId)
    tabList.value[index].valid = false
  })
  Browser.Tabs.addUpdatedListener((tabId, changeInfo) => {
    if (changeInfo.title != null) {
      const index = tabList.value.findIndex((e) => e.tabId == tabId)
      tabList.value[index].title = changeInfo.title
    }
  })
  Browser.Storage.changed(function (changes, areaName) {
    if (
      (areaName === 'local' && changes.status_proxyKey) ||
      areaName === 'session'
    ) {
      getPolicyRules()
    }
  })
})

async function getPolicyRules() {
  const result = await Browser.Storage.getLocalAll()
  if (!result[result.status_proxyKey]) {
    return
  }
  const tempRuleList = await getTempRuleList()
  activeRules.value = getRules(result[result.status_proxyKey], tempRuleList)
}

function filterTabsId(tabId) {
  selectedTabsId.value = tabId
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
  requestList.value = []
  tabList.value = []
}

async function handleRequest(mode, details) {
  if (!details.url.startsWith('http')) return

  let requestIdx = requestList.value.findIndex(
    (e) => e.requestId == details.requestId
  )

  if (requestIdx == -1) {
    // the first request in a tab
    if (mode != 'beforeRequest') return // record in beforeRequest, or discard
    requestList.value.push({
      tabId: details.tabId,
      requestId: details.requestId,
      timeStamp: details.timeStamp,
      data: {}
    })
    requestIdx = requestList.value.findIndex(
      (e) => e.requestId == details.requestId
    )

    if (tabList.value.findIndex((e) => e.tabId == details.tabId) == -1) {
      tabList.value.push({
        tabId: details.tabId,
        title: '',
        valid: true
      })
      // set Tab title
      const index = tabList.value.findIndex((e) => e.tabId == details.tabId)
      if (details.tabId == Browser.Tabs.TAB_ID_NONE) {
        tabList.value[index].title = Browser.I18n.getMessage(
          'aside_label_nonetabs'
        )
        return
      }
      const tab = await Browser.Tabs.get(details.tabId)
      tabList.value[index].title = tab.title
    }
  }
  let policyRule
  switch (mode) {
    case 'beforeRequest':
      policyRule = checkRules(details.url, activeRules.value)
      requestList.value[requestIdx].requestId = details.requestId
      requestList.value[requestIdx].date = new Date(
        details.timeStamp
      ).toLocaleTimeString()
      requestList.value[requestIdx].timeStamp = Math.round(details.timeStamp)
      requestList.value[requestIdx].status = 'active'
      requestList.value[requestIdx].host = new URL(details.url).hostname
      requestList.value[requestIdx].fromCache = details.fromCache
      requestList.value[requestIdx].policy = policyRule.policy
      requestList.value[requestIdx].group = policyRule.group
      requestList.value[requestIdx].rule = policyRule.rule
        ? policyRule.rule
        : '-'
      requestList.value[requestIdx].ip = '-'
      requestList.value[requestIdx].duration = '-'
      requestList.value[requestIdx].method = details.method
      requestList.value[requestIdx].url = details.url
      requestList.value[requestIdx].initiator = details.initiator
      requestList.value[requestIdx].tabId = details.tabId
      requestList.value[requestIdx].type = details.type
      requestList.value[requestIdx].data.beforeRequest = {
        timeStamp: details.timeStamp
      }
      break
    case 'beforeRedirect':
      requestList.value[requestIdx].requestId =
        'r_' + requestList.value[requestIdx].requestId
      requestList.value[requestIdx].status = 'redirect'
      requestList.value[requestIdx].redirectUrl = details.redirectUrl
      requestList.value[requestIdx].fromCache = details.fromCache
      requestList.value[requestIdx].ip = details.ip ? details.ip : '-'
      requestList.value[requestIdx].duration = Math.round(
        details.timeStamp -
          requestList.value[requestIdx].data.beforeRequest.timeStamp
      )
      break
    case 'responseStart':
      requestList.value[requestIdx].status = 'active'
      requestList.value[requestIdx].ip = details.ip ? details.ip : '-'
      requestList.value[requestIdx].fromCache = details.fromCache
      break
    case 'completed':
      requestList.value[requestIdx].status = 'complete'
      requestList.value[requestIdx].fromCache = details.fromCache
      requestList.value[requestIdx].ip = details.ip ? details.ip : '-'
      requestList.value[requestIdx].duration = Math.round(
        details.timeStamp -
          requestList.value[requestIdx].data.beforeRequest.timeStamp
      )
      break
    case 'errorOccurred':
      requestList.value[requestIdx].status = 'error'
      requestList.value[requestIdx].error = details.error
      requestList.value[requestIdx].fromCache = details.fromCache
      requestList.value[requestIdx].duration = Math.round(
        details.timeStamp -
          requestList.value[requestIdx].data.beforeRequest.timeStamp
      )
      break
  }

  log.debug(mode, details, requestList.value)
  if (requestIdx >= maxRows.value) {
    const shiftItem = requestList.value.shift()

    // remove the tabA from tabList if no tabA requests exist in requestList
    if (!requestList.value.find((e) => e.tabId == shiftItem.tabId)) {
      tabList.value.splice(
        tabList.value.findIndex((e) => e.tabId == shiftItem.tabId),
        1
      )
    }
  }
}
</script>
<template>
  <RequestTab
    class="col-2 sidebar vstack"
    :tabList="tabList"
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
          <label class="input-group-text"
            ><i class="bi bi-list-columns me-2"></i
            >{{ Browser.I18n.getMessage('form_label_max_rows') }}</label
          >
          <select class="form-select form-select-sm" v-model="maxRows">
            <option value="1000">1000</option>
            <option value="2000">2000</option>
            <option value="5000">5000</option>
            <option value="10000">10000</option>
          </select>
        </div>
        <div class="input-group-sm input-group" style="width: 320px">
          <span class="input-group-text">
            <i class="bi bi-filter-circle-fill me-2"></i
            >{{ Browser.I18n.getMessage('form_label_filter') }}</span
          >
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
        :list="list"
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
