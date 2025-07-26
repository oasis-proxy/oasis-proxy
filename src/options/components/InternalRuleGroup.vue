<script setup>
import {
  computed,
  defineModel,
  onMounted,
  ref,
  watch,
  getCurrentInstance
} from 'vue'
import Browser from '@/Browser/main'
import ProxySelect from '@/components/ProxySelect.vue'
import { getRegConst } from '@/core/rules_parser.js'
import * as ipaddr from 'ipaddr.js'
const rule = defineModel()
const emit = defineEmits([
  'clearFousText',
  'addItem',
  'hrItem',
  'deleteItem',
  'getFocusText'
])
const props = defineProps({
  isDraggable: { type: Boolean, default: true },
  isProxySelectable: { type: Boolean, default: true },
  isValidable: { type: Boolean, default: true },
  readonly: { type: Boolean, default: false }
})
const instance = getCurrentInstance()

instance?.vnode?.props?.['onCustomEvent']

const isDataValid = ref(true)
const dataClassName = computed(() => {
  return isDataValid.value
    ? 'form-control form-control-sm'
    : 'form-control is-invalid form-control-sm'
})

const placeholder = computed(() => {
  switch (rule.value.mode) {
    case 'domain':
      return Browser.I18n.getMessage('placeholder_domain')
    case 'regex':
      return Browser.I18n.getMessage('placeholder_regex')
    case 'ip':
      return Browser.I18n.getMessage('placeholder_ip_cidr')
    default:
      return ''
  }
})

onMounted(() => {
  checkDataValid()
})

watch(
  () => rule.value.mode,
  () => {
    checkDataValid()
  }
)

const feedback = computed(() => {
  switch (rule.value.mode) {
    case 'domain':
      return Browser.I18n.getMessage('feedback_wildcard_domain_invalid')
    case 'regex':
      return Browser.I18n.getMessage('feedback_regex_invalid')
    case 'ip':
      return Browser.I18n.getMessage('feedback_ip_cidr_invalid')
    default:
      return Browser.I18n.getMessage('feedback_invalid')
  }
})

function inputDividerLabel(event) {
  rule.value.data = event.target.textContent
}

function checkDataValid() {
  if (rule.value.mode == 'domain') {
    if (rule.value.data == '') isDataValid.value = false
    else isDataValid.value = /^[a-zA-Z0-9*?.-]*$/.test(rule.value.data)
  } else if (rule.value.mode == 'regex') {
    if (rule.value.data == '') isDataValid.value = false
    else isDataValid.value = getRegConst(rule.value.data) != ''
  } else if (rule.value.mode == 'ip') {
    isDataValid.value =
      ipaddr.IPv4.isValidFourPartDecimal(rule.value.data) ||
      (ipaddr.IPv6.isValid(rule.value.data) &&
        rule.value.data.indexOf(':') > -1) ||
      (ipaddr.IPv4.isValidCIDR(rule.value.data) &&
        rule.value.data.indexOf('.') > -1) ||
      (ipaddr.IPv6.isValidCIDR(rule.value.data) &&
        rule.value.data.indexOf(':') > -1)
  }
}

function handleBlur() {
  checkDataValid()
  emit('clearFousText')
}
</script>
<template>
  <div
    class="hstack gap-2 mb-2 d-flex align-items-start"
    v-if="rule.mode != 'divider'"
  >
    <i
      v-if="props.isDraggable"
      class="bi bi-arrows-move icon-btn drag-handle mt-1"
    ></i>
    <div class="form-check form-switch mt-1" v-if="props.isValidable">
      <input
        class="form-check-input form-check-input"
        type="checkbox"
        role="switch"
        v-model="rule.valid"
        checked
      />
    </div>
    <select
      class="form-select form-select-sm"
      v-model="rule.mode"
      style="width: 210px"
      :disabled="props.readonly"
    >
      <option value="domain">
        {{ Browser.I18n.getMessage('input_label_domain_wildcard') }}
      </option>
      <option value="regex">
        {{ Browser.I18n.getMessage('input_label_regex') }}
      </option>
      <option value="ip">IP/CIDR</option>
    </select>
    <div class="vstack">
      <input
        type="text"
        :class="dataClassName"
        :placeholder="placeholder"
        v-model="rule.data"
        @input="emit('getFocusText')"
        @blur="handleBlur"
        @focus="emit('getFocusText')"
        :disabled="props.readonly"
      />
      <div class="invalid-feedback">
        {{ feedback }}
      </div>
    </div>
    <div v-if="props.isProxySelectable">
      <ProxySelect
        v-model="rule.proxy"
        style="width: 150px"
        :readonly="props.readonly"
      ></ProxySelect>
    </div>
    <div class="hstack mb-2 d-flex align-items-baseline">
      <slot name="operation"></slot>
      <slot name="delete"></slot>
    </div>
  </div>
  <div class="hstack gap-4 mb-2 d-flex align-items-center" v-else>
    <span><i class="bi bi-arrows-move icon-btn drag-handle"></i></span>
    <hr class="w-100" />
    <span
      contenteditable="true"
      style="white-space: nowrap"
      @input="inputDividerLabel"
      :textContent="rule.data"
    ></span>
    <hr class="w-100" />
    <div class="hstack gap-1">
      <slot name="delete"></slot>
    </div>
  </div>
</template>
