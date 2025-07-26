<script setup>
import { ref, onMounted } from 'vue'
import ModalBase from '@/components/modal/ModalBase.vue'
import Browser from '@/Browser/main'
defineExpose({
  createConfirm
})

const title = ref('')
const description = ref('')
let callback = function () {}

const confirmModalInstance = ref(null)

onMounted(() => {
  const modalElement = document.getElementById('confirmModal')
  confirmModalInstance.value = new bootstrap.Modal(modalElement)
})

function hide() {
  confirmModalInstance.value.hide()
}
function show() {
  confirmModalInstance.value.show()
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
        <div>{{ description }}</div>
      </div>
    </template>
    <template #operations>
      <button class="btn btn-sm btn-secondary ms-auto" @click="handleCancel">
        <i class="bi bi-x-circle-fill me-2"></i>
        <span>{{ Browser.I18n.getMessage('btn_label_cancel') }}</span>
      </button>
      <button class="btn btn-sm btn-primary" @click="handleSubmit">
        <i class="bi bi-check-circle-fill me-2"></i>
        <span>{{ Browser.I18n.getMessage('btn_label_submit') }}</span>
      </button>
    </template>
  </ModalBase>
</template>
