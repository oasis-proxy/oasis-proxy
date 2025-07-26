<script setup>
import { defineModel, computed } from 'vue'

import { downloadUrl } from '@/core/utils'
import Browser from '@/Browser/main'
import { useStatusStore } from '@/options/stores/status'

const isDebug = import.meta.env.VITE_APP_DEBUG == 'debug'
const rulesSet = defineModel('rulesSet', {
  type: Object,
  default: () => {
    return {
      format: null,
      url: 'default',
      data: '',
      updateInterval: 'default',
      urlUpdatedAt: null,
      valid: true
    }
  }
})
const isUrlValid = defineModel('isUrlValid', {
  type: Boolean,
  default: true
})
const storeStatus = useStatusStore()
const emit = defineEmits(['updateRulesSetData'])

defineProps({
  urlTitle: String,
  validTitle: String,
  urlUpdatedAtTitle: String,
  dataTitle: String
})

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
  if (!storeStatus.isUnsaved) {
    return
  }
  console.log('updateData', rulesSet.value)
  isUrlValid.value = true
  if (rulesSet.value.url == '') {
    rulesSet.value.urlUpdatedAt = ''
    rulesSet.value.data = ''
    return
  }
  const response = await downloadUrl(rulesSet.value.url, rulesSet.value.format)
  if (JSON.stringify(response) != '{}') {
    rulesSet.value.data = response.data
    rulesSet.value.urlUpdatedAt = response.updated
  } else {
    rulesSet.value.urlUpdatedAt = ''
    rulesSet.value.data = ''
    isUrlValid.value = false
  }
}

async function handleClickUpdate() {
  if (storeStatus.isUnsaved) {
    updateData()
  } else {
    emit('updateRulesSetData')
  }
}
</script>
<template>
  <div>
    <div class="mb-3 row d-flex align-items-center">
      <label class="col-2 col-form-label">{{ urlTitle }}</label>
      <div class="col-10">
        <div :class="urlInputClass">
          <select
            v-if="rulesSet.format != null"
            v-model="rulesSet.format"
            @change="updateData"
            class="form-select form-select-sm"
            style="width: 100px; flex: 0 0 auto"
          >
            <option value="base64">Base64</option>
            <option value="raw">Raw</option>
          </select>
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
      v-if="rulesSet.valid != null"
    >
      <label class="col-2 col-form-label">{{ validTitle }}</label>
      <div class="col-10">
        <div class="form-check form-switch ms-2 mt-1">
          <input
            class="form-check-input form-check-input"
            type="checkbox"
            role="switch"
            v-model="rulesSet.valid"
            checked
          />
          <span>{{
            rulesSet.valid == false
              ? Browser.I18n.getMessage('input_label_off')
              : Browser.I18n.getMessage('input_label_on')
          }}</span>
        </div>
      </div>
    </div>
    <div
      class="mb-3 row d-flex align-items-center"
      v-if="rulesSet.urlUpdatedAt != ''"
    >
      <label class="col-2 col-form-label">{{ urlUpdatedAtTitle }}</label>
      <div class="col-2">
        <select
          v-model="rulesSet.updateInterval"
          class="form-select form-select-sm"
        >
          <option value="default">
            {{ Browser.I18n.getMessage('input_selection_by_system') }}
          </option>
          <option value="24h">
            {{ Browser.I18n.getMessage('input_selection_24h') }}
          </option>
          <option value="12h">
            {{ Browser.I18n.getMessage('input_selection_12h') }}
          </option>
          <option value="6h">
            {{ Browser.I18n.getMessage('input_selection_6h') }}
          </option>
          <option value="3h">
            {{ Browser.I18n.getMessage('input_selection_3h') }}
          </option>
          <option value="1h">
            {{ Browser.I18n.getMessage('input_selection_1h') }}
          </option>
          <option value="15m">
            {{ Browser.I18n.getMessage('input_selection_15m') }}
          </option>
          <option value="1m" v-if="isDebug">
            {{ Browser.I18n.getMessage('input_selection_1m') }}
          </option>
          <option value="disabled">
            {{ Browser.I18n.getMessage('input_selection_disabled') }}
          </option>
        </select>
      </div>
      <div class="col-4">
        <span>{{
          '(' + urlUpdatedAtTitle + ' ' + rulesSet.urlUpdatedAt + ')'
        }}</span>
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
