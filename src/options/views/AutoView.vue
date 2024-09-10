<script setup>
import { ref, inject, getCurrentInstance, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import draggable from 'vuedraggable'
import LinkTextItem from '../components/LinkTextItem.vue'
import ProxySelect from '@/components/ProxySelect.vue'
import RuleItem from '../components/InternalRuleGroup.vue'
import PopoverTips from '@/components/PopoverTips.vue'

import Browser from '@/Browser/main'
import { useStatusStore } from '@/options/stores/status'
import { saveForAuto } from '@/core/proxy_config.js'
import { generatePacfile } from '@/core/pacfile_generator.js'
import { getNextLocalVersion } from '@/core/version_control.js'
import { updateRulesSetData } from '@/core/proxy_config.js'

const handleUpdate = inject('handleUpdate')
const handleDelete = inject('handleDelete')
const showUploadConflictModal = inject('showUploadConflictModal')

const route = useRoute()
const storeStatus = useStatusStore()

const instance = getCurrentInstance()
const confirmModal = instance?.appContext.config.globalProperties.$confirm
const toast = instance?.appContext.config.globalProperties.$toast

const localRuleList = ref([])
const rejectRuleList = ref([])
const defaultProxy = ref('direct')
const focusText = ref('')
const localRulesSet = ref({
  url: '',
  urlUpdatedAt: '',
  data: '',
  proxy: 'direct',
  valid: true
})
const urlValid = ref({ reject: true, local: true })

const tagColor = ref('#3498db')
const rejectRulesSet = ref({
  url: '',
  urlUpdatedAt: '',
  data: '',
  valid: true
})
const occurrences = ref([])
const dragableDivider = {
  mode: 'divider',
  data: Browser.I18n.getMessage('input_label_divider'),
  proxy: 'direct'
}
const rejectRuleItem = {
  mode: 'domain',
  data: '',
  proxy: '+reject',
  valid: true
}
const localRuleItem = {
  mode: 'domain',
  data: '',
  proxy: 'direct',
  valid: true
}
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
  () => localRuleList,
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

  tagColor.value = result[proxyKey].tagColor
  defaultProxy.value = result[proxyKey].config.rules.defaultProxy

  localRulesSet.value.url = result[proxyKey].config.rules.local.rulesSet.url
  localRulesSet.value.urlUpdatedAt =
    result[proxyKey].config.rules.local.rulesSet.urlUpdatedAt
  localRulesSet.value.data = result[proxyKey].config.rules.local.rulesSet.data
  localRulesSet.value.proxy = result[proxyKey].config.rules.local.rulesSet.proxy
  localRulesSet.value.valid = result[proxyKey].config.rules.local.rulesSet.valid
  if (localRulesSet.value.valid == null) {
    localRulesSet.value.valid = true
  }

  rejectRulesSet.value.url = result[proxyKey].config.rules.reject.rulesSet.url
  rejectRulesSet.value.urlUpdatedAt =
    result[proxyKey].config.rules.reject.rulesSet.urlUpdatedAt
  rejectRulesSet.value.data = result[proxyKey].config.rules.reject.rulesSet.data
  rejectRulesSet.value.valid =
    result[proxyKey].config.rules.reject.rulesSet.valid
  if (rejectRulesSet.value.valid == null) {
    rejectRulesSet.value.valid = true
  }

  const tmpRuleList = JSON.parse(
    JSON.stringify(result[proxyKey].config.rules.local.ruleList)
  )
  for (const e of tmpRuleList) {
    if (e.valid == undefined) e.valid = true
    localRuleList.value.push(e)
  }

  const tmpRejectRuleList = JSON.parse(
    JSON.stringify(result[proxyKey].config.rules.reject.ruleList)
  )
  rejectRuleList.value = tmpRejectRuleList
}

async function handleExportPAC() {
  const res = await Browser.Storage.getLocalAll()
  console.info(res, 'proxy_' + encodeURIComponent(route.params.name))
  const codeBlock = generatePacfile(
    res,
    'proxy_' + encodeURIComponent(route.params.name)
  )
  const outBlock = codeBlock.replace(/^\s*[\r?\n]/gm, '')
  Browser.saveFile(outBlock, `${route.params.name}.pac`)
}

