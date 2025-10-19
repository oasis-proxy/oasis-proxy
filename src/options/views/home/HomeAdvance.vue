<script setup>
import { ref, getCurrentInstance, computed, watch, inject } from 'vue'
import PopoverTips from '@/components/PopoverTips.vue'
import { useConfigStore } from '@/options/stores/config'
import { useStatusStore } from '@/options/stores/status'
import { getNextLocalVersion } from '@/core/version_control.js'

const showUploadConflictModal = inject('showUploadConflictModal')

import Browser from '@/Browser/main'
import TagsTable from '@/options/components/TagsTable.vue'

const storeConfig = useConfigStore()
const storeStatus = useStatusStore()
const instance = getCurrentInstance()
const toast = instance?.appContext.config.globalProperties.$toast

const isRejectValid = ref(true)

const rejectInputClass = computed(() => {
  return isRejectValid.value
    ? 'form-control form-control-sm'
    : 'form-control form-control-sm is-invalid'
})

watch(
  () => storeConfig.configMonitor,
  async (newValue) => {
    await Browser.Storage.setLocal({ config_monitor: newValue })
  }
)

function openMonitorPage() {
  if (!storeConfig.configMonitor) {
    toast.warning(Browser.I18n.getMessage('desc_monitor_disabled'))
    return
  }
  window.open('/monitor.html', '_blank')
}

async function handleIconBtnHintChange() {
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    config_iconBtnHint: storeConfig.configIconBtnHint,
    config_version: version,
    config_syncTime: new Date().getTime()
  })
  showUploadConflictModal()
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
        <!-- section: reject address -->
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
        <!-- section: iconbtn hint -->
        <div class="row mb-3 d-flex align-items-center">
          <label class="col-2 col-form-label">
            <span>{{
              Browser.I18n.getMessage('section_label_iconbtn_hint')
            }}</span>
          </label>
          <div class="col-10">
            <div class="form-check-sm d-flex align-items-center">
              <div class="form-check form-switch mt-1">
                <input
                  class="form-check-input form-check-input"
                  type="checkbox"
                  role="switch"
                  v-model="storeConfig.configIconBtnHint"
                  @change="handleIconBtnHintChange"
                />
                <span>{{
                  storeConfig.configIconBtnHint
                    ? Browser.I18n.getMessage('input_label_on')
                    : Browser.I18n.getMessage('input_label_off')
                }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- section: request monitor -->
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
              <div class="form-check form-switch mt-1">
                <input
                  class="form-check-input form-check-input"
                  type="checkbox"
                  role="switch"
                  v-model="storeConfig.configMonitor"
                />
                <span>{{
                  storeConfig.configMonitor
                    ? Browser.I18n.getMessage('input_label_on')
                    : Browser.I18n.getMessage('input_label_off')
                }}</span>
              </div>
              <PopoverTips
                className="bi bi-bug-fill icon-btn ms-2 mt-1"
                :content="Browser.I18n.getMessage('btn_label_monitor')"
                :hint="storeConfig.configIconBtnHint"
                @click="openMonitorPage()"
              ></PopoverTips>
            </div>
          </div>
        </div>
        <!-- section: iptags -->
        <div class="row mb-3 d-flex align-items-top">
          <label class="col-2 col-form-label">
            <span>{{ Browser.I18n.getMessage('form_label_iptags') }}</span>
            <PopoverTips
              className="bi bi-question-circle-fill icon-btn ms-2"
              :content="Browser.I18n.getMessage('popover_iptags')"
            ></PopoverTips>
          </label>
          <div class="col-10">
            <TagsTable></TagsTable>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
