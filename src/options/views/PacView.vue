<script setup>
import { ref, inject, getCurrentInstance, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LinkTextItem from '../components/LinkTextItem.vue'

import Browser from '@/Browser/chrome/chrome.js'
import { saveForPac } from '@/core/ProxyConfig'

const { isUnsaved, resetUnsaved } = inject('isUnsaved')
const handleUpdate = inject('handleUpdate')
const handleDelete = inject('handleDelete')

const pacRule = ref({
  url: '',
  urlUpdatedAt: '',
  data: ''
})

const route = useRoute()
const instance = getCurrentInstance()
const confirmModal = instance?.appContext.config.globalProperties.$confirm
const toast = instance?.appContext.config.globalProperties.$toast

onMounted(() => {
  load('proxy_' + encodeURIComponent(route.params.name))
})

watch(
  () => route.params.name,
  (newValue) => {
    load('proxy_' + encodeURIComponent(newValue))
  }
)
async function load(proxyKey) {
  resetData()
  const result = await Browser.Storage.getLocal([proxyKey])
  pacRule.value.url = result[proxyKey].config.rules.url
  pacRule.value.data = result[proxyKey].config.rules.data
  pacRule.value.urlUpdatedAt = result[proxyKey].config.rules.urlUpdatedAt
}

function resetData() {
  pacRule.value = {
    url: '',
    urlUpdatedAt: '',
    data: ''
  }
}

async function handleSubmit() {
  const name = route.params.name
  const encodeName = encodeURIComponent(name)
  const key = 'proxy_' + encodeName
  const tmpObj = saveForPac(
    encodeName,
    pacRule.value.data.trim(),
    pacRule.value.url.trim(),
    pacRule.value.urlUpdatedAt
  )
  const storeObj = {}
  storeObj[key] = tmpObj
  await Browser.Storage.setLocal(storeObj)
  toast.info(`${name} ${Browser.I18n.getMessage('desc_save_success')}`)
  const result = await Browser.Storage.getLocalAll()
  if (result.status_proxyKey == key) {
    Browser.Proxy.set(result, key, async () => {
      await Browser.Storage.setLocal({ status_proxyKey: key })
      toast.info(Browser.I18n.getMessage('desc_proxy_update'))
    })
  }
  resetUnsaved()
}

function handleCancel() {
  confirmModal.createConfirm(
    Browser.I18n.getMessage('modal_title_warning'),
    Browser.I18n.getMessage('modal_desc_reset'),
    function () {
      load('proxy_' + route.params.name)
      resetUnsaved()
    }
  )
}
</script>
<template>
  <div id="profile_pac">
    <div class="hstack gap-3 pb-4 mb-3">
      <div class="fs-5 fw-bold text-truncate" id="title">
        {{ Browser.I18n.getMessage('page_title_pac') + route.params.name }}
      </div>
      <button
        class="btn btn-sm btn-outline-danger ms-auto"
        @click="handleDelete"
      >
        <i class="bi bi-backspace-reverse me-2"></i>
        <span>{{ Browser.I18n.getMessage('btn_label_delete_config') }}</span>
      </button>
      <button class="btn btn-sm btn-outline-secondary" @click="handleUpdate">
        <i class="bi bi-pencil-square me-2"></i>
        <span>{{
          Browser.I18n.getMessage('btn_label_update_name_config')
        }}</span>
      </button>
    </div>
    <div class="">
      <LinkTextItem
        :urlTitle="Browser.I18n.getMessage('form_label_pac_url')"
        :urlUpdatedAtTitle="Browser.I18n.getMessage('form_label_update_date')"
        :dataTitle="Browser.I18n.getMessage('form_label_pac_script')"
        v-model:externalItem="pacRule"
      ></LinkTextItem>
      <div class="hstack gap-3">
        <button
          class="btn btn-outline-secondary btn-sm ms-auto"
          @click="handleCancel"
          :disabled="!isUnsaved"
        >
          <i class="bi bi-reply-fill me-2"></i>
          <span>{{ Browser.I18n.getMessage('btn_label_reset') }}</span>
        </button>
        <button
          class="btn btn-primary btn-sm"
          @click="handleSubmit"
          :disabled="!isUnsaved"
        >
          <i class="bi bi-floppy-fill me-2"></i>
          <span>{{ Browser.I18n.getMessage('btn_label_save') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
