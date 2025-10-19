<script setup>
import { getCurrentInstance, inject, ref, onMounted, watch } from 'vue'
import ServerInfoItem from '../components/ServerInfoItem.vue'

import Browser from '@/Browser/main'
import { useStatusStore } from '@/options/stores/status'
import { saveForFixed, proxyUses } from '@/core/proxy_config.js'
import { getNextLocalVersion } from '@/core/version_control.js'
import { log } from '@/core/utils.js'

const props = defineProps(['name'])

const handleUpdate = inject('handleUpdate')
const handleCopy = inject('handleCopy')
const handleDelete = inject('handleDelete')
const showUploadConflictModal = inject('showUploadConflictModal')

const storeStatus = useStatusStore()
const instance = getCurrentInstance()
const confirmModal = instance?.appContext.config.globalProperties.$confirm
const toast = instance?.appContext.config.globalProperties.$toast

const tagColor = ref('#3498db')
const fallbackProxy = ref({
  scheme: 'direct',
  host: '',
  port: null,
  username: '',
  password: ''
})
const proxyForHttp = ref({
  scheme: 'default',
  host: '',
  port: null,
  username: '',
  password: ''
})
const proxyForHttps = ref({
  scheme: 'default',
  host: '',
  port: null,
  username: '',
  password: ''
})
const proxyForFtp = ref({
  scheme: 'default',
  host: '',
  port: null,
  username: '',
  password: ''
})
const bypassList = ref('')
const defaultTabInstance = ref(null)
onMounted(() => {
  load('proxy_' + encodeURIComponent(props.name))
  const defaultTab = document.getElementById('v-pills-default-tab')
  defaultTabInstance.value = new bootstrap.Tab(defaultTab)
})

watch(
  () => props.name,
  (newValue) => {
    load('proxy_' + encodeURIComponent(newValue))
    defaultTabInstance.value.show()
  }
)
async function load(proxyKey) {
  resetData()
  const result = await Browser.Storage.getLocal([proxyKey])

  tagColor.value = result[proxyKey].tagColor
  if (result[proxyKey]?.config.rules.fallbackProxy != null) {
    fallbackProxy.value = JSON.parse(
      JSON.stringify(result[proxyKey]?.config.rules.fallbackProxy)
    )
  }
  if (result[proxyKey]?.config.rules.proxyForHttp != null) {
    proxyForHttp.value = JSON.parse(
      JSON.stringify(result[proxyKey]?.config.rules.proxyForHttp)
    )
  }
  if (result[proxyKey]?.config.rules.proxyForHttps != null) {
    proxyForHttps.value = JSON.parse(
      JSON.stringify(result[proxyKey]?.config.rules.proxyForHttps)
    )
  }
  if (result[proxyKey]?.config.rules.proxyForFtp != null) {
    proxyForFtp.value = JSON.parse(
      JSON.stringify(result[proxyKey]?.config.rules.proxyForFtp)
    )
  }
  if (result[proxyKey]?.config.rules.bypassList != null) {
    bypassList.value = result[proxyKey]?.config.rules.bypassList.join('\n')
  }
}

function resetData() {
  tagColor.value = '#3498db'
  fallbackProxy.value = {
    scheme: 'direct',
    host: '',
    port: null,
    username: '',
    password: ''
  }
  proxyForHttp.value = {
    scheme: 'default',
    host: '',
    port: null,
    username: '',
    password: ''
  }
  proxyForHttps.value = {
    scheme: 'default',
    host: '',
    port: null,
    username: '',
    password: ''
  }
  proxyForFtp.value = {
    scheme: 'default',
    host: '',
    port: null,
    username: '',
    password: ''
  }
  bypassList.value = ''
}

async function handleSubmit() {
  const encodeName = encodeURIComponent(props.name)
  const key = 'proxy_' + encodeName
  const tmpObj = saveForFixed(
    encodeName,
    tagColor.value,
    fallbackProxy.value,
    proxyForHttp.value,
    proxyForHttps.value,
    proxyForFtp.value,
    bypassList.value
  )

  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    [key]: tmpObj,
    config_version: version,
    config_syncTime: new Date().getTime()
  })

  toast.info(`${props.name} ${Browser.I18n.getMessage('desc_save_success')}`)
  storeStatus.resetUnsaved()
  log.debug(storeStatus.activeProxyKey)
  if (storeStatus.activeProxyKey == key) {
    await Browser.Proxy.reloadOrDirect(() => {
      toast.info(Browser.I18n.getMessage('desc_proxy_update'))
    })
  } else {
    const result = await Browser.Storage.getLocalAll()
    const uniqNames = proxyUses(result[storeStatus.activeProxyKey])
    if (uniqNames.includes(encodeName)) {
      await Browser.Proxy.reloadOrDirect(async () => {
        toast.info(Browser.I18n.getMessage('desc_proxy_update'))
      })
    }
  }
  showUploadConflictModal()
}

