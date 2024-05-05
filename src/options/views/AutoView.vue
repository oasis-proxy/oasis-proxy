<script setup>
import { ref, inject, getCurrentInstance, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import LinkTextItem from '../components/LinkTextItem.vue'
import ProxySelect from '@/components/ProxySelect.vue'
import InternalRuleGroup from '../components/InternalRuleGroup.vue'
import PopoverTips from '@/components/PopoverTips.vue'

import Browser from '@/Browser/chrome/chrome.js'
import { saveForAuto } from '@/core/ProxyConfig'
import { getNextLocalVersion } from '@/core/VersionControl'

const { isUnsaved, resetUnsaved, setUnsaved } = inject('isUnsaved')
const handleUpdate = inject('handleUpdate')
const handleDelete = inject('handleDelete')
const showUploadConflictModal = inject('showUploadConflictModal')

const route = useRoute()

const instance = getCurrentInstance()
const confirmModal = instance?.appContext.config.globalProperties.$confirm
const toast = instance?.appContext.config.globalProperties.$toast

const internalRules = ref([])
const externalProxy = ref('direct')
const defaultProxy = ref('direct')
const focusText = ref('')
const externalRule = ref({
  url: '',
  urlUpdatedAt: '',
  data: ''
})

const rejectRule = ref({
  url: '',
  urlUpdatedAt: '',
  data: ''
})
const occurrences = ref([])

onMounted(() => {
  load('proxy_' + encodeURIComponent(route.params.name))
})

watch(
  () => route.params.name,
  (newValue) => {
    load('proxy_' + encodeURIComponent(newValue))
  }
)
watch(
  () => internalRules,
  (newValue) => {
    const countOccurrences = (array) => {
      return array.reduce((accumulator, currentValue) => {
        accumulator[currentValue.data] =
          (accumulator[currentValue.data] || 0) + 1
        return accumulator
      }, {})
    }
    occurrences.value = countOccurrences(newValue.value)
  },
  { deep: true }
)
async function load(proxyKey) {
  resetData()
  const result = await Browser.Storage.getLocal([proxyKey])
  defaultProxy.value = result[proxyKey].config.rules.defaultProxy
  externalProxy.value = result[proxyKey].config.rules.external.proxy

  externalRule.value.url = result[proxyKey].config.rules.external.url
  externalRule.value.urlUpdatedAt =
    result[proxyKey].config.rules.external.urlUpdatedAt
  externalRule.value.data = result[proxyKey].config.rules.external.data

  rejectRule.value.url = result[proxyKey].config.rules.reject.url
  rejectRule.value.urlUpdatedAt =
    result[proxyKey].config.rules.reject.urlUpdatedAt
  rejectRule.value.data = result[proxyKey].config.rules.reject.data

  const tmpInternalRules = JSON.parse(
    JSON.stringify(result[proxyKey].config.rules.internal)
  )
  for (const e of tmpInternalRules) {
    if (e.valid == undefined) e.valid = true
    internalRules.value.push(e)
  }
  console.log(internalRules.value)
}

function resetData() {
  internalRules.value = []
  externalProxy.value = 'direct'
  defaultProxy.value = 'direct'
  externalRule.value = {
    url: '',
    urlUpdatedAt: '',
    data: ''
  }

  rejectRule.value = {
    url: '',
    urlUpdatedAt: '',
    data: ''
  }
}
function setFocusText(text) {
  focusText.value = text
}
function addInternalRule() {
  internalRules.value.push({ mode: 'domain', data: '', proxy: 'direct' })
}

function removeInternalRule(index) {
  internalRules.value.splice(index, 1)
  setUnsaved()
}
function inputClassName(item) {
  if (item.data == '') return
  let name = []
  if (occurrences.value[item.data] > 1) {
    name.push('border-warning')
    if (focusText.value == item.data) {
      name.push('background-info')
    }
  }
  return name.join(' ')
}
async function handleSubmit() {
  const name = route.params.name
  const encodeName = encodeURIComponent(name)
  const key = 'proxy_' + encodeName
  const tmpObj = saveForAuto(
    encodeName,
    defaultProxy.value,
    internalRules.value,
    externalProxy.value,
    externalRule.value,
    rejectRule.value
  )
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    [key]: tmpObj,
    config_version: version
  })
  toast.info(`${name} ${Browser.I18n.getMessage('desc_save_success')}`)
  resetUnsaved()
  const result = await Browser.Storage.getLocalAll()
  if (result.status_proxyKey == key) {
    Browser.Proxy.set(result, key, async () => {
      await Browser.Storage.setLocal({ status_proxyKey: key })
      toast.info(Browser.I18n.getMessage('desc_proxy_update'))
    })
  }
  showUploadConflictModal()
}

