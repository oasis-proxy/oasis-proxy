<script setup>
import PopoverTips from '@/components/PopoverTips.vue'

import Browser from '@/Browser/main'
import TagsTable from '@/options/components/TagsTable.vue'
</script>
<template>
  <div class="tab-pane fade show" id="v-pills-others">
    <div class="card">
      <div class="card-header">
        <span class="fw-bold">{{
          Browser.I18n.getMessage('tab_label_others')
        }}</span>
      </div>
      <div class="card-body">
        <div class="row mb-3 d-flex align-items-top">
          <label class="col-2 col-form-label">
            <span>{{ Browser.I18n.getMessage('form_label_iptags') }}</span>
            <PopoverTips
              className="bi bi-question-circle-fill icon-btn ms-2"
              :content="Browser.I18n.getMessage('popover_iptags')"
            ></PopoverTips>
          </label>
          <div class="col-10">
            <TagsTable></TagsTable>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
