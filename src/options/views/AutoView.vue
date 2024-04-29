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

const { isUnsaved, resetUnsaved, setUnsaved } = inject('isUnsaved')
const handleUpdate = inject('handleUpdate')
const handleDelete = inject('handleDelete')

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

  internalRules.value = JSON.parse(
    JSON.stringify(result[proxyKey].config.rules.internal)
  )
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
  const storeObj = {}
  storeObj[key] = tmpObj
  await Browser.Storage.setLocal(storeObj)
  toast.info(`保存代理（${name}）配置信息成功`)
  resetUnsaved()
  const result = await Browser.Storage.getLocalAll()
  if (result.status_proxyKey == key) {
    Browser.Proxy.set(result, key, async () => {
      await Browser.Storage.setLocal({ status_proxyKey: key })
      toast.info(`已生效更新的配置`)
    })
  }
}

function handleCancel() {
  confirmModal.createConfirm(
    '警告',
    '页面存在未保存的信息，是否取消修改？',
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
        {{ '自动策略：' + route.params.name }}
      </div>
      <button
        class="btn btn-sm btn-outline-danger ms-auto"
        @click="handleDelete"
      >
        <i class="bi bi-backspace-reverse me-2"></i>
        <span>删除配置</span>
      </button>
      <button class="btn btn-sm btn-outline-secondary" @click="handleUpdate">
        <i class="bi bi-pencil-square me-2"></i>
        <span>修改名称</span>
      </button>
    </div>
    <div>
      <div class="nav nav-tabs mb-2" id="v-pills-tab" role="tablist">
        <li class="nav-item">
          <a
            class="nav-link active"
            id="v-pills-default-tab"
            data-bs-toggle="pill"
            data-bs-target="#v-pills-default"
            role="tab"
            aria-controls="v-pills-default"
            aria-selected="true"
            >默认配置</a
          >
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            id="v-pills-advance-tab"
            data-bs-toggle="pill"
            data-bs-target="#v-pills-advance"
            role="tab"
            aria-controls="v-pills-advance"
            aria-selected="false"
            >高级配置</a
          >
        </li>
        <div class="ms-auto d-flex align-items-center">
          <PopoverTips
            className="bi bi-question-circle-fill icon-btn"
            content="规则优先级：本地规则 > 拒绝规则 > 外部规则 > 默认规则"
          ></PopoverTips>
        </div>
      </div>
      <div class="tab-content" id="v-pills-tabContent">
        <div
          class="tab-pane fade show active"
          id="v-pills-default"
          tabindex="0"
        >
          <div class="card">
            <div class="card-header hstack gap-4">
              <div class="fw-bold">
                <span>本地规则设置</span>
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
                  <span class="ms-auto">外部规则</span>
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
                  <span class="ms-auto">默认</span>
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
              <span class="fw-bold">外部规则设置</span>
              <PopoverTips
                className="bi bi-question-circle-fill icon-btn ms-2"
                content="仅支持autoProxy规则"
              ></PopoverTips>
            </div>
            <div class="card-body">
              <LinkTextItem
                urlTitle="规则地址"
                urlUpdatedAtTitle="URL更新时间"
                dataTitle="规则内容"
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
          tabindex="0"
        >
          <div class="card">
            <div class="card-header">
              <span class="fw-bold">拒绝规则设置</span>
              <PopoverTips
                className="bi bi-question-circle-fill icon-btn ms-1"
                content="仅支持autoProxy规则"
              ></PopoverTips>
            </div>
            <div class="card-body">
              <LinkTextItem
                urlTitle="拒绝规则地址"
                urlUpdatedAtTitle="URL更新时间"
                dataTitle="拒绝规则内容"
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
          <i class="bi bi-reply-fill me-1"></i>
          <span>恢 复</span>
        </button>
        <button
          class="btn btn-primary btn-sm"
          @click="handleSubmit"
          :disabled="!isUnsaved"
        >
          <i class="bi bi-floppy-fill me-1"></i>
          <span>保 存</span>
        </button>
      </div>
    </div>
  </div>
</template>
