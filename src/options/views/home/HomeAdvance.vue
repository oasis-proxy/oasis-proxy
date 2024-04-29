<script setup>
import { ref, watch, getCurrentInstance, onMounted } from 'vue'
import PopoverTips from '@/components/PopoverTips.vue'

import Browser from '@/Browser/chrome/chrome.js'
import { enrich, simplify } from '@/core/ConfigData'

const instance = getCurrentInstance()
const toast = instance?.appContext.config.globalProperties.$toast
const confirmModal = instance?.appContext.config.globalProperties.$confirm

const configMonitor = ref(false)
const localFixed = ref([])
const localPac = ref([])
const localAuto = ref([])
const syncFixed = ref([])
const syncPac = ref([])
const syncAuto = ref([])

onMounted(() => {
  reloadLocalData()
  reloadSyncData()
})

watch(configMonitor, async (newValue) => {
  await Browser.Storage.setLocal({ config_monitor: newValue })
})

async function reloadSyncData() {
  const result = await Browser.Storage.getSync(null)
  Object.keys(result).forEach((key) => {
    if (key.startsWith('proxy_')) {
      switch (result[key]?.mode) {
        case 'auto':
          syncAuto.value.push(decodeURIComponent(key.substring(6)))
          break
        case 'pac_script':
          syncPac.value.push(decodeURIComponent(key.substring(6)))
          break
        case 'fixed_servers':
          syncFixed.value.push(decodeURIComponent(key.substring(6)))
          break
        default:
          break
      }
    }
  })
}
async function reloadLocalData() {
  const result = await Browser.Storage.getLocalAll()
  if (result.config_monitor != null) {
    configMonitor.value = result.config_monitor
  }
  Object.keys(result).forEach((key) => {
    if (key.startsWith('proxy_')) {
      switch (result[key]?.mode) {
        case 'auto':
          localAuto.value.push(decodeURIComponent(key.substring(6)))
          break
        case 'pac_script':
          localPac.value.push(decodeURIComponent(key.substring(6)))
          break
        case 'fixed_servers':
          localFixed.value.push(decodeURIComponent(key.substring(6)))
          break
        default:
          break
      }
    }
  })
}
function handleSetLocal() {
  confirmModal.createConfirm(
    '警告',
    '确认使用远程配置覆盖本地配置？',
    async function () {
      const result = await Browser.Storage.getSync(null)
      const enrichConfig = await enrich(result)
      await Browser.Storage.setLocal(enrichConfig)
      toast.info('已同步配置到本地，2s后刷新配置页面')
      setTimeout(() => {
        location.reload()
      }, 2000)
    }
  )
}
function handleSetSync() {
  confirmModal.createConfirm(
    '警告',
    '确认使用本地配置覆盖远程配置？',
    async function () {
      const result = await Browser.Storage.getLocal(null)
      const sConfig = simplify(result)
      await Browser.Storage.setSync(sConfig)
      toast.info('已同步配置到远程')
      reloadSyncData()
    }
  )
}
</script>
<template>
  <div class="tab-pane fade show" id="v-pills-advance" tabindex="0">
    <div class="card">
      <div class="card-header">
        <span class="fw-bold">链接展示配置</span>
      </div>
      <div class="card-body">
        <div class="row mb-3 d-flex align-items-center">
          <label class="col-2 col-form-label-sm">
            <span>链接监控</span>
            <PopoverTips
              className="bi bi-question-circle-fill icon-btn ms-2"
              content="开启后会，对Tab标签的所有请求链接在popup按钮弹出页展示HOST和IP。"
            ></PopoverTips>
          </label>
          <div class="col-10">
            <div class="form-check-sm">
              <input
                class="form-check-input"
                type="checkbox"
                id="monitorCheck"
                v-model="configMonitor"
              />
              <label class="form-check-label ms-2" for="monitorCheck">
                <span>开 启</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="fw-bold">同步配置</span>
      </div>
      <div class="card-body">
        <div
          class="hstack gap-4 d-flex align-items-stretch justify-content-between"
        >
          <div class="card flex-grow-1" style="width: 1px">
            <div class="card-body border p-4 rounded">
              <p class="card-text fw-bold">本地数据</p>
              <p class="card-text" v-if="localFixed.length > 0">
                代理节点：{{ localFixed.join(', ') }}
              </p>
              <p class="card-text" v-if="localPac.length > 0">
                PAC策略：{{ localPac.join(', ') }}
              </p>
              <p class="card-text" v-if="localAuto.length > 0">
                自动策略：{{ localAuto.join(', ') }}
              </p>
            </div>
          </div>
          <div class="align-self-center flex-grow-0 flex-shrink-0">
            <div class="vstack gap-4">
              <div>
                <button class="btn btn-danger btn-sm" @click="handleSetLocal">
                  <i class="bi bi-skip-backward-fill me-2 fw-bold"></i>
                  <span>覆盖本地</span>
                </button>
              </div>
              <div>
                <button class="btn btn-danger btn-sm" @click="handleSetSync">
                  <span>覆盖远程</span>
                  <i class="bi bi-skip-forward-fill ms-2"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="card flex-grow-1" style="width: 1px">
            <div class="card-body border p-4 rounded">
              <p class="card-text fw-bold">云端数据</p>
              <p class="card-text" v-if="syncFixed.length > 0">
                代理节点：{{ syncFixed.join(', ') }}
              </p>
              <p class="card-text" v-if="syncPac.length > 0">
                PAC策略：{{ syncPac.join(', ') }}
              </p>
              <p class="card-text" v-if="syncAuto.length > 0">
                自动策略：{{ syncAuto.join(', ') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
