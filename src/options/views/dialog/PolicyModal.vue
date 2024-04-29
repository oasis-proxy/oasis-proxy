<script setup>
import { computed, ref, getCurrentInstance, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ModalBase from '@/components/modal/ModalBase.vue'

import Browser from '@/Browser/chrome/chrome.js'
import { createProxy } from '@/core/ProxyConfig.js'

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
  const proxyConfig = createProxy(encodeName, mode.value)
  if (proxyConfig == -1) {
    toast.warning(`添加策略（${name.value}）失败`)
    handleCancel()
    return
  }

  const key = 'proxy_' + encodeName
  const storeProxy = {}
  storeProxy[key] = proxyConfig
  await Browser.Storage.setLocal(storeProxy)
  toast.info(`添加策略（${name.value}）成功`)
  handleCancel()
  if (mode.value == 'auto') {
    router.push('/auto/' + encodeName)
  } else {
    router.push('/pac/' + encodeName)
  }
}
</script>
<template>
  <ModalBase id="policyModal">
    <template #title>添加策略模式</template>
    <template #default>
      <form action="" id="policyModalForm">
        <div class="mb-3 row">
          <label class="col-2 col-form-label" for="policyName">策略名称</label>
          <div class="col-10">
            <input
              type="text"
              :class="policyNameClass"
              id="policyName"
              placeholder="请输入名称"
              aria-label="name"
              v-model="name"
              maxlength="25"
            />
            <div class="invalid-feedback">
              新名称不能为空、direct、system、reject，或新名称已存在
            </div>
          </div>
        </div>
        <div class="mb-3 row d-flex align-items-center">
          <label class="col-2 col-form-label"> 策略模式 </label>
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
                自动切换模式
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
                Pac脚本模式
              </label>
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
