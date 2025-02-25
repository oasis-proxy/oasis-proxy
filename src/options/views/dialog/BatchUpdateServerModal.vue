<script setup>
import { computed, ref, onMounted } from 'vue'
import ModalBase from '@/components/modal/ModalBase.vue'
import ProxySelect from '@/components/ProxySelect.vue'
import Browser from '@/Browser/main'

const serverForm = defineModel()

const emit = defineEmits(['batchUpdateServer'])

const form = ref({
  originServer: null,
  targetServer: null
})
const isOriginServerValid = ref(true)
const isTargetServerValid = ref(true)

const originClass = computed(() => {
  return isOriginServerValid.value
    ? 'form-select form-select-sm'
    : 'form-select form-select-sm is-invalid'
})
const targetClass = computed(() => {
  return isTargetServerValid.value
    ? 'form-select form-select-sm'
    : 'form-select form-select-sm is-invalid'
})

let batchUpdateServerModal = null

onMounted(() => {
  const modalElement = document.getElementById('batchUpdateServerModal')
  // eslint-disable-next-line no-undef
  batchUpdateServerModal = new bootstrap.Modal(modalElement)
})

defineExpose({
  show,
  hide
})

function hide() {
  setTimeout(() => {
    form.value.originServer = null
    form.value.targetServer = null
    isOriginServerValid.value = true
    isTargetServerValid.value = true
  }, 300)
  batchUpdateServerModal.hide()
}
function show() {
  batchUpdateServerModal.show()
}

function handleCancel() {
  hide()
}

async function handleSubmit() {
  isOriginServerValid.value = true
  isTargetServerValid.value = true
  if (form.value.originServer == null) {
    isOriginServerValid.value = false
    return
  }
  if (form.value.targetServer == null) {
    isTargetServerValid.value = false
    return
  }
  serverForm.value.originServer = form.value.originServer
  serverForm.value.targetServer = form.value.targetServer
  emit('batchUpdateServer')
  hide()
}
</script>
<template>
  <ModalBase id="batchUpdateServerModal" mode="form">
    <template #title>
      {{ Browser.I18n.getMessage('modal_title_batch_update_server') }}
    </template>
    <template #default>
      <form action="" id="batchUpdateServerModalForm">
        <div class="mb-3 row d-flex align-items-center">
          <label class="col-2 col-form-label">
            {{ Browser.I18n.getMessage('form_label_origin_server') }}
          </label>
          <div class="col-10">
            <ProxySelect
              :class="originClass"
              v-model="form.originServer"
            ></ProxySelect>
            <div class="invalid-feedback">
              {{ Browser.I18n.getMessage('feedback_select_null_invalid') }}
            </div>
          </div>
        </div>
        <div class="mb-3 row d-flex align-items-center">
          <label class="col-2 col-form-label">
            {{ Browser.I18n.getMessage('form_label_target_config') }}
          </label>
          <div class="col-10">
            <ProxySelect
              :class="targetClass"
              v-model="form.targetServer"
            ></ProxySelect>
            <div class="invalid-feedback">
              {{ Browser.I18n.getMessage('feedback_select_null_invalid') }}
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
        <span>{{ Browser.I18n.getMessage('btn_label_submit') }}</span>
      </button>
    </template>
  </ModalBase>
</template>
