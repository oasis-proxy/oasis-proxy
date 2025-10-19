<script setup>
import DefaultView from './DefaultView.vue'
import Browser from '@/Browser/main'
</script>
<template>
  <div>
    <div class="hstack gap-3 pb-4 mb-3">
      <div><i class="bi bi-clock-fill fs-4"></i></div>
      <div class="fs-5 fw-bold text-truncate" id="title">
        {{ Browser.I18n.getMessage('page_title_site_temprules') }}
      </div>
    </div>
    <div>
      <div class="nav nav-tabs mb-2" id="v-pills-tab" role="tablist">
        <button
          class="nav-link active"
          id="v-pills-default-tab"
          data-bs-toggle="pill"
          data-bs-target="#v-pills-default"
          role="tab"
          aria-controls="v-pills-default"
          aria-selected="true"
        >
          {{ Browser.I18n.getMessage('tab_label_default') }}
        </button>
      </div>
      <div class="tab-content" id="v-pills-tabContent">
        <div class="tab-pane fade show active" id="v-pills-default">
          <default-view />
        </div>
      </div>
    </div>
  </div>
</template>
