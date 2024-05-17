<script setup>
import { defineModel, computed, watch } from 'vue'
import PopoverTips from '@/components/PopoverTips.vue'
import Browser from '@/Browser/main'
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
        <div class="mb-2 row d-flex align-items-center">
          <label class="col-2 col-form-label">
            {{ Browser.I18n.getMessage('form_label_scheme') }}</label
          >
          <div class="col-4">
            <select
              class="form-select form-select-sm"
              v-model="proxyInfo.scheme"
            >
              <option value="direct" v-if="main">
                {{ Browser.I18n.getMessage('input_label_direct') }}
              </option>
              <option value="default" v-else>
                {{ Browser.I18n.getMessage('input_label_default') }}
              </option>
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="socks4">SOCKS4</option>
              <option value="socks5">SOCKS5</option>
            </select>
          </div>
          <label class="col-2 col-form-label">
            {{ Browser.I18n.getMessage('form_label_username') }}
            <PopoverTips
              className="bi bi-question-circle-fill icon-btn ms-1"
              :content="Browser.I18n.getMessage('popover_auth')"
            ></PopoverTips
          ></label>
          <div class="col-4">
            <input
              type="text"
              class="form-control form-control-sm"
              v-model="proxyInfo.username"
              :disabled="inputDisabled"
            />
          </div>
        </div>
        <div class="mb-2 row d-flex align-items-center">
          <label class="col-2 col-form-label">{{
            Browser.I18n.getMessage('form_label_host')
          }}</label>
          <div class="col-4">
            <input
              type="text"
              class="form-control form-control-sm"
              v-model="proxyInfo.host"
              aria-label="host"
              :disabled="inputDisabled"
            />
          </div>
          <label class="col-2 col-form-label">{{
            Browser.I18n.getMessage('form_label_password')
          }}</label>
          <div class="col-4">
            <input
              type="password"
              class="form-control form-control-sm"
              v-model="proxyInfo.password"
              :disabled="inputDisabled"
            />
          </div>
        </div>
        <div class="mb-2 row d-flex align-items-center">
          <label class="col-2 col-form-label">{{
            Browser.I18n.getMessage('form_label_port')
          }}</label>
          <div class="col-4">
            <input
              type="number"
              class="form-control form-control-sm"
              v-model="proxyInfo.port"
              :disabled="inputDisabled"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
