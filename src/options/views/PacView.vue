<script setup>
import { ref, inject, getCurrentInstance, onMounted, watch } from 'vue'
import LinkTextItem from '../components/LinkTextItem.vue'

import Browser from '@/Browser/main'
import { saveForPac } from '@/core/proxy_config.js'
import { getNextLocalVersion } from '@/core/version_control.js'
import { useStatusStore } from '@/options/stores/status'
import { updatePacData } from '@/core/proxy_config.js'

const props = defineProps(['name'])

const handleUpdate = inject('handleUpdate')
const handleCopy = inject('handleCopy')
const handleDelete = inject('handleDelete')
const showUploadConflictModal = inject('showUploadConflictModal')

const tagColor = ref('#3498db')
const urlValid = ref(true)
const pacRule = ref({
  url: '',
  urlUpdatedAt: '',
  updateInterval: 'default',
  data: ''
})

const storeStatus = useStatusStore()
const instance = getCurrentInstance()
const confirmModal = instance?.appContext.config.globalProperties.$confirm
const toast = instance?.appContext.config.globalProperties.$toast

onMounted(() => {
  load('proxy_' + encodeURIComponent(props.name))
})

watch(
  () => props.name,
  (newValue) => {
    load('proxy_' + encodeURIComponent(newValue))
  }
)
async function load(proxyKey) {
  resetData()
  const result = await Browser.Storage.getLocal([proxyKey])

  tagColor.value = result[proxyKey].tagColor
  pacRule.value.url = result[proxyKey].config.rules.url
  pacRule.value.data = result[proxyKey].config.rules.data
  pacRule.value.urlUpdatedAt = result[proxyKey].config.rules.urlUpdatedAt
  pacRule.value.updateInterval = result[proxyKey].config.rules.updateInterval
}

function resetData() {
  tagColor.value = '#3498db'
  pacRule.value = {
    url: '',
    urlUpdatedAt: '',
    updateInterval: 'default',
    data: ''
  }
}

async function handleUpdateUrl() {
  const key = 'proxy_' + encodeURIComponent(props.name)
  const allConfig = await Browser.Storage.getLocalAll()
  const updateProxyConfig = await updatePacData(allConfig[key], {
    interval: 0
  })
  if (JSON.stringify(updateProxyConfig) != '{}') {
    await Browser.Storage.setLocal({ [key]: updateProxyConfig })
    if (storeStatus.activeProxyKey == key) {
      await Browser.Proxy.reloadOrDirect(() => {
        toast.info(Browser.I18n.getMessage('desc_proxy_update'))
      })
    }
    load('proxy_' + encodeURIComponent(props.name))
  } else {
    urlValid.value = false
  }
}

async function handleSubmit() {
  const encodeName = encodeURIComponent(props.name)
  const key = 'proxy_' + encodeName
  const tmpObj = saveForPac(
    encodeName,
    tagColor.value,
    pacRule.value.data.trim(),
    pacRule.value.url.trim(),
    pacRule.value.urlUpdatedAt,
    pacRule.value.updateInterval
  )
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    [key]: tmpObj,
    config_version: version,
    config_syncTime: new Date().getTime()
  })
  toast.info(`${props.name} ${Browser.I18n.getMessage('desc_save_success')}`)
  if (storeStatus.activeProxyKey == key) {
    await Browser.Proxy.reloadOrDirect(async () => {
      toast.info(Browser.I18n.getMessage('desc_proxy_update'))
    })
  }
  storeStatus.resetUnsaved()
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
  <div id="profile_pac">
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
        {{ Browser.I18n.getMessage('page_title_pac') + props.name }}
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
      </ul>
    </div>
    <div class="">
      <LinkTextItem
        :urlTitle="Browser.I18n.getMessage('form_label_pac_url')"
        :urlUpdatedAtTitle="Browser.I18n.getMessage('form_label_rule_update')"
        :dataTitle="Browser.I18n.getMessage('form_label_pac_script')"
        @updateRulesSetData="handleUpdateUrl"
        v-model:rulesSet="pacRule"
        v-model:isUrlValid="urlValid"
      ></LinkTextItem>
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
