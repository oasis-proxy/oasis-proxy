<script setup>
import { computed, ref, getCurrentInstance, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalBase from '@/components/modal/ModalBase.vue'

import Browser from '@/Browser/main'
import { replaceProxyNameForAllProxy } from '@/core/proxy_config.js'
import { getNextLocalVersion } from '@/core/version_control.js'
const showUploadConflictModal = inject('showUploadConflictModal')

const name = ref('')
const isNameValid = ref(true)

const route = useRoute()
const router = useRouter()
const toast = getCurrentInstance()?.appContext.config.globalProperties.$toast
let updateNameModalInstance = null

onMounted(() => {
  const modalElement = document.getElementById('updateNameModal')
  updateNameModalInstance = new bootstrap.Modal(modalElement)
})

const serverNameClass = computed(() => {
  return isNameValid.value
    ? 'form-control form-control-sm'
    : 'form-control form-control-sm is-invalid'
})

defineExpose({
  show,
  hide
})

function hide() {
  updateNameModalInstance.hide()
}
function show() {
  name.value = route.params.name
  updateNameModalInstance.show()
}

function handleCancel() {
  setTimeout(() => {
    name.value = ''
    isNameValid.value = true
  }, 300)
  hide()
}

async function handleSubmit() {
  isNameValid.value = true
  const oldName = route.params.name
  if (
    name.value == '' ||
    name.value == 'direct' ||
    name.value == 'system' ||
    name.value == 'reject' ||
    name.value == oldName
  ) {
    isNameValid.value = false
    return
  }
  const encodeOldName = encodeURIComponent(oldName)
  const oldKey = 'proxy_' + encodeOldName

  const result = await Browser.Storage.getLocalAll()
  // eslint-disable-next-line no-prototype-builtins
  if (!result.hasOwnProperty(oldKey)) {
    toast.warning(
      `${oldName} ${Browser.I18n.getMessage('desc_config_not_found')}`
    )
    handleCancel()
    return
  }
  const encodeNewName = encodeURIComponent(name.value)
  const newKey = 'proxy_' + encodeNewName
  const activeProxyKey = result.status_proxyKey
  if (Object.prototype.hasOwnProperty.call(result, newKey)) {
    isNameValid.value = false
    return
  }

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
  await Browser.Storage.setLocal(storeProxy)
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
</script>
<template>
  <ModalBase id="updateNameModal" mode="form">
    <template #title>{{
      Browser.I18n.getMessage('btn_label_update_name_config')
    }}</template>
    <template #default>
      <form id="updateNameModalForm">
        <div class="mb-3 row d-flex align-items-center">
          <label class="col-2 col-form-label" for="policyName">
            {{ Browser.I18n.getMessage('form_label_new_name') }}
          </label>
          <div class="col-10">
            <input
              type="text"
              :class="serverNameClass"
              aria-label="name"
              v-model="name"
              maxlength="25"
            />
            <div class="invalid-feedback">
              {{ Browser.I18n.getMessage('feedback_update_name_invalid') }}
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
        <span>{{ Browser.I18n.getMessage('btn_label_modify_config') }}</span>
      </button>
    </template>
  </ModalBase>
</template>
