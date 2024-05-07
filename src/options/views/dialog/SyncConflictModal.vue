<script setup>
import { ref, onMounted, getCurrentInstance, watch } from 'vue'
import ModalBase from '@/components/modal/ModalBase.vue'
import ConfigDisplay from '../../components/ConfigDisplay.vue'
import { useConfigStore } from '@/options/stores/config'
import Browser from '@/Browser/main'

import { overWriteToLocal, overWriteToCloud } from '@/core/VersionControl'

defineExpose({ createModal })

const desc = ref('')
const configDisplay = ref(null)
let modalInstance = null

const storeConfig = useConfigStore()
const instance = getCurrentInstance()
const toast = instance?.appContext.config.globalProperties.$toast

onMounted(() => {
  const modalElement = document.getElementById('syncConflictModal')
  // eslint-disable-next-line no-undef
  modalInstance = new bootstrap.Modal(modalElement)
})

watch(
  () => storeConfig.configAutoSync,
  async (newValue) => {
    await Browser.Storage.setLocal({ config_autoSync: newValue })
  }
)

function hide() {
  modalInstance.hide()
}
async function createModal(description) {
  desc.value = description
  storeConfig.configAutoSync = false
  configDisplay.value.reload()
  modalInstance.show()
}

function handleCancel() {
  hide()
}
async function handleSetSync() {
  overWriteToCloud()
  storeConfig.configAutoSync = true
  hide()
  toast.info(Browser.I18n.getMessage('desc_override_sync'))
}
async function handleSetLocal() {
  overWriteToLocal()
  storeConfig.configAutoSync = true
  hide()
  toast.info(Browser.I18n.getMessage('desc_override_local'))
  setTimeout(() => {
    location.reload()
  }, 2000)
}
</script>
<template>
  <ModalBase id="syncConflictModal" mode="large">
    <template #title>{{
      Browser.I18n.getMessage('modal_title_sync')
    }}</template>
    <template #default>
      <div class="mb-3 row">
        <span>{{ desc }}</span>
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
      <button class="btn btn-sm btn-danger" @click="handleSetSync">
        <i class="bi bi-check-circle-fill me-2"></i>
        <span>{{ Browser.I18n.getMessage('btn_label_set_sync_config') }}</span>
      </button>
      <button class="btn btn-sm btn-danger" @click="handleSetLocal">
        <i class="bi bi-check-circle-fill me-2"></i>
        <span>{{ Browser.I18n.getMessage('btn_label_set_local_config') }}</span>
      </button>
    </template>
  </ModalBase>
</template>
