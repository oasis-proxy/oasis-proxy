<script setup>
import { computed, ref, getCurrentInstance, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalBase from '@/components/modal/ModalBase.vue'
import { getNextLocalVersion } from '@/core/version_control.js'
import { subStringForName } from '@/core/utils.js'
import Browser from '@/Browser/main'
import {
  createProxy,
  replaceProxyNameForAllProxy
} from '@/core/proxy_config.js'

const showUploadConflictModal = inject('showUploadConflictModal')

const name = ref('')
const mode = ref('fixed_servers') // fixed_servers, auto, pac
const isNameValid = ref(true)

const props = defineProps({
  operationType: String, // updateName, copyConfig, newConfig
  configMode: String // servers, policy
})

const toast = getCurrentInstance()?.appContext.config.globalProperties.$toast
const route = useRoute()
const router = useRouter()
let basicConfigModalInstance = null

onMounted(() => {
  const modalElement = document.getElementById('basicConfigModal')
  // eslint-disable-next-line no-undef
  basicConfigModalInstance = new bootstrap.Modal(modalElement)
})

const titleLabel = computed(() => {
  if (props.operationType == 'newConfig') {
    if (props.configMode == 'servers')
      return Browser.I18n.getMessage('modal_title_add_server')
    return Browser.I18n.getMessage('modal_title_add_policy')
  } else if (props.operationType == 'updateName') {
    return Browser.I18n.getMessage('btn_label_update_name_config')
  }
  return Browser.I18n.getMessage('btn_label_copy_new_config')
})

const oldNameLabel = computed(() => {
  if (props.operationType == 'newConfig') {
    return Browser.I18n.getMessage('form_label_name')
  }
  return Browser.I18n.getMessage('form_label_origin_name')
})

const newNameLabel = computed(() => {
  if (props.operationType == 'newConfig') {
    return Browser.I18n.getMessage('form_label_name')
  }
  return Browser.I18n.getMessage('form_label_new_name')
})

const submitLabel = computed(() => {
  if (props.operationType == 'newConfig') {
    return Browser.I18n.getMessage('btn_label_add_config')
  } else if (props.operationType == 'updateName') {
    return Browser.I18n.getMessage('btn_label_modify_config')
  }
  return Browser.I18n.getMessage('btn_label_copy_config')
})

const nameClass = computed(() => {
  return isNameValid.value
    ? 'form-control form-control-sm'
    : 'form-control form-control-sm is-invalid'
})

const oldName = computed(() => {
  return route.params.name
})

defineExpose({
  show,
  hide
})

function hide() {
  basicConfigModalInstance.hide()
}
function show() {
  basicConfigModalInstance.show()
  setTimeout(() => {
    if (props.operationType == 'copyConfig') {
      name.value =
        oldName.value +
        '(' +
        Browser.I18n.getMessage('btn_label_copy_config') +
        ')'
    } else if (props.operationType == 'newConfig') {
      if (props.configMode == 'servers') mode.value = 'fixed_servers'
      else mode.value = 'auto'
    } else if (props.operationType == 'updateName') {
      name.value = oldName.value
    }
  }, 300)
}

function handleCancel() {
  setTimeout(() => {
    name.value = ''
    mode.value = 'fixed_servers'
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
  // eslint-disable-next-line no-prototype-builtins
  if (result.hasOwnProperty('proxy_' + encodeURIComponent(name.value))) {
    isNameValid.value = false
    return
  }

  switch (props.operationType) {
    case 'updateName':
      handleSubmitUpdateName(result)
      break
    case 'copyConfig':
      handleSubmitCopyConfige(result)
      break
    default:
      handleSubmitNew()
      break
  }
}
async function handleSubmitUpdateName(result) {
  const encodeOldName = encodeURIComponent(oldName.value)
  const oldKey = 'proxy_' + encodeOldName

  // eslint-disable-next-line no-prototype-builtins
  if (!result.hasOwnProperty(oldKey)) {
    toast.warning(
      `${oldName.value} ${Browser.I18n.getMessage('desc_config_not_found')}`
    )
    handleCancel()
    return
  }
  const encodeNewName = encodeURIComponent(name.value)
  const newKey = 'proxy_' + encodeNewName
  const activeProxyKey = result.status_proxyKey

  const storeProxy = replaceProxyNameForAllProxy(
    encodeOldName,
    encodeNewName,
    result
  )

  if (activeProxyKey == oldKey) {
    storeProxy.status_proxyKey = newKey
  }

  const version = await getNextLocalVersion()
  storeProxy.config_version = version
  storeProxy.config_syncTime = new Date().getTime()
  await Browser.Storage.setLocal(storeProxy)
  await Browser.Action.setBadgeText(subStringForName(storeProxy[newKey].name))
  await Browser.Storage.removeLocal(oldKey)
  toast.info(Browser.I18n.getMessage('desc_save_success'))
  handleCancel()

  showUploadConflictModal(() => {
    const r = route.path.split('/')
    r.pop()
    r.push(encodeNewName)
    router.push(r.join('/'))
  })
}

async function handleSubmitCopyConfige(result) {
  const encodeOldName = encodeURIComponent(oldName.value)
  const oldKey = 'proxy_' + encodeOldName

  // eslint-disable-next-line no-prototype-builtins
  if (!result.hasOwnProperty(oldKey)) {
    toast.warning(
      `${oldName.value} ${Browser.I18n.getMessage('desc_config_not_found')}`
    )
    handleCancel()
    return
  }

  const newConfig = result[oldKey]
  const encodeNewName = encodeURIComponent(name.value)
  newConfig.name = encodeNewName
  const newKey = 'proxy_' + encodeNewName
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    [newKey]: newConfig,
    config_version: version,
    config_syncTime: new Date().getTime()
  })
  toast.info(`${name.value} ${Browser.I18n.getMessage('desc_save_success')}`)
  handleCancel()
  showUploadConflictModal(() => {
    switch (newConfig.mode) {
      case 'fixed_servers':
        router.push('/fixed/' + encodeNewName)
        break
      case 'auto':
        router.push('/auto/' + encodeNewName)
        break
      case 'pac_script':
        router.push('/pac/' + encodeNewName)
        break
      default:
        break
    }
  })
}

async function handleSubmitNew() {
  const encodeName = encodeURIComponent(name.value)
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
    switch (mode.value) {
      case 'fixed_servers':
        router.push('/fixed/' + encodeName)
        break
      case 'auto':
        router.push('/auto/' + encodeName)
        break
      case 'pac_script':
        router.push('/pac/' + encodeName)
        break
      default:
        break
    }
  })
}
</script>
<template>
  <ModalBase id="basicConfigModal" mode="form">
    <template #title>{{ titleLabel }}</template>
    <template #default>
      <form action="" id="basicConfigModalForm">
        <div
          class="mb-3 row d-flex align-items-center"
          v-if="props.operationType != 'newConfig'"
        >
          <label class="col-2 col-form-label" for="configOldName">{{
            oldNameLabel
          }}</label>
          <div class="col-10">
            <input
              type="text"
              class="form-control form-control-sm"
              id="configOldName"
              aria-label="oldName"
              v-model="oldName"
              maxlength="25"
              disabled
            />
          </div>
        </div>
        <div class="mb-3 row d-flex align-items-center">
          <label class="col-2 col-form-label" for="configName">{{
            newNameLabel
          }}</label>
          <div class="col-10">
            <input
              type="text"
              :class="nameClass"
              id="configName"
              aria-label="name"
              v-model="name"
              maxlength="25"
            />
            <div class="invalid-feedback">
              {{ Browser.I18n.getMessage('feedback_name_invalid') }}
            </div>
          </div>
        </div>
        <div
          class="mb-3 row d-flex align-items-center"
          v-if="
            props.configMode == 'policy' && props.operationType == 'newConfig'
          "
        >
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
        <span>{{ submitLabel }}</span>
      </button>
    </template>
  </ModalBase>
</template>
