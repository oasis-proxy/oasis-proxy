<script setup>
import { defineModel } from 'vue'
import ProxySelect from '@/components/ProxySelect.vue'
import Browser from '@/Browser/chrome/chrome'
const rule = defineModel()
</script>
<template>
  <div class="hstack gap-4 mb-2 d-flex align-items-center">
    <span><i class="bi bi-arrows-move icon-btn drag-handle"></i></span>
    <div class="hstack gap-1">
      <div class="form-check form-switch d-flex align-items-center">
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
        style="width: 210px"
        v-model="rule.mode"
      >
        <option value="domain">
          {{ Browser.I18n.getMessage('input_label_domain_wildcard') }}
        </option>
        <option value="regex">
          {{ Browser.I18n.getMessage('input_label_regex') }}
        </option>
        <option value="ip">IP/CIDR</option>
      </select>
    </div>
    <input
      type="text"
      class="form-control form-control-sm"
      v-model="rule.data"
      @input="$emit('getFocusText')"
      @blur="$emit('clearFousText')"
      @focus="$emit('getFocusText')"
    />
    <div>
      <ProxySelect v-model="rule.proxy" style="width: 150px"></ProxySelect>
    </div>
    <div class="hstack gap-1">
      <i class="bi bi-trash-fill icon-btn" @click="$emit('deleteItem')"></i>
    </div>
  </div>
</template>
