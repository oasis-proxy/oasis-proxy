<script setup>
import { defineModel, computed, ref } from 'vue'

import { downloadUrl } from '@/core/utils'
import Browser from '@/Browser/main'
import { useStatusStore } from '@/options/stores/status'

const rulesSet = defineModel('rulesSet', {
  type: Object,
  default: () => {
    return {
      url: 'default',
      data: '',
      urlUpdatedAt: null,
      valid: true
    }
  }
})
const storeStatus = useStatusStore()
const emit = defineEmits(['updateRulesSetData'])

defineProps({
  urlTitle: String,
  urlUpdatedAtTitle: String,
  dataTitle: String
})

const isUrlValid = ref(true)

const dataInputDisabled = computed(() => {
  return rulesSet.value.url != ''
})

const urlInputDisabled = computed(() => {
  return rulesSet.value.data != '' && rulesSet.value.url == ''
})

const urlInputClass = computed(() => {
  return isUrlValid.value ? 'input-group' : 'input-group is-invalid'
})

async function updateData() {
  console.log('updateData', rulesSet.value)
  isUrlValid.value = true
  if (rulesSet.value.url == '') {
    rulesSet.value.urlUpdatedAt = ''
    rulesSet.value.data = ''
    return
  }
  try {
    const response = await downloadUrl(rulesSet.value.url, 'base64')
    rulesSet.value.data = response.data
    rulesSet.value.urlUpdatedAt = response.updated
  } catch (err) {
    console.error(err)
    rulesSet.value.urlUpdatedAt = ''
    rulesSet.value.data = ''
    isUrlValid.value = false
  }
}

async function handleClickUpdate() {
  if (!storeStatus.isUnsaved) {
    emit('updateRulesSetData')
  } else {
    updateData()
  }
}
</script>
<template>
  <div>
    <div class="mb-3 row d-flex align-items-center">
      <label class="col-2 col-form-label">{{ urlTitle }}</label>
      <div class="col-10">
        <div :class="urlInputClass">
          <input
            type="text"
            class="form-control form-control-sm"
            v-model="rulesSet.url"
            @blur="updateData"
            :disabled="urlInputDisabled"
          />
          <button
            class="btn-sm btn btn-outline-secondary btn-custom-group"
            @click="handleClickUpdate"
          >
            <i class="bi bi-arrow-counterclockwise"></i>
          </button>
        </div>
        <div class="invalid-feedback">
          {{ Browser.I18n.getMessage('feedback_request_failed') }}
        </div>
      </div>
    </div>
    <div
      class="mb-3 row d-flex align-items-center"
      v-if="rulesSet.urlUpdatedAt != ''"
    >
      <label class="col-2 col-form-label">{{ urlUpdatedAtTitle }}</label>
      <div class="col-10">
        <span>{{ rulesSet.urlUpdatedAt }}</span>
      </div>
    </div>
    <div class="mb-3 row d-flex align-items-top">
      <label class="col-2 col-form-label">{{ dataTitle }}</label>
      <div class="col-10 py-1">
        <textarea
          class="form-control form-control-sm"
          rows="10"
          v-model="rulesSet.data"
          :disabled="dataInputDisabled"
        ></textarea>
      </div>
    </div>
  </div>
</template>
