<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import Browser from '@/Browser/main'
import { log } from '@/core/utils.js'

const route = useRoute()
const configMonitor = ref(false)
const quickEnabled = ref(false)

const navList = ref([
  {
    name: Browser.I18n.getMessage('desc_proxy_selection'),
    path: '/',
    enabled: true
  },
  {
    name: Browser.I18n.getMessage('desc_monitor'),
    path: '/monitor',
    enabled: true
  },
  {
    name: Browser.I18n.getMessage('desc_quick_add'),
    path: '/quick',
    enabled: true
  },
  { name: Browser.I18n.getMessage('desc_info'), path: '/info', enabled: true }
])

onMounted(async () => {
  const result = await Browser.Storage.getLocal(['config_ui'])
  let theme
  switch (result.config_ui) {
    case 'dark':
      theme = 'dark'
      break
    case 'system':
      if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        theme = 'dark'
      } else {
        theme = 'light'
      }
      break
    default:
      theme = 'light'
      break
  }
  document.body.setAttribute('data-bs-theme', theme)

  await updateNavList()
  chrome.runtime.onMessage.addListener(function (request) {
    if (request.instruction == 'updateList') updateNavList()
  })
})

async function updateNavList() {
  const result = await Browser.Storage.getLocal(['config_monitor'])
  configMonitor.value = result.config_monitor

  const tabs = await Browser.Tabs.getActiveTab()
  const activeTabId = 'tabId_' + tabs[0].id.toString()
  const tabInfo = await Browser.Tabs.get(tabs[0].id)
  log.debug('active tab info:', tabInfo)
  if (
    tabInfo.url == null ||
    (!tabInfo.url.startsWith('http://') && !tabInfo.url.startsWith('https://'))
  ) {
    quickEnabled.value = false
    navList.value = [
      {
        name: Browser.I18n.getMessage('desc_proxy_selection'),
        path: '/',
        enabled: true
      },
      {
        name: Browser.I18n.getMessage('desc_monitor'),
        path: '/monitor',
        enabled: false
      },
      {
        name: Browser.I18n.getMessage('desc_quick_add'),
        path: '/quick',
        enabled: false
      }
    ]
    return
  }

  const requestSession = await Browser.Storage.getSession(activeTabId)

  if (!requestSession[activeTabId]) {
    quickEnabled.value = false
  } else {
    Object.keys(requestSession[activeTabId]).forEach((key) => {
      if (requestSession[activeTabId][key].status == 'Error') {
        quickEnabled.value = true
      }
    })
  }

  const path = route.path
  if (path == '/info') {
    navList.value = [
      {
        name: Browser.I18n.getMessage('desc_info'),
        path: '/info',
        enabled: true
      }
    ]
  } else if (path == '/quick' && route.query.source === 'menus') {
    navList.value = [
      {
        name: Browser.I18n.getMessage('desc_quick_add'),
        path: '/quick',
        enabled: true
      }
    ]
  } else {
    navList.value = [
      {
        name: Browser.I18n.getMessage('desc_proxy_selection'),
        path: '/',
        enabled: true
      },
      {
        name: Browser.I18n.getMessage('desc_monitor'),
        path: '/monitor',
        enabled: configMonitor.value
      },
      {
        name: Browser.I18n.getMessage('desc_quick_add'),
        path: '/quick',
        enabled: quickEnabled.value
      }
    ]
  }
}

function openMonitorPage() {
  window.open('/monitor.html', '_blank')
}

function openOptionsPage() {
  window.open('/options.html', '_blank')
}
</script>

<template>
  <div style="width: 100%">
    <div class="nav nav-underline shadow-sm px-2 pt-1">
      <div
        class="nav-item"
        v-for="item in navList"
        :key="item.path"
        :style="{ display: item.enabled ? 'block' : 'none' }"
      >
        <router-link class="nav-link" :to="item.path" active-class="active">{{
          item.name
        }}</router-link>
      </div>
      <div class="ms-auto d-flex align-items-center">
        <i
          class="bi bi-bug-fill icon-btn me-3"
          @click="openMonitorPage"
          v-if="configMonitor"
        ></i>
        <i class="bi bi-three-dots icon-btn me-2" @click="openOptionsPage"></i>
      </div>
    </div>
    <RouterView />
  </div>
</template>
