<script setup>
import { ref, watch, getCurrentInstance, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import PopoverTips from '@/components/PopoverTips.vue'

import Browser from '@/Browser/chrome/chrome.js'

const instance = getCurrentInstance()
const router = useRouter()
const toast = instance?.appContext.config.globalProperties.$toast
const confirmModal = instance?.appContext.config.globalProperties.$confirm

const configUi = ref('light')
const configReject = ref('HTTPS 127.0.0.1:65432')
const isRejectValid = ref(true)
const configUpdateUrl = ref(true)
const version = ref('')

const rejectInputClass = computed(() => {
  return isRejectValid.value
    ? 'form-control form-control-sm'
    : 'form-control form-control-sm is-invalid'
})

onMounted(async () => {
  version.value = Browser.Runtime.getManifest().version
  const result = await Browser.Storage.getLocal([
    'config_ui',
    'reject',
    'config_updateUrl'
  ])

  if (result.config_ui != null) {
    configUi.value = result.config_ui
  }
  if (result.reject != null) {
    configReject.value = result.reject.config.rules
  }
  if (result.config_updateUrl != null) {
    configUpdateUrl.value = result.config_updateUrl
  }
})

watch(configUi, async (newValue) => {
  await Browser.Storage.setLocal({ config_ui: newValue })
})

watch(configUpdateUrl, async (newValue) => {
  await Browser.Storage.setLocal({ config_updateUrl: newValue })
})

async function handleBlur() {
  isRejectValid.value = true
  let tmp = configReject.value
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
        config: { mode: 'reject', rules: configReject.value }
      }
    })
    toast.info(
      `${Browser.I18n.getMessage('desc_saved_reject')} ${configReject.value}`
    )
  } else {
    isRejectValid.value = false
  }
}

async function exportConfig() {
  const result = await Browser.Storage.getLocalAll()
  Browser.saveFile(result, 'backup.json')
}

function handleImportConfig(event) {
  const file = event.target.files[0]
  const reader = new FileReader()
  reader.onload = async function (event) {
    const tmpObj = JSON.parse(event.target.result)
    await Browser.Storage.setLocal(tmpObj)
    router.replace('/home')
  }
  reader.readAsText(file)
}

function clearConfig() {
  confirmModal.createConfirm(
    Browser.I18n.getMessage('modal_title_resetall'),
    Browser.I18n.getMessage('modal_desc_resetall'),
    async function () {
      await Browser.Storage.clearLocal()
      const obj = {
        config_ui: 'dark',
        config_updateUrl: true,
        config_reject: 'HTTPS 127.0.0.1:65432',
        config_monitor: false,
        direct: { mode: 'direct', name: 'direct', config: { mode: 'direct' } },
        system: { mode: 'system', name: 'system', config: { mode: 'system' } },
        reject: {
          mode: 'reject',
          name: 'reject',
          config: { mode: 'reject', rules: 'HTTPS 127.0.0.1:65432' }
        }
      }
      await Browser.Storage.setLocal(obj)
      toast.info(Browser.I18n.getMessage('desc_init_config'))
      setTimeout(() => {
        location.reload()
      }, 2000)
    }
  )
}
function toGithub() {
  window.open('https://github.com/oasis-proxy/oasis-proxy', '_blank')
}
</script>

