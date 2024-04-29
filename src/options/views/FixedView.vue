<script setup>
import { getCurrentInstance, inject, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import ServerInfoItem from '../components/ServerInfoItem.vue'

import Browser from '@/Browser/chrome/chrome.js'
import { saveForFixed, proxyUses } from '@/core/ProxyConfig'

const { isUnsaved, resetUnsaved } = inject('isUnsaved')
const handleUpdate = inject('handleUpdate')
const handleDelete = inject('handleDelete')

const route = useRoute()
const instance = getCurrentInstance()
const confirmModal = instance?.appContext.config.globalProperties.$confirm
const toast = instance?.appContext.config.globalProperties.$toast

const fallbackProxy = ref({
  scheme: 'direct',
  host: '',
  port: null,
  username: '',
  password: ''
})
const proxyForHttp = ref({
  scheme: 'default',
  host: '',
  port: null,
  username: '',
  password: ''
})
const proxyForHttps = ref({
  scheme: 'default',
  host: '',
  port: null,
  username: '',
  password: ''
})
const proxyForFtp = ref({
  scheme: 'default',
  host: '',
  port: null,
  username: '',
  password: ''
})
const bypassList = ref('')

onMounted(() => {
  load('proxy_' + encodeURIComponent(route.params.name))
})

watch(
  () => route.params.name,
  (newValue) => {
    load('proxy_' + encodeURIComponent(newValue))
  }
)
async function load(proxyKey) {
  resetData()
  const result = await Browser.Storage.getLocal([proxyKey])
  if (result[proxyKey]?.config.rules.singleProxy != null) {
    fallbackProxy.value = JSON.parse(
      JSON.stringify(result[proxyKey]?.config.rules.singleProxy)
    )
  } else {
    if (result[proxyKey]?.config.rules.fallbackProxy != null) {
      fallbackProxy.value = JSON.parse(
        JSON.stringify(result[proxyKey]?.config.rules.fallbackProxy)
      )
    }
    if (result[proxyKey]?.config.rules.proxyForHttp != null) {
      proxyForHttp.value = JSON.parse(
        JSON.stringify(result[proxyKey]?.config.rules.proxyForHttp)
      )
    }
    if (result[proxyKey]?.config.rules.proxyForHttps != null) {
      proxyForHttps.value = JSON.parse(
        JSON.stringify(result[proxyKey]?.config.rules.proxyForHttps)
      )
    }
    if (result[proxyKey]?.config.rules.proxyForFtp != null) {
      proxyForFtp.value = JSON.parse(
        JSON.stringify(result[proxyKey]?.config.rules.proxyForFtp)
      )
    }
  }
  if (result[proxyKey]?.config.rules.bypassList != null) {
    bypassList.value = result[proxyKey]?.config.rules.bypassList.join('\n')
  }
}

function resetData() {
  fallbackProxy.value = {
    scheme: 'direct',
    host: '',
    port: null,
    username: '',
    password: ''
  }
  proxyForHttp.value = {
    scheme: 'default',
    host: '',
    port: null,
    username: '',
    password: ''
  }
  proxyForHttps.value = {
    scheme: 'default',
    host: '',
    port: null,
    username: '',
    password: ''
  }
  proxyForFtp.value = {
    scheme: 'default',
    host: '',
    port: null,
    username: '',
    password: ''
  }
  bypassList.value = ''
}

async function handleSubmit() {
  const name = route.params.name
  const encodeName = encodeURIComponent(name)
  const key = 'proxy_' + encodeName
  const tmpObj = saveForFixed(
    encodeName,
    fallbackProxy.value,
    proxyForHttp.value,
    proxyForHttps.value,
    proxyForFtp.value,
    bypassList.value
  )
  const storeObj = {}
  storeObj[key] = tmpObj
  await Browser.Storage.setLocal(storeObj)
  toast.info(`保存代理（${name}）配置信息成功`)
  resetUnsaved()
  const result = await Browser.Storage.getLocal(null)
  if (result.status_proxyKey == key) {
    Browser.Proxy.set(result, key, async () => {
      await Browser.Storage.setLocal({ status_proxyKey: key })
      toast.info(`已生效更新的配置`)
    })
  } else {
    const uniqNames = proxyUses(result[result.status_proxyKey])
    if (uniqNames.includes(encodeName)) {
      Browser.Proxy.set(result, result.status_proxyKey, async () => {
        toast.info(`已生效更新的配置`)
      })
    }
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
  <div id="profile_fixed">
    <div class="hstack gap-3 pb-4 mb-3">
      <div class="fs-5 fw-bold text-truncate">
        {{ '代理节点：' + route.params.name }}
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
    <div class="container ps-0 pe-0">
      <div class="">
        <div class="nav nav-tabs mb-2" id="v-pills-tab" role="tablist">
          <li class="nav-item">
            <a
              class="nav-link active"
              id="v-pills-default-tab"
              s
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
        </div>
        <div class="tab-content" id="v-pills-tabContent">
          <div
            class="tab-pane fade show active"
            id="v-pills-default"
            tabindex="0"
          >
            <ServerInfoItem
              groupLabel="默认代理"
              :main="true"
              v-model:proxyInfo="fallbackProxy"
            ></ServerInfoItem>
            <div class="card">
              <div class="card-header">
                <span class="fw-bold">代理绕过地址列表</span>
              </div>
              <div class="card-body">
                <textarea
                  class="form-control form-control-sm"
                  v-model="bypassList"
                  rows="10"
                ></textarea>
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
            <ServerInfoItem
              groupLabel="HTTP代理"
              v-model:proxyInfo="proxyForHttp"
            ></ServerInfoItem>
            <ServerInfoItem
              groupLabel="HTTPS代理"
              v-model:proxyInfo="proxyForHttps"
            ></ServerInfoItem>
            <ServerInfoItem
              groupLabel="FTP代理"
              v-model:proxyInfo="proxyForFtp"
            ></ServerInfoItem>
          </div>
        </div>
      </div>
      <div class="hstack gap-3">
        <button
          class="btn btn-outline-secondary btn-sm ms-auto"
          @click="handleCancel"
          :disabled="!isUnsaved"
        >
          <i class="bi bi-reply-fill me-2"></i>
          <span>恢 复</span>
        </button>
        <button
          class="btn btn-primary btn-sm"
          @click="handleSubmit"
          :disabled="!isUnsaved"
        >
          <i class="bi bi-floppy-fill me-2"></i>
          <span>保 存</span>
        </button>
      </div>
    </div>
  </div>
</template>