function handleCancel() {
  confirmModal.createConfirm(
    Browser.I18n.getMessage('modal_title_warning'),
    Browser.I18n.getMessage('modal_desc_reset'),
    function () {
      load('proxy_' + route.params.name)
      resetUnsaved()
    }
  )
}
</script>
<template>
  <div id="profileAuto">
    <div class="hstack gap-3 pb-4 mb-3">
      <div class="fs-5 fw-bold text-truncate" id="title">
        {{ Browser.I18n.getMessage('page_title_auto') + route.params.name }}
      </div>
      <button
        class="btn btn-sm btn-outline-danger ms-auto"
        @click="handleDelete"
      >
        <i class="bi bi-backspace-reverse me-2"></i>
        <span>{{ Browser.I18n.getMessage('btn_label_delete_config') }}</span>
      </button>
      <button class="btn btn-sm btn-outline-secondary" @click="handleUpdate">
        <i class="bi bi-pencil-square me-2"></i>
        <span>{{
          Browser.I18n.getMessage('btn_label_update_name_config')
        }}</span>
      </button>
    </div>
    <div>
      <div class="nav nav-tabs mb-2" id="v-pills-tab" role="tablist">
        <button
          class="nav-link active"
          id="v-pills-default-tab"
          data-bs-toggle="pill"
          data-bs-target="#v-pills-default"
          role="tab"
          aria-controls="v-pills-default"
          aria-selected="true"
        >
          {{ Browser.I18n.getMessage('tab_label_default') }}
        </button>
        <button
          class="nav-link"
          id="v-pills-advance-tab"
          data-bs-toggle="pill"
          data-bs-target="#v-pills-advance"
          role="tab"
          aria-controls="v-pills-advance"
          aria-selected="false"
        >
          {{ Browser.I18n.getMessage('tab_label_advance') }}
        </button>
        <div class="ms-auto d-flex align-items-center">
          <PopoverTips
            className="bi bi-question-circle-fill icon-btn"
            :content="Browser.I18n.getMessage('popover_priority')"
          ></PopoverTips>
        </div>
      </div>
      <div class="tab-content" id="v-pills-tabContent">
        <div class="tab-pane fade show active" id="v-pills-default">
          <div class="card">
            <div class="card-header hstack gap-4">
              <div class="fw-bold">
                <span>{{
                  Browser.I18n.getMessage('section_label_internal')
                }}</span>
                <i
                  class="bi bi-plus-circle-fill icon-btn ms-2"
                  @click="addInternalRule"
                ></i>
              </div>
            </div>
            <div class="card-body">
              <div id="internalRules">
                <draggable
                  :list="internalRules"
                  @end="setUnsaved"
                  handle=".drag-handle"
                  item-key="index"
                >
                  <template #item="{ element, index }">
                    <InternalRuleGroup
                      :key="index"
                      v-model="internalRules[index]"
                      :class="inputClassName(element)"
                      @getFocusText="setFocusText(element.data)"
                      @clearFousText="setFocusText(null)"
                      @deleteItem="removeInternalRule(index)"
                    ></InternalRuleGroup>
                  </template>
                </draggable>
              </div>
              <div>
                <div class="hstack gap-4 mb-2">
                  <span class="ms-auto">{{
                    Browser.I18n.getMessage('desc_external_rules')
                  }}</span>
                  <div>
                    <ProxySelect
                      style="width: 150px"
                      v-model="externalProxy"
                    ></ProxySelect>
                  </div>
                  <div class="hstack gap-1" style="visibility: hidden">
                    <i class="bi bi-trash-fill icon-btn"></i>
                  </div>
                </div>
              </div>
              <div>
                <div class="hstack gap-4">
                  <span class="ms-auto">{{
                    Browser.I18n.getMessage('desc_default')
                  }}</span>
                  <div>
                    <ProxySelect
                      style="width: 150px"
                      v-model="defaultProxy"
                    ></ProxySelect>
                  </div>
                  <div class="hstack gap-1" style="visibility: hidden">
                    <i class="bi bi-trash-fill icon-btn"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header">
              <span class="fw-bold">{{
                Browser.I18n.getMessage('section_label_external')
              }}</span>
              <PopoverTips
                className="bi bi-question-circle-fill icon-btn ms-2"
                :content="
                  Browser.I18n.getMessage('popover_external_rules_format')
                "
              ></PopoverTips>
            </div>
            <div class="card-body">
              <LinkTextItem
                :urlTitle="Browser.I18n.getMessage('form_label_rule_url')"
                :urlUpdatedAtTitle="
                  Browser.I18n.getMessage('form_label_update_date')
                "
                :dataTitle="Browser.I18n.getMessage('form_label_rule_data')"
                v-model:externalItem="externalRule"
              ></LinkTextItem>
            </div>
          </div>
        </div>
        <div
          class="tab-pane fade"
          id="v-pills-advance"
          role="tabpanel"
          aria-labelledby="v-pills-advance-tab"
        >
          <div class="card">
            <div class="card-header">
              <span class="fw-bold">{{
                Browser.I18n.getMessage('section_label_reject')
              }}</span>
              <PopoverTips
                className="bi bi-question-circle-fill icon-btn ms-1"
                :content="
                  Browser.I18n.getMessage('popover_external_rules_format')
                "
              ></PopoverTips>
            </div>
            <div class="card-body">
              <LinkTextItem
                :urlTitle="Browser.I18n.getMessage('form_label_rule_url')"
                :urlUpdatedAtTitle="
                  Browser.I18n.getMessage('form_label_update_date')
                "
                :dataTitle="Browser.I18n.getMessage('form_label_rule_data')"
                v-model:externalItem="rejectRule"
              ></LinkTextItem>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div>
      <div class="hstack gap-3">
        <button
          class="btn btn-outline-secondary btn-sm ms-auto"
          @click="handleCancel"
          :disabled="!isUnsaved"
        >
          <i class="bi bi-reply-fill me-2"></i>
          <span>{{ Browser.I18n.getMessage('btn_label_reset') }}</span>
        </button>
        <button
          class="btn btn-primary btn-sm"
          @click="handleSubmit"
          :disabled="!isUnsaved"
        >
          <i class="bi bi-floppy-fill me-2"></i>
          <span>{{ Browser.I18n.getMessage('btn_label_save') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