function resetData() {
  tagColor.value = '#3498db'
  localRuleList.value = []
  rejectRuleList.value = []
  defaultProxy.value = 'direct'
  localRulesSet.value = {
    url: '',
    urlUpdatedAt: '',
    data: '',
    proxy: 'direct',
    valid: true
  }
  rejectRulesSet.value = {
    url: '',
    urlUpdatedAt: '',
    data: '',
    valid: true
  }
}

function setFocusText(text) {
  focusText.value = text
}

function insertRule(index, target, obj = { divider: false, mode: 'local' }) {
  let tmp
  if (obj.divider) {
    tmp = JSON.parse(JSON.stringify(dragableDivider))
  } else {
    tmp = JSON.parse(
      JSON.stringify(obj.mode == 'reject' ? rejectRuleItem : localRuleItem)
    )
  }
  target.splice(index + 1, 0, tmp)
  storeStatus.setUnsaved()
}

function removeRule(index, target) {
  target.splice(index, 1)
  storeStatus.setUnsaved()
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
async function handleUpdateUrl(subject) {
  const key = 'proxy_' + encodeURIComponent(route.params.name)
  const allConfig = await Browser.Storage.getLocalAll()
  const updateProxyConfig = await updateRulesSetData(allConfig[key], [subject])
  if (JSON.stringify(updateProxyConfig) != '{}') {
    await Browser.Storage.setLocal({ [key]: updateProxyConfig })
    if (allConfig.status_proxyKey == key) {
      Browser.Proxy.set(allConfig, key, async () => {
        toast.info(Browser.I18n.getMessage('desc_proxy_update'))
      })
    }
    load(key)
  } else {
    urlValid.value[subject] = false
  }
}

async function handleSubmit() {
  const name = route.params.name
  const encodeName = encodeURIComponent(name)
  const key = 'proxy_' + encodeName
  const tmpObj = saveForAuto(
    encodeName,
    // tagColor.value,
    defaultProxy.value,
    localRuleList.value,
    rejectRuleList.value,
    localRulesSet.value,
    rejectRulesSet.value
  )
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    [key]: tmpObj,
    config_version: version,
    config_syncTime: new Date().getTime()
  })
  toast.info(`${name} ${Browser.I18n.getMessage('desc_save_success')}`)
  storeStatus.resetUnsaved()
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
      load('proxy_' + encodeURIComponent(route.params.name))
      storeStatus.resetUnsaved()
    }
  )
}

