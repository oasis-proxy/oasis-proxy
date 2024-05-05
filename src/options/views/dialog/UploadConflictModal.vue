<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue'
import ModalBase from '@/components/modal/ModalBase.vue'
import ConfigDisplay from '../../components/ConfigDisplay.vue'

import Browser from '@/Browser/main'
import { overWriteToCloud, getSyncUploadStatus } from '@/core/VersionControl'

defineExpose({ createModal })

const configDisplay = ref(null)

let modalInstance = null
let cbAfterHide = function () {}

onMounted(() => {
  const modalElement = document.getElementById('uploadConflictModal')
  // eslint-disable-next-line no-undef
  modalInstance = new bootstrap.Modal(modalElement)
})

function hide() {
  modalInstance.hide()
  cbAfterHide()
}
async function show() {
  configDisplay.value.reload()
  modalInstance.show()
  await Browser.Storage.setLocal({ config_autoSync: false })
}

async function createModal(afterHide) {
  cbAfterHide = afterHide
  const result = await Browser.Storage.getLocal(['config_autoSync'])
  if (!result.config_autoSync) {
    hide()
    return
  }
  switch (await getSyncUploadStatus()) {
    case 'upload':
      handleSubmit()
      break
    case 'conflict':
      show()
      break
    default:
  }
}

async function handleSubmit() {
  overWriteToCloud()
  await Browser.Storage.setLocal({ config_autoSync: true })
  hide()
}

async function handleCancel() {
  hide()
}
</script>
<template>
  <ModalBase id="uploadConflictModal" mode="large">
    <template #title>{{
      Browser.I18n.getMessage('modal_title_sync')
    }}</template>
    <template #default>
      <div class="mb-3 row">
        <span>{{ Browser.I18n.getMessage('modal_desc_upload_conflict') }}</span>
      </div>
      <div class="mb-3 row">
        <ConfigDisplay ref="configDisplay" :isModal="true"></ConfigDisplay>
      </div>
      <div class="mb-3 row">
        <span class="text-warning">{{
          Browser.I18n.getMessage('desc_sync_warning')
        }}</span>
      </div>
    </template>
    <template #operations>
      <button class="btn btn-sm btn-secondary ms-auto" @click="handleCancel">
        <i class="bi bi-x-circle-fill me-2"></i>
        <span>{{ Browser.I18n.getMessage('btn_label_cancel') }}</span>
      </button>
      <button class="btn btn-sm btn-danger" @click="handleSubmit">
        <i class="bi bi-check-circle-fill me-2"></i>
        <span>{{ Browser.I18n.getMessage('btn_label_set_sync_config') }}</span>
      </button>
    </template>
  </ModalBase>
</template>
