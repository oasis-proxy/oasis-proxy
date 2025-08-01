<script setup>
import Browser from '@/Browser/main'
import { log } from '@/core/utils.js'
import { provide, ref, getCurrentInstance, onMounted, watch } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import AsideView from './views/AsideView.vue'
import BasicConfigModal from './views/dialog/BasicConfigModal.vue'
import SyncConflictModal from './views/dialog/SyncConflictModal.vue'
import UploadConflictModal from './views/dialog/UploadConflictModal.vue'
import { useConfigStore } from '@/options/stores/config'
import { useStatusStore } from '@/options/stores/status'
import { proxyUsedBy } from '@/core/proxy_config.js'
import {
  getNextLocalVersion,
  getSyncDownloadStatus,
  overWriteToLocal
} from '@/core/version_control.js'

const storeConfig = useConfigStore()
const storeStatus = useStatusStore()
const route = useRoute()
const router = useRouter()
const uploadConflictModal = ref(null)
const syncConflictModal = ref(null)
const basicConfigModal = ref(null)
const bCMOperationType = ref('newConfig')
const bCMConfigMode = ref('servers')

const instance = getCurrentInstance()
const toast = instance?.appContext.config.globalProperties.$toast
const confirmModal = instance?.appContext.config.globalProperties.$confirm

watch(
  () => storeConfig.computedTheme,
  (newValue) => {
    document.body.setAttribute('data-bs-theme', newValue)
  },
  { immediate: true }
)

onMounted(async () => {
  let result = await Browser.Storage.getLocalAll()
  storeConfig.configUI = result.config_ui
  storeConfig.configAutoSync = result.config_autoSync
  storeConfig.configMonitor = result.config_monitor
  storeConfig.configUpdateUrl = result.config_updateUrl

  if (storeConfig.configAutoSync) {
    switch (await getSyncDownloadStatus()) {
      case 'download':
        await overWriteToLocal()
        await Browser.Proxy.reloadOrDirect(undefined, true)
        break
      case 'conflict':
        showSyncConflictModal(Browser.I18n.getMessage('modal_desc_conflict'))
        break
      default:
    }
  }

  result = await Browser.Storage.getLocalAll()
  storeStatus.activeProxyKey = result.status_proxyKey
  storeConfig.configAutoRefresh = result.config_autoRefresh
  storeConfig.configContextMenus = result.config_contextMenus

  // init site rules
  storeConfig.configSiteRules = result.config_siteRules
  storeConfig.configSiteRulesAutoRefresh = result.config_siteRules_autoRefresh
  if (storeConfig.configSiteRules) {
    storeStatus.setTempRuleValid()
  }

  if (result.reject != null) {
    storeStatus.proxyConfigs.reject = result.reject
  }

  // init proxy config
  Object.keys(result).forEach((key) => {
    if (key.startsWith('proxy_')) {
      storeStatus.proxyConfigs[key] = result[key]
    }
  })

  Browser.Storage.changed(function (changes, areaName) {
    log.info('storage changed:', changes)
    if (areaName === 'local') {
      if (changes.status_proxyKey) {
        storeStatus.activeProxyKey = changes.status_proxyKey.newValue
      }
      if (changes.reject) {
        storeStatus.proxyConfigs.reject = changes.reject.newValue
      }
      Object.keys(changes).forEach((key) => {
        if (key.startsWith('proxy_')) {
          if (changes[key].newValue) {
            storeStatus.proxyConfigs[key] = changes[key].newValue
          } else {
            delete storeStatus.proxyConfigs[key]
          }
        }
      })
    }
  })
})

function handleDelete() {
  confirmModal.createConfirm(
    Browser.I18n.getMessage('modal_title_delete') + route.params.name,
    Browser.I18n.getMessage('modal_desc_delete'),
    async () => {
      const result = await Browser.Storage.getLocalAll()
      const name = route.params.name
      const proxyNameList = proxyUsedBy(encodeURIComponent(name), result)
      if (proxyNameList.length > 0) {
        toast.warning(
          `（${name}）${Browser.I18n.getMessage('desc_undeleted_info')}${decodeURIComponent(proxyNameList.join(', '))}`
        )
        return
      }
      const proxyKey = 'proxy_' + encodeURIComponent(name)
      await Browser.Storage.removeLocal(proxyKey)

      const version = await getNextLocalVersion()
      await Browser.Storage.setLocal({
        config_version: version
      })
      toast.info(`${name}${Browser.I18n.getMessage('desc_deleted_success')}`)
      if (result.status_proxyKey == proxyKey) {
        Browser.Proxy.setDirect(async () => {
          await Browser.Storage.setLocal({ status_proxyKey: 'direct' })
          toast.info(Browser.I18n.getMessage('desc_set_proxy_direct'))
        })
      }
      showUploadConflictModal(() => {
        router.push('/home')
      })
      storeStatus.resetUnsaved()
    }
  )
}

function handleUpdate() {
  if (storeStatus.isUnsaved) {
    toast.warning(Browser.I18n.getMessage('desc_unsave_toast'))
    return
  }
  if (basicConfigModal.value) {
    bCMOperationType.value = 'updateName'
    basicConfigModal.value.show()
  }
}

function handleCopy() {
  if (storeStatus.isUnsaved) {
    toast.warning(Browser.I18n.getMessage('desc_unsave_toast'))
    return
  }
  if (basicConfigModal.value) {
    bCMOperationType.value = 'copyConfig'
    basicConfigModal.value.show()
  }
}

function handleNewConfig(configMode) {
  if (storeStatus.isUnsaved) {
    toast.warning(Browser.I18n.getMessage('desc_unsave_toast'))
    return
  }
  if (basicConfigModal.value) {
    bCMConfigMode.value = configMode
    bCMOperationType.value = 'newConfig'
    basicConfigModal.value.show()
  }
}

function showUploadConflictModal(cbAfterHide = () => {}) {
  if (uploadConflictModal.value)
    uploadConflictModal.value.createModal(cbAfterHide)
}

function showSyncConflictModal(desc) {
  if (syncConflictModal.value) syncConflictModal.value.createModal(desc)
}

function toGithub() {
  window.open('https://github.com/oasis-proxy/oasis-proxy', '_blank')
}

provide('handleNewConfig', handleNewConfig)
provide('handleUpdate', handleUpdate)
provide('handleCopy', handleCopy)
provide('handleDelete', handleDelete)
provide('showUploadConflictModal', showUploadConflictModal)
provide('showSyncConflictModal', showSyncConflictModal)
</script>

<template>
  <div
    class="container-xxl shadow card p-4 border-light w-100 h-100 px-4"
    style="min-height: 720px"
  >
    <div class="row gy-4 w-100 h-100 gx-5">
      <div class="col-3 sidebar" id="sidebar">
        <AsideView></AsideView>
      </div>
      <div class="col-9" id="content">
        <RouterView />
      </div>
    </div>
  </div>
  <div class="opacity-25 d-flex justify-content-center mt-2">
    <span style="user-select: none">{{
      Browser.I18n.getMessage('ext_name') +
      ', Version: ' +
      Browser.Runtime.getManifest().version
    }}</span>
    <i class="bi bi-github ms-2 cursor-point" @click="toGithub()"></i>
  </div>
  <BasicConfigModal
    ref="basicConfigModal"
    :operation-type="bCMOperationType"
    :config-mode="bCMConfigMode"
  />
  <UploadConflictModal ref="uploadConflictModal" />
  <SyncConflictModal ref="syncConflictModal" />
</template>