function setUnsaved() {
  storeStatus.setUnsaved()
}
</script>
<template>
  <div id="profileAuto">
    <div class="hstack gap-3 pb-4 mb-3">
      <div>
        <i
          class="bi bi-bookmark-fill cursor-point fs-4"
          :style="'color: ' + tagColor"
          @click="$refs.colorPicker.click()"
        ></i>
        <input ref="colorPicker" type="color" v-model="tagColor" />
      </div>
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
      <button class="btn btn-sm btn-outline-secondary" @click="handleExportPAC">
        <i class="bi bi-file-earmark-ppt-fill me-2"></i>
        <span>{{ Browser.I18n.getMessage('btn_label_export_pac') }}</span>
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
                  @click="insertRule(-1, localRuleList)"
                ></i>
              </div>
            </div>
            <div class="card-body">
              <div id="localRuleList">
                <draggable
                  :list="localRuleList"
                  :group="'shared'"
                  @end="setUnsaved"
                  handle=".drag-handle"
                  item-key="index"
                >
                  <template #item="{ element, index }">
                    <RuleItem
                      :key="index"
                      v-model="localRuleList[index]"
                      :class="inputClassName(element)"
                      @getFocusText="setFocusText(element.data)"
                      @clearFousText="setFocusText(null)"
                      @deleteItem="removeRule(index, localRuleList)"
                      @addItem="insertRule(index, localRuleList)"
                      @hrItem="
                        insertRule(index, localRuleList, { divider: true })
                      "
                    >
                      <ProxySelect
                        v-model="element.proxy"
                        style="width: 150px"
                      ></ProxySelect
                    ></RuleItem>
                  </template>
                </draggable>
              </div>
              <div>
                <div class="hstack gap-2 mb-2">
                  <span class="ms-auto">{{
                    Browser.I18n.getMessage('desc_external_rules')
                  }}</span>
                  <div>
                    <ProxySelect
                      style="width: 150px"
                      v-model="localRulesSet.proxy"
                    ></ProxySelect>
                  </div>
                  <i
                    class="bi bi-trash-fill icon-btn"
                    style="visibility: hidden"
                  ></i>
                  <i
                    class="bi bi-trash-fill icon-btn"
                    style="visibility: hidden"
                  ></i>
                  <i
                    class="bi bi-trash-fill icon-btn"
                    style="visibility: hidden"
                  ></i>
                </div>
              </div>
              <div>
                <div class="hstack gap-2">
                  <span class="ms-auto">{{
                    Browser.I18n.getMessage('desc_default')
                  }}</span>
                  <div>
                    <ProxySelect
                      style="width: 150px"
                      v-model="defaultProxy"
                    ></ProxySelect>
                  </div>
                  <i
                    class="bi bi-trash-fill icon-btn"
                    style="visibility: hidden"
                  ></i>
                  <i
                    class="bi bi-trash-fill icon-btn"
                    style="visibility: hidden"
                  ></i>
                  <i
                    class="bi bi-trash-fill icon-btn"
                    style="visibility: hidden"
                  ></i>
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
                :validTitle="Browser.I18n.getMessage('form_label_rule_valid')"
                :dataTitle="Browser.I18n.getMessage('form_label_rule_data')"
                @updateRulesSetData="handleUpdateUrl('local')"
                v-model:rulesSet="localRulesSet"
                v-model:isUrlValid="urlValid.local"
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
              <i
                class="bi bi-plus-circle-fill icon-btn ms-2"
                @click="insertRule(-1, rejectRuleList, { mode: 'reject' })"
              ></i>
            </div>
            <div class="card-body">
              <div id="rejectRuleList">
                <draggable
                  :list="rejectRuleList"
                  :group="'shared'"
                  @end="setUnsaved"
                  handle=".drag-handle"
                  item-key="index"
                >
                  <template #item="{ element, index }">
                    <RuleItem
                      :key="index"
                      v-model="rejectRuleList[index]"
                      :class="inputClassName(element)"
                      @getFocusText="setFocusText(element.data)"
                      @clearFousText="setFocusText(null)"
                      @deleteItem="removeRule(index, rejectRuleList)"
                      @addItem="
                        insertRule(index, rejectRuleList, { mode: 'reject' })
                      "
                      @hrItem="
                        insertRule(index, rejectRuleList, {
                          divider: true,
                          mode: 'reject'
                        })
                      "
                    ></RuleItem>
                  </template>
                </draggable>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header">
              <span class="fw-bold">{{
                Browser.I18n.getMessage('section_label_reject_set')
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
                :validTitle="Browser.I18n.getMessage('form_label_rule_valid')"
                :dataTitle="Browser.I18n.getMessage('form_label_rule_data')"
                @updateRulesSetData="handleUpdateUrl('reject')"
                v-model:rulesSet="rejectRulesSet"
                v-model:isUrlValid="urlValid.reject"
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
          :disabled="!storeStatus.isUnsaved"
        >
          <i class="bi bi-reply-fill me-2"></i>
          <span>{{ Browser.I18n.getMessage('btn_label_reset') }}</span>
        </button>
        <button
          class="btn btn-primary btn-sm"
          @click="handleSubmit"
          :disabled="!storeStatus.isUnsaved"
        >
          <i class="bi bi-floppy-fill me-2"></i>
          <span>{{ Browser.I18n.getMessage('btn_label_save') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