function handleCancel() {
  confirmModal.createConfirm(
    Browser.I18n.getMessage('modal_title_warning'),
    Browser.I18n.getMessage('modal_desc_reset'),
    function () {
      load('proxy_' + encodeURIComponent(props.name))
      storeStatus.resetUnsaved()
    }
  )
}
</script>
<template>
  <div id="profile_fixed">
    <div class="hstack gap-3 pb-4 mb-3">
      <div>
        <i
          class="bi bi-bookmark-fill cursor-point fs-4"
          :style="'color: ' + tagColor"
          @click="$refs.colorPicker.click()"
        ></i>
        <input ref="colorPicker" type="color" v-model="tagColor" />
      </div>
      <div class="fs-5 fw-bold text-truncate">
        {{ Browser.I18n.getMessage('page_title_fixed') + props.name }}
      </div>
      <button
        class="btn btn-sm btn-outline-danger ms-auto"
        @click="handleDelete"
      >
        <i class="bi bi-backspace-reverse me-2"></i>
        <span>{{ Browser.I18n.getMessage('btn_label_delete_config') }}</span>
      </button>
      <button
        class="dropdown-toggle btn btn-outline-secondary btn-sm"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        data-bs-offset="0,5"
      >
        <span class="ms-2">{{
          Browser.I18n.getMessage('btn_label_more')
        }}</span>
        <i class="bi bi-caret-down-fill ms-2"></i>
      </button>
      <ul class="dropdown-menu dropdown-menu-end dropdown-menu-sm">
        <li @click="handleUpdate">
          <div class="hstack gap-2 dropdown-item cursor-point">
            <i class="bi bi-pencil-square"></i>
            <span>{{
              Browser.I18n.getMessage('btn_label_update_name_config')
            }}</span>
          </div>
        </li>
        <li @click="handleCopy('server')">
          <div class="hstack gap-2 dropdown-item cursor-point">
            <i class="bi bi-copy"></i>
            <span>{{
              Browser.I18n.getMessage('btn_label_copy_new_config')
            }}</span>
          </div>
        </li>
      </ul>
    </div>
    <div>
      <div>
        <div class="nav nav-tabs mb-2" id="v-pills-tab" role="tablist">
          <button
            class="nav-link active"
            id="v-pills-default-tab"
            s
            data-bs-toggle="pill"
            data-bs-target="#v-pills-default"
            role="tab"
            aria-controls="v-pills-default"
            aria-selected="true"
          >
            <span>{{ Browser.I18n.getMessage('tab_label_default') }}</span>
          </button>
          <button
            class="nav-link"
            id="v-pills-advance-tab"
            data-bs-toggle="pill"
            data-bs-target="#v-pills-advance"
            role="tab"
            aria-controls="v-pills-advance"
            aria-selected="false"
          >
            <span>{{ Browser.I18n.getMessage('tab_label_advance') }}</span>
          </button>
        </div>
        <div class="tab-content mb-3" id="v-pills-tabContent">
          <div class="tab-pane fade show active" id="v-pills-default">
            <ServerInfoItem
              :groupLabel="
                Browser.I18n.getMessage('section_label_default_proxy')
              "
              :main="true"
              v-model:proxyInfo="fallbackProxy"
            ></ServerInfoItem>
            <div class="card">
              <div class="card-header">
                <span class="fw-bold">{{
                  Browser.I18n.getMessage('section_label_bypasslist')
                }}</span>
              </div>
              <div class="card-body">
                <textarea
                  class="form-control form-control-sm"
                  v-model="bypassList"
                  rows="10"
                ></textarea>
              </div>
            </div>
          </div>
          <div
            class="tab-pane fade"
            id="v-pills-advance"
            role="tabpanel"
            aria-labelledby="v-pills-advance-tab"
          >
            <ServerInfoItem
              :groupLabel="Browser.I18n.getMessage('section_label_http')"
              v-model:proxyInfo="proxyForHttp"
            ></ServerInfoItem>
            <ServerInfoItem
              :groupLabel="Browser.I18n.getMessage('section_label_https')"
              v-model:proxyInfo="proxyForHttps"
            ></ServerInfoItem>
            <ServerInfoItem
              :groupLabel="Browser.I18n.getMessage('section_label_ftp')"
              v-model:proxyInfo="proxyForFtp"
            ></ServerInfoItem>
          </div>
        </div>
      </div>
      <div class="hstack gap-3">
        <button
          class="btn btn-outline-secondary btn-sm ms-auto"
          @click="handleCancel"
          :disabled="!storeStatus.isUnsaved"
        >
          <i class="bi bi-reply-fill me-2"></i>
          <span>{{ Browser.I18n.getMessage('btn_label_reset') }}</span>
        </button>
        <button
          class="btn btn-primary btn-sm"
          @click="handleSubmit"
          :disabled="!storeStatus.isUnsaved"
        >
          <i class="bi bi-floppy-fill me-2"></i>
          <span>{{ Browser.I18n.getMessage('btn_label_save') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
