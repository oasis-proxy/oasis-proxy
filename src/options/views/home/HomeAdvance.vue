<script setup>
import { ref, getCurrentInstance, computed, inject, nextTick, watch } from 'vue'
import PopoverTips from '@/components/PopoverTips.vue'
import ConfigDisplay from '@/options/components/ConfigDisplay.vue'
import { useConfigStore } from '@/options/stores/config'
import { useStatusStore } from '@/options/stores/status'

import Browser from '@/Browser/main'

const storeConfig = useConfigStore()
const storeStatus = useStatusStore()
const showSyncConflictModal = inject('showSyncConflictModal')
const instance = getCurrentInstance()
const toast = instance?.appContext.config.globalProperties.$toast

const isRejectValid = ref(true)

const rejectInputClass = computed(() => {
  return isRejectValid.value
    ? 'form-control form-control-sm'
    : 'form-control form-control-sm is-invalid'
})

const configAutoSync = computed(() => {
  return storeConfig.configAutoSync
})

watch(
  () => storeConfig.configMonitor,
  async (newValue) => {
    await Browser.Storage.setLocal({ config_monitor: newValue })
  }
)

async function handleAutoSyncChange(event) {
  if (event.target.checked) {
    storeConfig.configAutoSync = event.target.checked
    await nextTick()
    showSyncConflictModal(Browser.I18n.getMessage('modal_desc_sync'))
  } else {
    storeConfig.configAutoSync = false
    Browser.Storage.setLocal({ config_autoSync: false })
  }
}

function openMonitor() {
  if (!storeConfig.configMonitor) {
    toast.warning(Browser.I18n.getMessage('desc_monitor_disabled'))
    return
  }
  window.open('/monitor.html', '_blank')
}

async function handleBlur(event) {
  isRejectValid.value = true
  let tmp = event.target.value
  let scheme = tmp.split(' ')[0]
  let port = tmp.split(':')[1]
  if (
    (scheme == 'HTTPS' ||
      scheme == 'HTTP' ||
      scheme == 'http' ||
      scheme == 'https') &&
    parseInt(port) > 0 &&
    parseInt(port) < 65536
  ) {
    await Browser.Storage.setLocal({
      reject: {
        mode: 'reject',
        name: 'reject',
        config: { mode: 'reject', rules: tmp }
      }
    })
    toast.info(`${Browser.I18n.getMessage('desc_saved_reject')} ${tmp}`)
  } else {
    isRejectValid.value = false
  }
}
</script>
<template>
  <div class="tab-pane fade show" id="v-pills-advance">
    <div class="card">
      <div class="card-header">
        <span class="fw-bold">{{
          Browser.I18n.getMessage('tab_label_advance')
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
            <div class="form-check-sm d-flex align-items-center">
              <div class="form-check form-switch ms-2 mt-1">
                <input
                  class="form-check-input form-check-input"
                  type="checkbox"
                  role="switch"
                  v-model="storeConfig.configMonitor"
                />
                <span>{{
                  storeConfig.configMonitor == false
                    ? Browser.I18n.getMessage('input_label_off')
                    : Browser.I18n.getMessage('input_label_on')
                }}</span>
              </div>
              <PopoverTips
                className="bi bi-bug-fill icon-btn ms-2 mt-1"
                :content="Browser.I18n.getMessage('btn_label_monitor')"
                @click="openMonitor"
              ></PopoverTips>
            </div>
          </div>
        </div>
        <div class="row mb-3 d-flex align-items-center">
          <label class="col-2 col-form-label">
            <span>{{ Browser.I18n.getMessage('form_label_reject') }}</span>
            <PopoverTips
              className="bi bi-question-circle-fill icon-btn ms-2"
              :content="Browser.I18n.getMessage('popover_reject')"
            ></PopoverTips>
          </label>
          <div class="col-10">
            <input
              type="text"
              :class="rejectInputClass"
              :value="storeStatus.proxyConfigs.reject?.config.rules"
              @blur="handleBlur"
            />
            <div class="invalid-feedback">
              {{ Browser.I18n.getMessage('feedback_reject_invalid') }}
            </div>
          </div>
        </div>
        <div class="row mb-3 d-flex align-items-center">
          <label class="col-2 col-form-label">
            <span>{{ Browser.I18n.getMessage('form_label_autosync') }}</span>
            <PopoverTips
              className="bi bi-question-circle-fill icon-btn ms-2"
              :content="Browser.I18n.getMessage('popover_autosync')"
            ></PopoverTips>
          </label>
          <div class="col-10">
            <div class="form-check-sm d-flex align-items-center">
              <div class="form-check form-switch ms-2 mt-1">
                <input
                  class="form-check-input form-check-input"
                  type="checkbox"
                  role="switch"
                  :checked="configAutoSync"
                  @change="handleAutoSyncChange"
                />
                <span>{{
                  configAutoSync == false
                    ? Browser.I18n.getMessage('input_label_off')
                    : Browser.I18n.getMessage('input_label_on')
                }}</span>
              </div>
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
        <ConfigDisplay :isModal="false"></ConfigDisplay>
      </div>
    </div>
  </div>
</template>
