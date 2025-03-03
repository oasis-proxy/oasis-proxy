<script setup>
import { ref, inject, getCurrentInstance, onMounted, watch, provide } from 'vue'
import { useRoute } from 'vue-router'
import PopoverTips from '@/components/PopoverTips.vue'
import AutoRejectGroup from './AutoRejectGroup.vue'
import AutoRulesGroup from './AutoRulesGroup.vue'
import MergeAutoRulesModal from './MergeAutoRulesModal.vue'

import Browser from '@/Browser/main'
import { useStatusStore } from '@/options/stores/status'
import { saveForAuto } from '@/core/proxy_config.js'
import { generatePacfile } from '@/core/pacfile_generator.js'
import { getNextLocalVersion } from '@/core/version_control.js'

const handleUpdate = inject('handleUpdate')
const handleCopy = inject('handleCopy')
const handleDelete = inject('handleDelete')
const showUploadConflictModal = inject('showUploadConflictModal')

const route = useRoute()
const storeStatus = useStatusStore()

const instance = getCurrentInstance()
const confirmModal = instance?.appContext.config.globalProperties.$confirm
const toast = instance?.appContext.config.globalProperties.$toast

const mergeAutoRulesModal = ref(null)

const localRuleList = ref([])
const rejectRuleList = ref([])
const defaultProxy = ref('direct')
const localRulesSet = ref({
  format: 'base64',
  url: '',
  urlUpdatedAt: '',
  data: '',
  proxy: 'direct',
  valid: true
})

const tagColor = ref('#3498db')
const rejectRulesSet = ref({
  format: 'base64',
  url: '',
  urlUpdatedAt: '',
  data: '',
  valid: true
})
const occurrences = ref([])
const occurrencesReject = ref([])

provide('autoConfig', {
  localRuleList,
  localRulesSet,
  rejectRuleList,
  rejectRulesSet,
  defaultProxy,
  occurrences,
  occurrencesReject
})

onMounted(() => {
  load('proxy_' + encodeURIComponent(route.params.name))
})

watch(
  () => route.params.name,
  (newValue) => {
    load('proxy_' + encodeURIComponent(newValue))
  }
)
watch(
  () => localRuleList,
  (newValue) => {
    const countOccurrences = (array) => {
      return array.reduce((accumulator, currentValue) => {
        accumulator[currentValue.data] =
          (accumulator[currentValue.data] || 0) + 1
        return accumulator
      }, {})
    }
    occurrences.value = countOccurrences(newValue.value)
  },
  { deep: true }
)

watch(
  () => rejectRuleList,
  (newValue) => {
    const countOccurrences = (array) => {
      return array.reduce((accumulator, currentValue) => {
        accumulator[currentValue.data] =
          (accumulator[currentValue.data] || 0) + 1
        return accumulator
      }, {})
    }
    occurrencesReject.value = countOccurrences(newValue.value)
  },
  { deep: true }
)

async function load(proxyKey) {
  resetData()
  const result = await Browser.Storage.getLocalAll()

  tagColor.value = result[proxyKey].tagColor
  defaultProxy.value = result[proxyKey].config.rules.defaultProxy

  localRulesSet.value.url = result[proxyKey].config.rules.local.rulesSet.url
  localRulesSet.value.urlUpdatedAt =
    result[proxyKey].config.rules.local.rulesSet.urlUpdatedAt
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
  rejectRulesSet.value.data = result[proxyKey].config.rules.reject.rulesSet.data
  rejectRulesSet.value.valid =
    result[proxyKey].config.rules.reject.rulesSet.valid
  if (rejectRulesSet.value.valid == null) {
    rejectRulesSet.value.valid = true
  }
  rejectRulesSet.value.format =
    result[proxyKey].config.rules.reject.rulesSet.format

  const tmpRuleList = JSON.parse(
    JSON.stringify(result[proxyKey].config.rules.local.ruleList)
  )
  for (const e of tmpRuleList) {
    if (e.valid == undefined) e.valid = true
    localRuleList.value.push(e)
  }

  const tmpRejectRuleList = JSON.parse(
    JSON.stringify(result[proxyKey].config.rules.reject.ruleList)
  )
  rejectRuleList.value = tmpRejectRuleList
}

async function handleExportPAC() {
  const res = await Browser.Storage.getLocalAll()
  const codeBlock = generatePacfile(
    res,
    'proxy_' + encodeURIComponent(route.params.name)
  )
  const outBlock = codeBlock.replace(/^\s*[\r?\n]/gm, '')
  Browser.saveFile(outBlock, `${route.params.name}.pac`)
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
    data: '',
    proxy: 'direct',
    valid: true
  }
  rejectRulesSet.value = {
    format: 'base64',
    url: '',
    urlUpdatedAt: '',
    data: '',
    valid: true
  }
}

async function handleSubmit() {
  const name = route.params.name
  const encodeName = encodeURIComponent(name)
  const key = 'proxy_' + encodeName
  const tmpObj = saveForAuto(
    encodeName,
    tagColor.value,
    defaultProxy.value,
    localRuleList.value,
    rejectRuleList.value,
    localRulesSet.value,
    rejectRulesSet.value
  )
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    [key]: tmpObj,
    config_version: version,
    config_syncTime: new Date().getTime()
  })
  toast.info(`${name} ${Browser.I18n.getMessage('desc_save_success')}`)
  storeStatus.resetUnsaved()
  const result = await Browser.Storage.getLocalAll()
  if (result.status_proxyKey == key) {
    Browser.Proxy.set(result, key, async () => {
      await Browser.Storage.setLocal({ status_proxyKey: key })
      Browser.Action.setBadgeBackgroundColor(result[key].tagColor)
      toast.info(Browser.I18n.getMessage('desc_proxy_update'))
    })
  }
  showUploadConflictModal()
}

function handleCancel() {
  confirmModal.createConfirm(
    Browser.I18n.getMessage('modal_title_warning'),
    Browser.I18n.getMessage('modal_desc_reset'),
    function () {
      load('proxy_' + encodeURIComponent(route.params.name))
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
        {{ Browser.I18n.getMessage('page_title_auto') + route.params.name }}
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
        <div class="ms-auto d-flex align-items-center">
          <i
            class="bi bi-cart-plus-fill icon-btn me-2"
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
        <div
          class="tab-pane fade"
          id="v-pills-advance"
          role="tabpanel"
          aria-labelledby="v-pills-advance-tab"
        >
          <AutoRejectGroup @load="load"></AutoRejectGroup>
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
