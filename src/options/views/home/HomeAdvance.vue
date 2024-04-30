<script setup>
import { ref, watch, getCurrentInstance, onMounted } from 'vue'
import PopoverTips from '@/components/PopoverTips.vue'

import Browser from '@/Browser/chrome/chrome.js'
import { enrich, simplify } from '@/core/ConfigData'

const instance = getCurrentInstance()
const toast = instance?.appContext.config.globalProperties.$toast
const confirmModal = instance?.appContext.config.globalProperties.$confirm

const configMonitor = ref(false)
const localFixed = ref([])
const localPac = ref([])
const localAuto = ref([])
const syncFixed = ref([])
const syncPac = ref([])
const syncAuto = ref([])

onMounted(() => {
  reloadLocalData()
  reloadSyncData()
})

watch(configMonitor, async (newValue) => {
  await Browser.Storage.setLocal({ config_monitor: newValue })
})

async function reloadSyncData() {
  const result = await Browser.Storage.getSync(null)
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
}
async function reloadLocalData() {
  const result = await Browser.Storage.getLocalAll()
  if (result.config_monitor != null) {
    configMonitor.value = result.config_monitor
  }
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
}
function handleSetLocal() {
  confirmModal.createConfirm(
    Browser.I18n.getMessage('modal_title_warning'),
    Browser.I18n.getMessage('modal_desc_override_local'),
    async function () {
      const result = await Browser.Storage.getSync(null)
      const enrichConfig = await enrich(result)
      await Browser.Storage.setLocal(enrichConfig)
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
    async function () {
      const result = await Browser.Storage.getLocal(null)
      const sConfig = simplify(result)
      await Browser.Storage.setSync(sConfig)
      toast.info(Browser.I18n.getMessage('desc_override_sync'))
      reloadSyncData()
    }
  )
}
</script>
<template>
  <div class="tab-pane fade show" id="v-pills-advance">
    <div class="card">
      <div class="card-header">
        <span class="fw-bold">{{
          Browser.I18n.getMessage('section_label_request')
        }}</span>
      </div>
      <div class="card-body">
        <div class="row mb-3 d-flex align-items-center">
          <label class="col-2 col-form-label">
            <span>{{ Browser.I18n.getMessage('form_label_monitor') }}</span>
            <PopoverTips
              className="bi bi-question-circle-fill icon-btn ms-2"
              :content="Browser.I18n.getMessage('popover_monitor')"
            ></PopoverTips>
          </label>
          <div class="col-10">
            <div class="form-check-sm">
              <input
                class="form-check-input"
                type="checkbox"
                id="monitorCheck"
                v-model="configMonitor"
              />
              <label class="form-check-label ms-2" for="monitorCheck">
                <span>{{ Browser.I18n.getMessage('input_label_open') }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="fw-bold">{{
          Browser.I18n.getMessage('section_label_sync')
        }}</span>
      </div>
      <div class="card-body">
        <div
          class="hstack gap-4 d-flex align-items-stretch justify-content-between"
        >
          <div class="card flex-grow-1" style="width: 1px">
            <div class="card-body border p-4 rounded">
              <p class="card-text fw-bold">
                {{ Browser.I18n.getMessage('section_label_local_data') }}
              </p>
              <p class="card-text" v-if="localFixed.length > 0">
                {{
                  Browser.I18n.getMessage('page_title_fixed') +
                  localFixed.join(', ')
                }}
              </p>
              <p class="card-text" v-if="localPac.length > 0">
                {{
                  Browser.I18n.getMessage('page_title_pac') +
                  localPac.join(', ')
                }}
              </p>
              <p class="card-text" v-if="localAuto.length > 0">
                {{
                  Browser.I18n.getMessage('page_title_auto') +
                  localAuto.join(', ')
                }}
              </p>
            </div>
          </div>
          <div class="align-self-center flex-grow-0 flex-shrink-0">
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
              <p class="card-text" v-if="syncFixed.length > 0">
                {{
                  Browser.I18n.getMessage('page_title_fixed') +
                  syncFixed.join(', ')
                }}
              </p>
              <p class="card-text" v-if="syncPac.length > 0">
                {{
                  Browser.I18n.getMessage('page_title_pac') + syncPac.join(', ')
                }}
              </p>
              <p class="card-text" v-if="syncAuto.length > 0">
                {{
                  Browser.I18n.getMessage('page_title_auto') +
                  syncAuto.join(', ')
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
