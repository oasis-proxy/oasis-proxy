<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ProxySelect from '../../components/ProxySelect.vue'
import { addRuleItemForAuto } from '@/core/proxy_config.js'
import { getSuffix } from '@/core/utils'
import Browser from '@/Browser/main'
import {
  getNextLocalVersion,
  getSyncUploadStatus,
  overWriteToCloud
} from '@/core/version_control.js'

const route = useRoute()

const selectedProxy = ref('direct')
const domains = ref([])
const activeProxyLabel = ref('')
const checkedDomains = ref([])
const autoRefresh = ref(false)
const rulesType = ref('link') // link, site

onMounted(async () => {
  const result = await Browser.Storage.getLocal([
    'status_proxyKey',
    'config_autoRefresh'
  ])
  autoRefresh.value = result.config_autoRefresh
  if (result.status_proxyKey != null && result.status_proxyKey != '') {
    activeProxyLabel.value =
      Browser.I18n.getMessage('desc_active_policy') +
      decodeURIComponent(result.status_proxyKey.substring(6))
  }
  if (route.query.source === 'menus') {
    loadQuickAddByContextMenus()
  } else {
    await loadQuickAdd()
  }

  const resLocal = await Browser.Storage.getLocal('config_monitor')
  if (resLocal.config_monitor) {
    chrome.action.setPopup({ popup: '/popup.html#/monitor' })
  } else {
    chrome.action.setPopup({ popup: '/popup.html#/' })
  }
})

async function loadQuickAddByContextMenus() {
  const sessionRes = await Browser.Storage.getSession('contextMenus_rules')
  if (sessionRes.contextMenus_rules == null) {
    return
  }
  rulesType.value = sessionRes.contextMenus_rules.rulesType
  sessionRes.contextMenus_rules.hosts.forEach((hostname) => {
    if (!domains.value.includes(hostname)) {
      domains.value.push(hostname)
      checkedDomains.value.push(hostname)
    }
  })
  await Browser.Storage.removeSession('contextMenus_rules')
}

async function loadQuickAdd() {
  const tabs = await Browser.Tabs.getActiveTab()

  const activeTabId = 'tabId_' + tabs[0].id.toString()

  const requestSession = await Browser.Storage.getSession(activeTabId)

  Object.keys(requestSession[activeTabId]).forEach((hostname) => {
    if (requestSession[activeTabId][hostname].status == 'Error') {
      const suffix = getSuffix(hostname)

      if (!domains.value.includes(suffix)) {
        domains.value.push(suffix)
        checkedDomains.value.push(suffix)
      }
    }
  })
}

async function submit() {
  const result = await Browser.Storage.getLocalAll()
  const newRules = []
  checkedDomains.value.forEach((item) => {
    newRules.push({
      data: item,
      mode: 'domain',
      proxy: selectedProxy.value,
      valid: true
    })
  })
  const newProxyConfig = addRuleItemForAuto(
    newRules,
    result[result.status_proxyKey],
    rulesType.value === 'site' ? 'site' : 'local'
  )
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    [result.status_proxyKey]: newProxyConfig,
    config_version: version,
    config_syncTime: new Date().getTime()
  })
  const newResult = await Browser.Storage.getLocalAll()
  // set proxy with a clean config without tempRules
  Browser.Proxy.set(newResult, newResult.status_proxyKey)
  if (newResult.config_autoSync) {
    const url =
      Browser.Runtime.getURL('options.html') +
      '#/auto/' +
      newResult.status_proxyKey.substring(6)
    switch (await getSyncUploadStatus()) {
      case 'upload':
        await overWriteToCloud()
        break
      case 'conflict':
        window.open(url)
        break
      default:
    }
  }
  if (autoRefresh.value) {
    const tabs = await Browser.Tabs.getActiveTab()
    if (
      tabs != null &&
      tabs.length > 0 &&
      tabs[0].id != chrome.tabs.TAB_ID_NONE
    ) {
      const tab = await Browser.Tabs.get(tabs[0].id)
      if (tab.url?.startsWith('http')) {
        Browser.Tabs.reload(tabs[0].id)
      }
    }
  }

  if (import.meta.env.VITE_APP_DEBUG != 'debug') {
    window.close()
  }
}
</script>

<template>
  <div class="px-3 py-2 vstack gap-2 mb-1 mt-1">
    <div v-if="rulesType === 'link'">
      {{
        Browser.I18n.getMessage('desc_add_rules') +
        '（' +
        activeProxyLabel +
        '）'
      }}
    </div>
    <div v-else>
      {{
        Browser.I18n.getMessage('desc_add_siterules') +
        '（' +
        activeProxyLabel +
        '）'
      }}
    </div>
    <div id="domainList" class="vstack gap-2">
      <div
        class="form-check-sm d-flex align-items-center"
        v-for="(item, index) in domains"
        :key="index"
      >
        <input
          class="form-check-input"
          type="checkbox"
          :id="domains[index]"
          :value="domains[index]"
          v-model="checkedDomains"
        />
        <label class="form-check-label ms-2" :for="domains[index]">{{
          domains[index]
        }}</label>
      </div>
    </div>
    <div class="hstack gap-2">
      <div>
        <div id="proxyList">
          <ProxySelect v-model="selectedProxy"></ProxySelect>
        </div>
      </div>
      <div class="ms-auto">
        <button type="button" class="btn btn-sm btn-primary" @click="submit">
          <i class="bi bi-check-circle-fill me-2"></i>
          <span>{{ Browser.I18n.getMessage('btn_label_add_config') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
