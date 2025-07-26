<script setup>
import { ref, inject, getCurrentInstance, onMounted, watch, provide } from 'vue'

import PopoverTips from '@/components/PopoverTips.vue'
import AutoRejectGroup from './AutoRejectGroup.vue'
import AutoRulesGroup from './AutoRulesGroup.vue'
import MergeAutoRulesModal from './MergeAutoRulesModal.vue'

import Browser from '@/Browser/main'
import { useStatusStore } from '@/options/stores/status'
import { useConfigStore } from '@/options/stores/config'
import { saveForAuto } from '@/core/proxy_config.js'
import { generatePacfile } from '@/core/pacfile_generator.js'
import { getNextLocalVersion } from '@/core/version_control.js'
import { formatCode } from '@/core/utils'
import AutoSiteRulesGroup from './AutoSiteRulesGroup.vue'

const props = defineProps(['name'])

const handleUpdate = inject('handleUpdate')
const handleCopy = inject('handleCopy')
const handleDelete = inject('handleDelete')
const showUploadConflictModal = inject('showUploadConflictModal')

const storeStatus = useStatusStore()
const storeConfig = useConfigStore()

const instance = getCurrentInstance()
const confirmModal = instance?.appContext.config.globalProperties.$confirm
const toast = instance?.appContext.config.globalProperties.$toast

const mergeAutoRulesModal = ref(null)

const tagColor = ref('#3498db')
const localRuleList = ref([])
const rejectRuleList = ref([])
const siteRuleList = ref([])
const defaultProxy = ref('direct')
const localRulesSet = ref({
  format: 'base64',
  url: '',
  urlUpdatedAt: '',
  updateInterval: 'default',
  data: '',
  proxy: 'direct',
  valid: true
})
const rejectRulesSet = ref({
  format: 'base64',
  url: '',
  urlUpdatedAt: '',
  updateInterval: 'default',
  data: '',
  valid: true
})
const siteRulesSet = ref({
  format: 'base64',
  url: '',
  urlUpdatedAt: '',
  updateInterval: 'default',
  data: '',
  proxy: 'direct',
  valid: true
})

provide('autoConfig', {
  localRuleList,
  localRulesSet,
  rejectRuleList,
  rejectRulesSet,
  siteRuleList,
  siteRulesSet,
  defaultProxy
})

const siteRuleChanged = ref(false)
provide('status', {
  siteRuleChanged
})

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
  const result = await Browser.Storage.getLocalAll()

  tagColor.value = result[proxyKey].tagColor
  defaultProxy.value = result[proxyKey].config.rules.defaultProxy

  localRulesSet.value.url = result[proxyKey].config.rules.local.rulesSet.url
  localRulesSet.value.urlUpdatedAt =
    result[proxyKey].config.rules.local.rulesSet.urlUpdatedAt
  localRulesSet.value.updateInterval =
    result[proxyKey].config.rules.local.rulesSet.updateInterval
  localRulesSet.value.data = result[proxyKey].config.rules.local.rulesSet.data
  localRulesSet.value.proxy = result[proxyKey].config.rules.local.rulesSet.proxy
  localRulesSet.value.valid = result[proxyKey].config.rules.local.rulesSet.valid
  if (localRulesSet.value.valid == null) {
    localRulesSet.value.valid = true
  }
  localRulesSet.value.format =
    result[proxyKey].config.rules.local.rulesSet.format

  rejectRulesSet.value.url = result[proxyKey].config.rules.reject.rulesSet.url
  rejectRulesSet.value.urlUpdatedAt =
    result[proxyKey].config.rules.reject.rulesSet.urlUpdatedAt
  rejectRulesSet.value.updateInterval =
    result[proxyKey].config.rules.reject.rulesSet.updateInterval
  rejectRulesSet.value.data = result[proxyKey].config.rules.reject.rulesSet.data
  rejectRulesSet.value.valid =
    result[proxyKey].config.rules.reject.rulesSet.valid
  if (rejectRulesSet.value.valid == null) {
    rejectRulesSet.value.valid = true
  }
  rejectRulesSet.value.format =
    result[proxyKey].config.rules.reject.rulesSet.format

  siteRulesSet.value.url = result[proxyKey].config.rules.site.rulesSet.url
  siteRulesSet.value.urlUpdatedAt =
    result[proxyKey].config.rules.site.rulesSet.urlUpdatedAt
  siteRulesSet.value.updateInterval =
    result[proxyKey].config.rules.site.rulesSet.updateInterval
  siteRulesSet.value.data = result[proxyKey].config.rules.site.rulesSet.data
  siteRulesSet.value.proxy = result[proxyKey].config.rules.site.rulesSet.proxy
  siteRulesSet.value.valid = result[proxyKey].config.rules.site.rulesSet.valid
  if (siteRulesSet.value.valid == null) {
    siteRulesSet.value.valid = true
  }
  siteRulesSet.value.format = result[proxyKey].config.rules.site.rulesSet.format

  const tmpRuleList = JSON.parse(
    JSON.stringify(result[proxyKey].config.rules.local.ruleList)
  )
  localRuleList.value = tmpRuleList

  const tmpRejectRuleList = JSON.parse(
    JSON.stringify(result[proxyKey].config.rules.reject.ruleList)
  )
  rejectRuleList.value = tmpRejectRuleList

  const tmpSiteRuleList = JSON.parse(
    JSON.stringify(result[proxyKey].config.rules.site.ruleList)
  )
  siteRuleList.value = tmpSiteRuleList
}

