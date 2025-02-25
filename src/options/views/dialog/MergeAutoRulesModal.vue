<script setup>
import { computed, ref, onMounted } from 'vue'
import ModalBase from '@/components/modal/ModalBase.vue'
import Browser from '@/Browser/main'

const mergeForm = defineModel()

const emit = defineEmits(['handleMerge'])

const props = defineProps({
  autoPolicy: Array
})

const form = ref({
  proxyKey: null,
  part: {
    local: true,
    reject: true
  },
  mergeMethod: 'ignore'
})
const isNameValid = ref(true)

const nameClass = computed(() => {
  return isNameValid.value
    ? 'form-select form-select-sm'
    : 'form-select form-select-sm is-invalid'
})

let mergeAutoRulesModalInstance = null

onMounted(() => {
  const modalElement = document.getElementById('mergeAutoRulesModal')
  // eslint-disable-next-line no-undef
  mergeAutoRulesModalInstance = new bootstrap.Modal(modalElement)
})

defineExpose({
  show,
  hide
})

function hide() {
  setTimeout(() => {
    form.value.proxyKey = null
    form.value.part.local = true
    form.value.part.reject = true
    form.value.mergeMethod = 'ignore'
    isNameValid.value = true
  }, 300)
  mergeAutoRulesModalInstance.hide()
}
function show() {
  mergeAutoRulesModalInstance.show()
  setTimeout(() => {}, 300)
}

function handleCancel() {
  hide()
}

async function handleSubmit() {
  isNameValid.value = true
  if (form.value.proxyKey == null) {
    isNameValid.value = false
    return
  }
  mergeForm.value.proxyKey = form.value.proxyKey
  mergeForm.value.part.local = form.value.part.local
  mergeForm.value.part.reject = form.value.part.reject
  mergeForm.value.mergeMethod = form.value.mergeMethod
  emit('handleMerge')
  hide()
}
</script>
<template>
  <ModalBase id="mergeAutoRulesModal" mode="form">
    <template #title>
      {{ Browser.I18n.getMessage('modal_title_merge_autopolicy') }}
    </template>
    <template #default>
      <form action="" id="mergeAutoRulesModalForm">
        <div class="mb-3 row d-flex align-items-center">
          <label class="col-2 col-form-label" for="configName">
            {{ Browser.I18n.getMessage('input_label_auto') }}
          </label>
          <div class="col-10">
            <select :class="nameClass" v-model="form.proxyKey">
              <option
                :value="'proxy_' + item"
                v-for="(item, index) in props.autoPolicy"
                :key="index"
              >
                {{ decodeURIComponent(item) }}
              </option>
            </select>
            <div class="invalid-feedback">
              {{ Browser.I18n.getMessage('feedback_select_null_invalid') }}
            </div>
          </div>
        </div>
        <div class="mb-3 row d-flex align-items-center">
          <label class="col-2 col-form-label">
            {{ Browser.I18n.getMessage('form_label_merge_conflict') }}
          </label>
          <div class="col-10 d-flex align-items-center">
            <div class="form-check-sm form-check-inline">
              <input
                class="form-check-input"
                type="radio"
                value="ignore"
                id="ignore"
                v-model="form.mergeMethod"
              />
              <label class="form-check-label ms-2" for="ignore">
                <span>
                  {{ Browser.I18n.getMessage('input_label_ignore') }}
                </span>
              </label>
            </div>
            <div class="form-check-sm form-check-inline">
              <input
                class="form-check-input"
                type="radio"
                value="keep"
                id="keep"
                v-model="form.mergeMethod"
              />
              <label class="form-check-label ms-2" for="keep">
                <span>
                  {{ Browser.I18n.getMessage('input_label_keep') }}
                </span>
              </label>
            </div>
          </div>
        </div>
        <div class="row mb-3 d-flex align-items-center">
          <label class="col-2 col-form-label">
            {{ Browser.I18n.getMessage('form_label_rule') }}
          </label>
          <div class="col-10 form-check-sm">
            <input
              class="form-check-input"
              type="checkbox"
              v-model="form.part.local"
              id="mergeLocal"
            />
            <label class="form-check-label ms-2 me-4" for="mergeLocal">
              <span>
                {{ Browser.I18n.getMessage('section_label_internal') }}
              </span>
            </label>
            <input
              class="form-check-input"
              type="checkbox"
              v-model="form.part.reject"
              id="mergeReject"
            />
            <label class="form-check-label ms-2" for="mergeReject">
              <span>
                {{ Browser.I18n.getMessage('section_label_reject') }}
              </span>
            </label>
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
