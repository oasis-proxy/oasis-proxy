<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ProxySelect from '../../components/ProxySelect.vue'
import { addInternalRulesForAuto } from '@/core/ProxyConfig.js'
import Browser from '@/Browser/chrome/chrome.js'

const router = useRouter()

const selectedProxy = ref('direct')
const domains = ref([])
const activeProxyLabel = ref('')
const checkedDomains = ref([])

onMounted(async () => {
  const result = await Browser.Storage.getLocal(['status_proxyKey'])
  if (result.status_proxyKey != null && result.status_proxyKey != '') {
    activeProxyLabel.value =
      '当前策略：' + decodeURIComponent(result.status_proxyKey.substring(6))
  }

  const tabs = await Browser.Tabs.query({ active: true, currentWindow: true })

  const activeTabId = tabs[0].id
  let response = await Browser.Message.send({ tabId: activeTabId })

  if (response.data.list == '') {
    return
  }
  const tmpList = JSON.parse(response.data.list)
  Object.keys(tmpList).forEach((hostname) => {
    if (tmpList[hostname].status == 'Error') {
      const parts = hostname.split('.')
      if (parts.length >= 3) {
        parts[0] = '*'
      } else {
        parts.unshift('*')
      }
      const root = parts.join('.')
      if (!domains.value.includes(root)) {
        domains.value.push(root)
        checkedDomains.value.push(root)
      }
    }
  })
})

function suffixByIndex(domain, level = 2) {
  const parts = domain.split('.')
  let suffix = []

  if (level <= parts.length) {
    suffix = parts.splice(1 - level)
    suffix.unshift('')
  } else {
    suffix = parts
  }
  return suffix.join('.')
}

async function quickAddInternalRules() {
  const result = await Browser.Storage.getLocalAll()
  const newRules = []
  checkedDomains.value.forEach((item) => {
    newRules.push({ mode: 'domain', data: item, proxy: selectedProxy.value })
  })
  const newProxyConfig = addInternalRulesForAuto(
    newRules,
    result[result.status_proxyKey]
  )
  const storeObj = {}
  storeObj[result.status_proxyKey] = newProxyConfig
  await Browser.Storage.setLocal(storeObj)
  // todo close window
  Browser.Proxy.set(result, result.status_proxyKey)
  window.close()
}
</script>

<template>
  <div class="hstack px-3 py-2 mt-1">
    <div
      class="d-flex align-items-center cursor-point"
      @click="router.push('/monitor')"
    >
      <i class="bi bi-speedometer me-2"></i>
      <span>监控</span>
    </div>
    <div class="ms-auto">{{ activeProxyLabel }}</div>
  </div>
  <hr class="my-1" />
  <div class="px-3 py-2 vstack gap-2 mb-1">
    <div>在当前策略中快速添加以下规则：</div>
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
          @click="quickAddInternalRules"
        >
          <i class="bi bi-check-circle-fill me-1"></i>
          添 加
        </button>
      </div>
    </div>
  </div>
</template>