async function handleExportPAC() {
  const res = await Browser.Storage.getLocalAll()
  const codeBlock = await generatePacfile(
    res,
    'proxy_' + encodeURIComponent(props.name)
  )
  await Browser.saveFile(codeBlock, `${props.name}.pac`)
}

async function openMergeRulesDialog() {
  if (mergeAutoRulesModal.value) {
    mergeAutoRulesModal.value.show()
  }
}

function resetData() {
  tagColor.value = '#3498db'
  localRuleList.value = []
  rejectRuleList.value = []
  defaultProxy.value = 'direct'
  localRulesSet.value = {
    format: 'base64',
    url: '',
    urlUpdatedAt: '',
    updateInterval: 'default',
    data: '',
    proxy: 'direct',
    valid: true
  }
  rejectRulesSet.value = {
    format: 'base64',
    url: '',
    urlUpdatedAt: '',
    updateInterval: 'default',
    data: '',
    valid: true
  }
  siteRulesSet.value = {
    format: 'base64',
    url: '',
    urlUpdatedAt: '',
    updateInterval: 'default',
    data: '',
    proxy: 'direct',
    valid: true
  }
}

async function handleSubmit() {
  const encodeName = encodeURIComponent(props.name)
  const key = 'proxy_' + encodeName
  const tmpObj = saveForAuto(
    encodeName,
    tagColor.value,
    defaultProxy.value,
    localRuleList.value,
    rejectRuleList.value,
    siteRuleList.value,
    localRulesSet.value,
    rejectRulesSet.value,
    siteRulesSet.value
  )
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    [key]: tmpObj,
    config_version: version,
    config_syncTime: new Date().getTime()
  })
  toast.info(`${props.name} ${Browser.I18n.getMessage('desc_save_success')}`)
  storeStatus.resetUnsaved()
  if (storeStatus.activeProxyKey == key) {
    await Browser.Proxy.reloadOrDirect(async () => {
      toast.info(Browser.I18n.getMessage('desc_proxy_update'))
    }, siteRuleChanged)
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
  <div id="profileAuto">
    <div class="hstack gap-3 pb-4 mb-3">
      <div>
        <i
          class="bi bi-bookmark-fill cursor-point fs-4"
          :style="'color: ' + tagColor"
          @click="$refs.colorPicker.click()"
        ></i>
        <input ref="colorPicker" type="color" v-model="tagColor" />
      </div>
      <div class="fs-5 fw-bold text-truncate" id="title">
        {{ Browser.I18n.getMessage('page_title_auto') + props.name }}
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
        <li @click="handleCopy('policy')">
          <div class="hstack gap-2 dropdown-item cursor-point">
            <i class="bi bi-copy"></i>
            <span>{{
              Browser.I18n.getMessage('btn_label_copy_new_config')
            }}</span>
          </div>
        </li>
        <li @click="handleExportPAC">
          <div class="hstack gap-2 dropdown-item cursor-point">
            <i class="bi bi-file-earmark-ppt-fill"></i>
            <span>{{ Browser.I18n.getMessage('btn_label_export_pac') }}</span>
          </div>
        </li>
      </ul>
    </div>
    <div>
      <div class="nav nav-tabs mb-2" id="v-pills-tab" role="tablist">
        <button
          class="nav-link active"
          id="v-pills-default-tab"
          data-bs-toggle="pill"
          data-bs-target="#v-pills-default"
          role="tab"
          aria-controls="v-pills-default"
          aria-selected="true"
        >
          {{ Browser.I18n.getMessage('tab_label_default') }}
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
          {{ Browser.I18n.getMessage('tab_label_advance') }}
        </button>
        <button
          v-if="storeConfig.configSiteRules"
          class="nav-link"
          id="v-pills-site-tab"
          data-bs-toggle="pill"
          data-bs-target="#v-pills-site"
          role="tab"
          aria-controls="v-pills-site"
          aria-selected="false"
        >
          <i class="fa-solid fa-flask me-1"></i>
          {{ Browser.I18n.getMessage('tab_label_site') }}
        </button>
        <div class="ms-auto d-flex align-items-center">
          <i
            class="fa-solid fa-code-merge icon-btn me-2"
            @click="openMergeRulesDialog"
          ></i>
          <PopoverTips
            className="bi bi-question-circle-fill icon-btn"
            :content="Browser.I18n.getMessage('popover_priority')"
          ></PopoverTips>
        </div>
      </div>
      <div class="tab-content" id="v-pills-tabContent">
        <div class="tab-pane fade show active" id="v-pills-default">
          <AutoRulesGroup @load="load"></AutoRulesGroup>
        </div>
        <div class="tab-pane fade" id="v-pills-advance">
          <AutoRejectGroup @load="load"></AutoRejectGroup>
        </div>
        <div
          class="tab-pane fade"
          id="v-pills-site"
          v-if="storeConfig.configSiteRules"
        >
          <AutoSiteRulesGroup @load="load"></AutoSiteRulesGroup>
        </div>
      </div>
    </div>
    <div>
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
    <MergeAutoRulesModal ref="mergeAutoRulesModal"></MergeAutoRulesModal>
  </div>
</template>
