<script setup>
import Browser from '@/Browser/chrome/chrome.js'
import { provide, ref, inject, getCurrentInstance, onMounted } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import AsideView from './views/AsideView.vue'
import UpdateNameModal from './views/dialog/UpdateNameModal.vue'
import { proxyUsedBy } from '@/core/ProxyConfig.js'

const { isUnsaved, resetUnsaved } = inject('isUnsaved')

const route = useRoute()
const router = useRouter()
const updateNameModal = ref(null)

const instance = getCurrentInstance()
const toast = instance?.appContext.config.globalProperties.$toast
const confirmModal = instance?.appContext.config.globalProperties.$confirm

const localProxyConfigObj = ref({
  direct: { mode: 'direct', name: 'direct', config: { mode: 'direct' } },
  system: { mode: 'system', name: 'system', config: { mode: 'system' } },
  reject: {
    mode: 'reject',
    name: 'reject',
    config: { mode: 'reject', rules: 'HTTPS 127.0.0.1:65432' }
  }
})
const theme = ref('dark')
const activeProxyKey = ref('')

provide('proxyConfig', localProxyConfigObj)
provide('theme', theme)
provide('activeProxyKey', activeProxyKey)

onMounted(async () => {
  const result = await Browser.Storage.getLocalAll()
  Object.keys(result).forEach((key) => {
    if (key.startsWith('proxy_')) {
      localProxyConfigObj.value[key] = result[key]
    } else if (key.startsWith('config_')) {
      if (key == 'config_ui') {
        switch (result.config_ui) {
          case 'dark':
            theme.value = 'dark'
            break
          case 'system':
            if (
              window.matchMedia &&
              window.matchMedia('(prefers-color-scheme: dark)').matches
            ) {
              theme.value = 'dark'
            } else {
              theme.value = 'light'
            }
            break
          default:
            theme.value = 'light'
            break
        }
        document.body.setAttribute('data-bs-theme', theme.value)
      }
    } else if (key.startsWith('status_')) {
      if (key == 'status_proxyKey')
        activeProxyKey.value = result.status_proxyKey
    }
  })
  initApp()
})

function initApp() {
  Browser.Storage.changed(function (changes, areaName) {
    console.info('main.js changed:', changes)
    if (areaName === 'local') {
      Object.keys(changes).forEach((key) => {
        if (key.startsWith('proxy_')) {
          if (changes[key].newValue != null) {
            localProxyConfigObj.value[key] = changes[key].newValue
          } else {
            delete localProxyConfigObj.value[key]
          }
        } else if (key.startsWith('config_')) {
          if (key == 'config_ui') {
            switch (changes[key].newValue) {
              case 'dark':
                theme.value = 'dark'
                break
              case 'system':
                if (
                  window.matchMedia &&
                  window.matchMedia('(prefers-color-scheme: dark)').matches
                ) {
                  theme.value = 'dark'
                } else {
                  theme.value = 'light'
                }
                break
              default:
                theme.value = 'light'
                break
            }
            document.body.setAttribute('data-bs-theme', theme.value)
          }
        } else if (key.startsWith('status_')) {
          if (key == 'status_proxyKey') {
            activeProxyKey.value = changes.status_proxyKey.newValue
          }
        }
      })
    }
  })
}

function handleDelete() {
  confirmModal.createConfirm(
    Browser.I18n.getMessage('modal_title_delete') + route.params.name,
    Browser.I18n.getMessage('modal_desc_delete'),
    async () => {
      const result = await Browser.Storage.getLocalAll()
      const name = route.params.name
      // 检查是否被其他代理引用
      const proxyNameList = proxyUsedBy(encodeURIComponent(name), result)
      if (proxyNameList.length > 0) {
        toast.warning(
          `（${name}）${Browser.I18n.getMessage('desc_undeleted_info')}${proxyNameList.join(', ')}`
        )
        return
      }
      const proxyKey = 'proxy_' + encodeURIComponent(name)
      await Browser.Storage.removeLocal(proxyKey)
      toast.info(`${name}${Browser.I18n.getMessage('desc_deleted_success')}`)
      if (result.status_proxyKey == proxyKey) {
        Browser.Proxy.setDirect(async () => {
          await Browser.Storage.setLocal({ status_proxyKey: 'direct' })
          toast.info(`代理切换为直连`)
        })
      }
      router.push('/home')
    }
  )

  resetUnsaved()
}

function handleUpdate() {
  if (isUnsaved.value) {
    toast.warning(Browser.I18n.getMessage('desc_unsave_toast'))
    return
  }

  if (updateNameModal.value) updateNameModal.value.show()
}

provide('handleUpdate', handleUpdate)
provide('handleDelete', handleDelete)
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
  <UpdateNameModal ref="updateNameModal"></UpdateNameModal>
</template>
