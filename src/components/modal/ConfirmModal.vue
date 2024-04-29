<script setup>
import { ref, onMounted } from 'vue'
import ModalBase from '@/components/modal/ModalBase.vue'

defineExpose({
  createConfirm
})

const title = ref('')
const description = ref('')
let callback = function () {}

let confirmModalInstance = null

onMounted(() => {
  const modalElement = document.getElementById('confirmModal')
  // eslint-disable-next-line no-undef
  confirmModalInstance = new bootstrap.Modal(modalElement)
})

function hide() {
  confirmModalInstance.hide()
}
function show() {
  confirmModalInstance.show()
}

function createConfirm(mTitle, mDescription, mCallback) {
  title.value = mTitle
  description.value = mDescription
  callback = mCallback
  show()
}

function handleCancel() {
  hide()
}

function handleSubmit() {
  if (typeof callback === 'function') callback()
  hide()
}
</script>
<template>
  <ModalBase id="confirmModal">
    <template #title>{{ title }}</template>
    <template #default>
      <div class="mb-3 row">
        <div class="comfirm-message">{{ description }}</div>
      </div>
    </template>
    <template #operations>
      <button class="btn btn-sm btn-secondary ms-auto" @click="handleCancel">
        <i class="bi bi-x-circle-fill me-1"></i>
        关 闭
      </button>
      <button class="btn btn-sm btn-primary" @click="handleSubmit">
        <i class="bi bi-check-circle-fill me-1"></i>
        确 定
      </button>
    </template>
  </ModalBase>
</template>
