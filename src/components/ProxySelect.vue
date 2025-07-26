<script setup>
import { ref, onMounted, defineModel } from 'vue'

import Browser from '@/Browser/main'

const proxy = defineModel()

const props = defineProps({
  readonly: { type: Boolean, default: false }
})

const proxyNames = ref([])

onMounted(async () => {
  const result = await Browser.Storage.getLocalAll()
  Object.keys(result).forEach((key) => {
    if (key.startsWith('proxy_') && result[key].mode == 'fixed_servers') {
      proxyNames.value.push(result[key].name)
    }
  })
})
</script>
<template>
  <select
    class="form-select form-select-sm"
    v-model="proxy"
    :disabled="props.readonly"
  >
    <option value="direct">
      {{ Browser.I18n.getMessage('input_label_direct') }}
    </option>
    <option
      :value="'+' + item"
      v-for="(item, index) in proxyNames"
      :key="index"
    >
      {{ decodeURIComponent(item) }}
    </option>
  </select>
</template>
