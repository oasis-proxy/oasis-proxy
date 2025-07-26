<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ProxySelect from '../../components/ProxySelect.vue'
import { addLocalRuleItemForAuto } from '@/core/proxy_config.js'
import { getSuffix } from '@/core/utils'
import Browser from '@/Browser/main'
import {
  getNextLocalVersion,
  getSyncUploadStatus,
  overWriteToCloud
} from '@/core/version_control.js'

const router = useRouter()

const selectedProxy = ref('direct')
const domains = ref([])
const activeProxyLabel = ref('')
const checkedDomains = ref([])
const autoRefresh = ref(false)

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
})

async function quickAddLocalRuleList() {
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
  const newProxyConfig = addLocalRuleItemForAuto(
    newRules,
    result[result.status_proxyKey]
  )
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    [result.status_proxyKey]: newProxyConfig,
    config_version: version
  })
  const newResult = await Browser.Storage.getLocalAll()
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
  <div class="position-fixed w-100 bg-body shadow-sm">
    <div class="hstack px-3 py-2 mt-1">
      <div
        class="d-flex align-items-center cursor-point"
        @click="router.push('/monitor')"
      >
        <i class="bi bi-speedometer me-2"></i>
        <span>{{ Browser.I18n.getMessage('desc_monitor') }}</span>
      </div>
      <div class="ms-auto text-truncate" style="max-width: 50%">
        {{ activeProxyLabel }}
      </div>
    </div>
  </div>
  <div class="px-3 py-2 vstack gap-2 mb-1 mt-5">
    <div>{{ Browser.I18n.getMessage('desc_add_rules') }}</div>
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
        <button
          type="button"
          class="btn btn-sm btn-primary"
          @click="quickAddLocalRuleList"
        >
          <i class="bi bi-check-circle-fill me-2"></i>
          <span>{{ Browser.I18n.getMessage('btn_label_add_config') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
