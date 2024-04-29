<script setup>
import { computed, ref, getCurrentInstance, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalBase from '@/components/modal/ModalBase.vue'

import Browser from '@/Browser/chrome/chrome.js'
import { replaceProxyNameForAllProxy } from '@/core/ProxyConfig.js'

const name = ref('')
const isNameValid = ref(true)

const route = useRoute()
const router = useRouter()
const toast = getCurrentInstance()?.appContext.config.globalProperties.$toast
let updateNameModalInstance = null

onMounted(() => {
  const modalElement = document.getElementById('updateNameModal')
  // eslint-disable-next-line no-undef
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
    toast.warning(`（${oldName}）配置不存在，请刷新页面后重新操作`)
    handleCancel()
    return
  }
  const encodeNewName = encodeURIComponent(name.value)
  const newKey = 'proxy_' + encodeNewName
  const activeProxyKey = result.status_proxyKey
  if (result.hasOwnProperty(newKey)) {
    isNameValid.value = false
    return
  }

  const storeProxy = replaceProxyNameForAllProxy(
    encodeOldName,
    encodeNewName,
    result
  )
  storeProxy[newKey] = result[oldKey]
  storeProxy[newKey].name = encodeNewName

  if (activeProxyKey == oldKey) {
    storeProxy.status_proxyKey = newKey
  }
  await Browser.Storage.setLocal(storeProxy)
  await Browser.Storage.removeLocal(oldKey)
  toast.info(`代理名称修改成功`)
  handleCancel()
  const r = route.path.split('/')
  r.pop()
  r.push(encodeNewName)
  router.push(r.join('/'))
}
</script>
<template>
  <ModalBase id="updateNameModal">
    <template #title>修改名称</template>
    <template #default>
      <form id="updateNameModalForm">
        <div class="mb-3 row">
          <label class="col-2 col-form-label-sm" for="policyName">
            新名称
          </label>
          <div class="col-10">
            <input
              type="text"
              :class="serverNameClass"
              placeholder="请输入名称"
              aria-label="name"
              v-model="name"
              maxlength="25"
            />
            <div class="invalid-feedback">
              新名称不能为空、direct、system、reject，或新名称与旧名称一致，或新名称已存在
            </div>
          </div>
        </div>
      </form>
    </template>
    <template #operations>
      <button class="btn btn-sm btn-secondary ms-auto" @click="handleCancel">
        <i class="bi bi-x-circle-fill me-2"></i>
        <span>关 闭</span>
      </button>
      <button class="btn btn-sm btn-primary" @click="handleSubmit">
        <i class="bi bi-check-circle-fill me-2"></i>
        <span>添 加</span>
      </button>
    </template>
  </ModalBase>
</template>
