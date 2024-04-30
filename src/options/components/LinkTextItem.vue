<script setup>
import { defineModel, computed, ref } from 'vue'

import { downloadUrl } from '@/core/ConfigData.js'
import Browser from '@/Browser/chrome/chrome'

const externalItem = defineModel('externalItem', {
  type: Object,
  default: () => {
    return {
      scheme: 'default',
      host: '',
      port: null,
      username: '',
      password: ''
    }
  }
})

defineProps({
  urlTitle: String,
  urlUpdatedAtTitle: String,
  dataTitle: String
})

const isUrlValid = ref(true)

const dataInputDisabled = computed(() => {
  return externalItem.value.url != ''
})

const urlInputDisabled = computed(() => {
  return externalItem.value.data != '' && externalItem.value.url == ''
})

const urlInputClass = computed(() => {
  return isUrlValid.value ? 'input-group' : 'input-group is-invalid'
})

function updateData() {
  console.log('updateData', externalItem.value)
  isUrlValid.value = true
  if (externalItem.value.url == '') {
    externalItem.value.urlUpdatedAt = ''
    externalItem.value.data = ''
    return
  }
  downloadUrl(externalItem.value.url, 'base64')
    .then((obj) => {
      externalItem.value.data = obj.data
      externalItem.value.urlUpdatedAt = obj.updated
    })
    .catch(() => {
      externalItem.value.urlUpdatedAt = ''
      externalItem.value.data = ''
      isUrlValid.value = false
    })
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
            v-model="externalItem.url"
            @blur="updateData"
            :disabled="urlInputDisabled"
          />
          <button
            class="btn-sm btn btn-outline-secondary btn-custom-group"
            @click="updateData"
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
      v-if="externalItem.urlUpdatedAt != ''"
    >
      <label class="col-2 col-form-label">{{ urlUpdatedAtTitle }}</label>
      <div class="col-10">
        <span>{{ externalItem.urlUpdatedAt }}</span>
      </div>
    </div>
    <div class="mb-3 row d-flex align-items-top">
      <label class="col-2 col-form-label">{{ dataTitle }}</label>
      <div class="col-10">
        <textarea
          class="form-control form-control-sm"
          rows="10"
          v-model="externalItem.data"
          :disabled="dataInputDisabled"
        ></textarea>
      </div>
    </div>
  </div>
</template>
