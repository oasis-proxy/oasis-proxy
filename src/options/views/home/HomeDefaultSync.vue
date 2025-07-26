<script setup>
import { computed, inject, nextTick } from 'vue'
import PopoverTips from '@/components/PopoverTips.vue'
import { useConfigStore } from '@/options/stores/config'
import ConfigDisplay from '@/options/components/ConfigDisplay.vue'
import Browser from '@/Browser/main'

const storeConfig = useConfigStore()
const showSyncConflictModal = inject('showSyncConflictModal')
const configAutoSync = computed(() => {
  return storeConfig.configAutoSync
})

async function handleAutoSyncChange(event) {
  if (event.target.checked) {
    storeConfig.configAutoSync = event.target.checked
    await nextTick()
    showSyncConflictModal(Browser.I18n.getMessage('modal_desc_sync'))
  } else {
    storeConfig.configAutoSync = false
    Browser.Storage.setLocal({ config_autoSync: false })
  }
}
</script>
<template>
  <div class="row mb-3 d-flex align-items-center">
    <label class="col-2 col-form-label">
      <span>{{ Browser.I18n.getMessage('form_label_autosync') }}</span>
      <PopoverTips
        className="bi bi-question-circle-fill icon-btn ms-2"
        :content="Browser.I18n.getMessage('popover_autosync')"
      ></PopoverTips>
    </label>
    <div class="col-10">
      <div class="form-check-sm d-flex align-items-center">
        <div class="form-check form-switch mt-1">
          <input
            class="form-check-input form-check-input"
            type="checkbox"
            role="switch"
            :checked="configAutoSync"
            @change="handleAutoSyncChange"
          />
          <span>{{
            configAutoSync == false
              ? Browser.I18n.getMessage('input_label_off')
              : Browser.I18n.getMessage('input_label_on')
          }}</span>
        </div>
      </div>
    </div>
  </div>
  <div class="row mb-3 d-flex align-items-top">
    <label class="col-2 col-form-label">
      <span>{{ Browser.I18n.getMessage('form_label_manualsync') }}</span>
    </label>
    <div class="col-10">
      <ConfigDisplay :isModal="false"></ConfigDisplay>
    </div>
  </div>
</template>
