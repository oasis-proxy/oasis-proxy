<script setup>
import { ref, getCurrentInstance, onMounted } from 'vue'
import Browser from '@/Browser/main'
import { overWriteToCloud, overWriteToLocal } from '@/core/version_control.js'
defineProps({
  isModal: Boolean
})

defineExpose({ reload })

const instance = getCurrentInstance()
const toast = instance?.appContext.config.globalProperties.$toast
const confirmModal = instance?.appContext.config.globalProperties.$confirm

const localFixed = ref([])
const localPac = ref([])
const localAuto = ref([])
const localVersion = ref(0)
const localUpdateDate = ref('')

const syncFixed = ref([])
const syncPac = ref([])
const syncAuto = ref([])
const syncVersion = ref(0)
const syncUpdateDate = ref('')

onMounted(() => {
  reload()
})

function reload() {
  reloadLocalData()
  reloadSyncData()
}

async function reloadSyncData() {
  syncAuto.value = []
  syncPac.value = []
  syncFixed.value = []
  const result = await Browser.Storage.getSyncAll()
  Object.keys(result).forEach((key) => {
    if (key.startsWith('proxy_')) {
      switch (result[key]?.mode) {
        case 'auto':
          syncAuto.value.push(decodeURIComponent(key.substring(6)))
          break
        case 'pac_script':
          syncPac.value.push(decodeURIComponent(key.substring(6)))
          break
        case 'fixed_servers':
          syncFixed.value.push(decodeURIComponent(key.substring(6)))
          break
        default:
          break
      }
    }
  })
  if (result.config_version != null) syncVersion.value = result.config_version
  if (result.config_syncTime != null)
    syncUpdateDate.value = new Date(result.config_syncTime).toLocaleString()
}
async function reloadLocalData() {
  localAuto.value = []
  localPac.value = []
  localFixed.value = []
  const result = await Browser.Storage.getLocalAll()
  Object.keys(result).forEach((key) => {
    if (key.startsWith('proxy_')) {
      switch (result[key]?.mode) {
        case 'auto':
          localAuto.value.push(decodeURIComponent(key.substring(6)))
          break
        case 'pac_script':
          localPac.value.push(decodeURIComponent(key.substring(6)))
          break
        case 'fixed_servers':
          localFixed.value.push(decodeURIComponent(key.substring(6)))
          break
        default:
          break
      }
    }
  })
  if (result.config_version != null) localVersion.value = result.config_version
  if (result.config_syncTime != null)
    localUpdateDate.value = new Date(result.config_syncTime).toLocaleString()
}

function handleSetLocal() {
  confirmModal.createConfirm(
    Browser.I18n.getMessage('modal_title_warning'),
    Browser.I18n.getMessage('modal_desc_override_local'),
    () => {
      overWriteToLocal()
      toast.info(Browser.I18n.getMessage('desc_override_local'))
      setTimeout(() => {
        location.reload()
      }, 2000)
    }
  )
}

function handleSetSync() {
  confirmModal.createConfirm(
    Browser.I18n.getMessage('modal_title_warning'),
    Browser.I18n.getMessage('modal_desc_override_sync'),
    () => {
      overWriteToCloud()
      toast.info(Browser.I18n.getMessage('desc_override_sync'))
      reloadSyncData()
    }
  )
}
</script>
<template>
  <div class="hstack gap-4 d-flex align-items-stretch justify-content-between">
    <div class="card flex-grow-1" style="width: 1px">
      <div class="card-body border p-4 rounded">
        <p class="card-text fw-bold">
          {{ Browser.I18n.getMessage('section_label_local_data') }}
        </p>
        <p class="card-text">
          {{
            Browser.I18n.getMessage('page_title_version') +
            localVersion +
            (localUpdateDate == '' ? '' : `  (${localUpdateDate})`)
          }}
        </p>
        <p class="card-text" v-if="localFixed.length > 0">
          {{
            Browser.I18n.getMessage('page_title_fixed') + localFixed.join(', ')
          }}
        </p>
        <p class="card-text" v-if="localPac.length > 0">
          {{ Browser.I18n.getMessage('page_title_pac') + localPac.join(', ') }}
        </p>
        <p class="card-text" v-if="localAuto.length > 0">
          {{
            Browser.I18n.getMessage('page_title_auto') + localAuto.join(', ')
          }}
        </p>
      </div>
    </div>
    <div class="align-self-center flex-grow-0 flex-shrink-0" v-if="!isModal">
      <div class="vstack gap-4">
        <div>
          <button class="btn btn-danger btn-sm" @click="handleSetLocal">
            <i class="bi bi-skip-backward-fill me-2 fw-bold"></i>
            <span>{{
              Browser.I18n.getMessage('btn_label_set_local_config')
            }}</span>
          </button>
        </div>
        <div>
          <button class="btn btn-danger btn-sm" @click="handleSetSync">
            <span>{{
              Browser.I18n.getMessage('btn_label_set_sync_config')
            }}</span>
            <i class="bi bi-skip-forward-fill ms-2"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="card flex-grow-1" style="width: 1px">
      <div class="card-body border p-4 rounded">
        <p class="card-text fw-bold">
          {{ Browser.I18n.getMessage('section_label_sync_data') }}
        </p>
        <p class="card-text">
          {{
            Browser.I18n.getMessage('page_title_version') +
            syncVersion +
            (syncUpdateDate == '' ? '' : `  (${syncUpdateDate})`)
          }}
        </p>
        <p class="card-text" v-if="syncFixed.length > 0">
          {{
            Browser.I18n.getMessage('page_title_fixed') + syncFixed.join(', ')
          }}
        </p>
        <p class="card-text" v-if="syncPac.length > 0">
          {{ Browser.I18n.getMessage('page_title_pac') + syncPac.join(', ') }}
        </p>
        <p class="card-text" v-if="syncAuto.length > 0">
          {{ Browser.I18n.getMessage('page_title_auto') + syncAuto.join(', ') }}
        </p>
      </div>
    </div>
  </div>
</template>
