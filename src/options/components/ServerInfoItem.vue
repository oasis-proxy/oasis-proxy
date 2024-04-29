<script setup>
import { defineModel, computed, watch } from 'vue'
import PopoverTips from '@/components/PopoverTips.vue'

defineProps({
  groupLabel: String,
  main: { type: Boolean, default: false }
})

const proxyInfo = defineModel('proxyInfo', {
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

watch(
  proxyInfo,
  (newValue) => {
    if (newValue.scheme == 'default' || newValue.scheme == 'direct') {
      newValue.host = ''
      newValue.port = null
      newValue.username = ''
      newValue.password = ''
    }
  },
  { deep: true }
)

const inputDisabled = computed(() => {
  return (
    proxyInfo.value.scheme == 'default' || proxyInfo.value.scheme == 'direct'
  )
})
</script>
<template>
  <div class="card">
    <div class="card-header">
      <span class="fw-bold">{{ groupLabel }}</span>
    </div>
    <div class="card-body">
      <div>
        <div class="mb-2 row">
          <label class="col-2 col-form-label-sm">代理协议</label>
          <div class="col-4">
            <select
              class="form-select form-select-sm"
              v-model="proxyInfo.scheme"
              tabindex="1"
            >
              <option value="direct" v-if="main">直连</option>
              <option value="default" v-else>同默认</option>
              <option value="http">http</option>
              <option value="https">https</option>
              <option value="socks4">socks4</option>
              <option value="socks5">socks5</option>
            </select>
          </div>
          <label class="col-2 col-form-label-sm">
            认证用户名
            <PopoverTips
              className="bi bi-question-circle-fill icon-btn ms-1"
              content="非必要，根据代理需求填写"
            ></PopoverTips
          ></label>
          <div class="col-4">
            <input
              type="text"
              class="form-control form-control-sm"
              v-model="proxyInfo.username"
              placeholder="请输入认证用户名"
              aria-label="username"
              :disabled="inputDisabled"
              tabindex="4"
            />
          </div>
        </div>
        <div class="mb-2 row">
          <label class="col-2 col-form-label-sm">代理节点</label>
          <div class="col-4">
            <input
              type="text"
              class="form-control form-control-sm"
              v-model="proxyInfo.host"
              placeholder="请输入主机名/IP"
              aria-label="host"
              :disabled="inputDisabled"
              tabindex="2"
            />
          </div>
          <label class="col-2 col-form-label-sm">认证密码</label>
          <div class="col-4">
            <input
              type="password"
              class="form-control form-control-sm"
              v-model="proxyInfo.password"
              placeholder="请输入认证密码"
              aria-label="password"
              :disabled="inputDisabled"
              tabindex="5"
            />
          </div>
        </div>
        <div class="mb-2 row">
          <label class="col-2 col-form-label-sm">代理端口</label>
          <div class="col-4">
            <input
              type="number"
              class="form-control form-control-sm"
              v-model="proxyInfo.port"
              placeholder="请输入端口 1-65535"
              aria-label="port"
              :disabled="inputDisabled"
              tabindex="3"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