<template>
  <div class="tab-pane fade show active" id="v-pills-default">
    <div class="card">
      <div class="card-header">
        <span class="fw-bold">{{
          Browser.I18n.getMessage('section_label_extention_setting')
        }}</span>
      </div>
      <div class="card-body">
        <div class="row mb-3">
          <label class="col-2 col-form-label">{{
            Browser.I18n.getMessage('form_label_ui_config')
          }}</label>
          <div class="col-10 d-flex align-items-center">
            <div class="form-check-sm form-check-inline">
              <input
                class="form-check-input"
                type="radio"
                value="light"
                id="uiLight"
                v-model="configUi"
              />
              <label class="form-check-label" for="uiLight">
                <i class="bi bi-sun ms-2 me-1"></i>
                <span>{{
                  Browser.I18n.getMessage('input_label_ui_light')
                }}</span>
              </label>
            </div>
            <div class="form-check-sm form-check-inline">
              <input
                class="form-check-input"
                type="radio"
                value="dark"
                id="uiDark"
                v-model="configUi"
              />
              <label class="form-check-label" for="uiDark">
                <i class="bi bi-moon-stars-fill ms-2 me-1"></i>
                <span>{{
                  Browser.I18n.getMessage('input_label_ui_dark')
                }}</span>
              </label>
            </div>
            <div class="form-check-sm form-check-inline">
              <input
                class="form-check-input"
                type="radio"
                value="system"
                id="uiSystem"
                v-model="configUi"
              />
              <label class="form-check-label" for="uiSystem">
                <i class="bi bi-circle-half ms-2 me-1"></i>
                <span>{{
                  Browser.I18n.getMessage('input_label_ui_system')
                }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="row mb-3">
          <label class="col-2 col-form-label" for="rejectHost">
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
              id="rejectHost"
              v-model="configReject"
              @blur="handleBlur"
              aria-label="name"
            />
            <div class="invalid-feedback">
              {{ Browser.I18n.getMessage('feedback_reject_invalid') }}
            </div>
          </div>
        </div>
        <div class="row mb-3 d-flex align-items-center">
          <label class="col-2 col-form-label">
            <span>{{ Browser.I18n.getMessage('form_label_rule_update') }}</span>
            <PopoverTips
              className="bi bi-question-circle-fill icon-btn ms-2"
              :content="Browser.I18n.getMessage('popover_update_url')"
            ></PopoverTips>
          </label>
          <div class="col-10">
            <div class="form-check-sm">
              <input
                class="form-check-input"
                type="checkbox"
                v-model="configUpdateUrl"
                id="updateUrlCheck"
              />
              <label class="form-check-label ms-2" for="updateUrlCheck">
                <span>{{
                  Browser.I18n.getMessage('input_label_rule_update')
                }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="row mb-1">
          <label class="col-2 col-form-label">{{
            Browser.I18n.getMessage('form_label_version')
          }}</label>
          <div class="col-10 col-form-label">
            <i class="bi bi-github me-2 cursor-point" @click="toGithub()"></i>
            <span>{{ version }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <div>
          <span class="fw-bold">{{
            Browser.I18n.getMessage('section_label_import_export')
          }}</span>
        </div>
      </div>
      <div class="card-body">
        <div class="hstack gap-3 mb-3">
          <div>
            <button class="btn btn-primary btn-sm" @click="exportConfig">
              <i class="bi bi-download me-2"></i>
              <span>{{
                Browser.I18n.getMessage('btn_label_export_config')
              }}</span>
            </button>
          </div>
          <div>{{ Browser.I18n.getMessage('desc_export') }}</div>
        </div>
        <div class="hstack gap-3 mb-3">
          <div>
            <label for="fileInput" class="btn btn-primary btn-sm">
              <i class="bi bi-upload me-2"></i>
              <span>
                <span>{{
                  Browser.I18n.getMessage('btn_label_import_config')
                }}</span>
              </span>
              <input
                type="file"
                id="fileInput"
                class="d-none"
                @change="handleImportConfig"
              />
            </label>
          </div>
          <div>{{ Browser.I18n.getMessage('desc_import') }}</div>
        </div>
        <div class="hstack gap-3 mb-3">
          <div>
            <button
              @click="clearConfig"
              class="btn btn-danger btn-sm"
              id="clear"
            >
              <i class="bi bi-trash-fill me-2"></i>
              <span>
                <span>{{
                  Browser.I18n.getMessage('btn_label_clear_config')
                }}</span>
              </span>
            </button>
          </div>
          <div>{{ Browser.I18n.getMessage('desc_clear') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
