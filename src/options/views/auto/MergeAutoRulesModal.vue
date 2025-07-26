<script setup>
import { computed, ref, onMounted, inject } from 'vue'
import { useRoute } from 'vue-router'
import ModalBase from '@/components/modal/ModalBase.vue'

import Browser from '@/Browser/main'
import { useStatusStore } from '@/options/stores/status'

const route = useRoute()
const storeStatus = useStatusStore()

const { localRuleList, rejectRuleList, siteRuleList } = inject('autoConfig')

const autoPolicyNames = ref([])
const selectedProxyKey = ref(null)
const isLocalChecked = ref(true)
const isRejectChecked = ref(true)
const isSiteChecked = ref(true)
const mergeMethod = ref('ignore')
const isNameValid = ref(true)

const nameClass = computed(() => {
  return isNameValid.value
    ? 'form-select form-select-sm'
    : 'form-select form-select-sm is-invalid'
})

let mergeAutoRulesModalInstance = null

onMounted(async () => {
  const modalElement = document.getElementById('mergeAutoRulesModal')
  mergeAutoRulesModalInstance = new bootstrap.Modal(modalElement)
})

defineExpose({
  show,
  hide
})

function hide() {
  setTimeout(() => {
    selectedProxyKey.value = null
    isLocalChecked.value = true
    isRejectChecked.value = true
    isSiteChecked.value = true
    mergeMethod.value = 'ignore'
    isNameValid.value = true
  }, 300)
  mergeAutoRulesModalInstance.hide()
}
async function show() {
  const result = await Browser.Storage.getLocalAll()
  autoPolicyNames.value = []
  Object.keys(result).forEach((key) => {
    if (
      key.startsWith('proxy_') &&
      result[key].mode == 'auto' &&
      'proxy_' + encodeURIComponent(route.params.name) != key
    ) {
      autoPolicyNames.value.push(result[key].name)
    }
  })
  mergeAutoRulesModalInstance.show()
}

function handleCancel() {
  hide()
}

async function handleSubmit() {
  isNameValid.value = true
  if (selectedProxyKey.value == null) {
    isNameValid.value = false
    return
  }
  const result = await Browser.Storage.getLocal(selectedProxyKey.value)
  if (isLocalChecked.value) {
    let localRules = result[selectedProxyKey.value].config.rules.local.ruleList
    if (mergeMethod.value != 'keep') {
      localRules = localRules.filter((item) => {
        let isContained = false
        for (const i of localRuleList.value) {
          if (i.mode == item.mode && i.data == item.data) {
            isContained = true
          }
        }
        return !isContained
      })
    }
    localRuleList.value.unshift(...localRules)
  }
  if (isRejectChecked.value) {
    let rejectRules =
      result[selectedProxyKey.value].config.rules.reject.ruleList
    if (mergeMethod.value != 'keep') {
      rejectRules = rejectRules.filter((item) => {
        let isContained = false
        for (const i of rejectRuleList.value) {
          if (i.data == item.data) {
            isContained = true
          }
        }
        return !isContained
      })
    }
    rejectRuleList.value.unshift(...rejectRules)
  }
  if (isSiteChecked.value) {
    let siteRules = result[selectedProxyKey.value].config.rules.site.ruleList
    if (mergeMethod.value != 'keep') {
      siteRules = siteRules.filter((item) => {
        let isContained = false
        for (const i of siteRuleList.value) {
          if (i.data == item.data) {
            isContained = true
          }
        }
        return !isContained
      })
    }
    siteRuleList.value.unshift(...siteRules)
  }
  storeStatus.setUnsaved()
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
            <select :class="nameClass" v-model="selectedProxyKey">
              <option
                :value="'proxy_' + item"
                v-for="(item, index) in autoPolicyNames"
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
                v-model="mergeMethod"
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
                v-model="mergeMethod"
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
              v-model="isLocalChecked"
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
              v-model="isRejectChecked"
              id="mergeReject"
            />
            <label class="form-check-label ms-2 me-4" for="mergeReject">
              <span>
                {{ Browser.I18n.getMessage('section_label_reject') }}
              </span> </label
            ><input
              class="form-check-input"
              type="checkbox"
              v-model="isSiteChecked"
              id="mergeSite"
            />
            <label class="form-check-label ms-2" for="mergeSite">
              <span>
                {{ Browser.I18n.getMessage('section_label_site') }}
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
