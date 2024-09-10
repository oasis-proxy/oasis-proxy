<script setup>
import { computed, ref, getCurrentInstance, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import ModalBase from '@/components/modal/ModalBase.vue'
import { getNextLocalVersion } from '@/core/version_control.js'
import Browser from '@/Browser/main'
import { createProxy } from '@/core/proxy_config.js'

const showUploadConflictModal = inject('showUploadConflictModal')

const name = ref('')
const mode = ref('auto')
const isNameValid = ref(true)

const toast = getCurrentInstance()?.appContext.config.globalProperties.$toast
const router = useRouter()
let policyModalInstance = null

onMounted(() => {
  const modalElement = document.getElementById('policyModal')
  // eslint-disable-next-line no-undef
  policyModalInstance = new bootstrap.Modal(modalElement)
})

const policyNameClass = computed(() => {
  return isNameValid.value
    ? 'form-control form-control-sm'
    : 'form-control form-control-sm is-invalid'
})

defineExpose({
  show,
  hide
})

function hide() {
  policyModalInstance.hide()
}
function show() {
  policyModalInstance.show()
}

function handleCancel() {
  setTimeout(() => {
    name.value = ''
    mode.value = 'auto'
    isNameValid.value = true
  }, 300)
  hide()
}

async function handleSubmit() {
  isNameValid.value = true
  if (
    name.value == '' ||
    name.value == 'direct' ||
    name.value == 'system' ||
    name.value == 'reject'
  ) {
    isNameValid.value = false
    return
  }
  const result = await Browser.Storage.getLocalAll()
  const encodeName = encodeURIComponent(name.value)
  // eslint-disable-next-line no-prototype-builtins
  if (result.hasOwnProperty('proxy_' + encodeName)) {
    isNameValid.value = false
    return
  }
  const proxyConfig = createProxy(encodeName, '#3498db', mode.value)
  if (proxyConfig == -1) {
    toast.warning(
      `${name.value} ${Browser.I18n.getMessage('desc_save_failed')}`
    )
    handleCancel()
    return
  }

  const key = 'proxy_' + encodeName
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    [key]: proxyConfig,
    config_version: version,
    config_syncTime: new Date().getTime()
  })
  toast.info(`${name.value} ${Browser.I18n.getMessage('desc_save_success')}`)
  handleCancel()
  showUploadConflictModal(() => {
    if (mode.value == 'auto') {
      router.push('/auto/' + encodeName)
    } else {
      router.push('/pac/' + encodeName)
    }
  })
}
</script>
<template>
  <ModalBase id="policyModal" mode="form">
    <template #title>{{
      Browser.I18n.getMessage('modal_title_add_policy')
    }}</template>
    <template #default>
      <form action="" id="policyModalForm">
        <div class="mb-3 row d-flex align-items-center">
          <label class="col-2 col-form-label" for="policyName">{{
            Browser.I18n.getMessage('form_label_name')
          }}</label>
          <div class="col-10">
            <input
              type="text"
              :class="policyNameClass"
              id="policyName"
              aria-label="name"
              v-model="name"
              maxlength="25"
            />
            <div class="invalid-feedback">
              {{ Browser.I18n.getMessage('feedback_name_invalid') }}
            </div>
          </div>
        </div>
        <div class="mb-3 row d-flex align-items-center">
          <label class="col-2 col-form-label">{{
            Browser.I18n.getMessage('form_label_policy_mode')
          }}</label>
          <div class="col-10 hstack gap-3 d-flex align-items-center">
            <div class="form-check-sm">
              <input
                class="form-check-input"
                type="radio"
                name="policyMode"
                value="auto"
                id="policyModeAuto"
                v-model="mode"
              />
              <label class="form-check-label ms-1" for="policyModeAuto">
                {{ Browser.I18n.getMessage('input_label_auto_policy') }}
              </label>
            </div>
            <div class="form-check-sm">
              <input
                class="form-check-input"
                type="radio"
                name="policyMode"
                value="pac_script"
                id="policyModePac"
                v-model="mode"
              />
              <label class="form-check-label ms-1" for="policyModePac">
                {{ Browser.I18n.getMessage('input_label_pac_policy') }}
              </label>
            </div>
          </div>
        </div>
      </form>
    </template>
    <template #operations>
      <button class="btn btn-sm btn-secondary ms-auto" @click="handleCancel">
        <i class="bi bi-x-circle-fill me-2"></i>
        <span>{{ Browser.I18n.getMessage('btn_label_close') }}</span>
      </button>
      <button class="btn btn-sm btn-primary" @click="handleSubmit">
        <i class="bi bi-check-circle-fill me-2"></i>
        <span>{{ Browser.I18n.getMessage('btn_label_add_config') }}</span>
      </button>
    </template>
  </ModalBase>
</template>
