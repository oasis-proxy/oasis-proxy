<script setup>
import { ref } from 'vue'
import HomeDefault from './HomeDefault.vue'
import HomeAdvance from './HomeAdvance.vue'
import HomeDebug from './HomeDebug.vue'
import HomeOthers from './HomeOthers.vue'
import Browser from '@/Browser/main'

const className = ref('nav-link d-none')

if (import.meta.env.VITE_APP_DEBUG == 'debug') {
  className.value = 'nav-link'
}
</script>

<template>
  <div id="profileAuto">
    <div class="hstack gap-2 pb-4 mb-3">
      <div class="fs-5 fw-bold text-truncate" id="title">
        {{ Browser.I18n.getMessage('page_title_setting') }}
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
          <span>{{ Browser.I18n.getMessage('tab_label_default') }}</span>
        </button>
        <button
          class="nav-link"
          id="v-pills-advance-tab"
          data-bs-toggle="pill"
          data-bs-target="#v-pills-advance"
          role="tab"
          aria-controls="v-pills-advance"
          aria-selected="false"
        >
          <span>{{ Browser.I18n.getMessage('tab_label_advance') }}</span>
        </button>
        <button
          class="nav-link"
          id="v-pills-others-tab"
          data-bs-toggle="pill"
          data-bs-target="#v-pills-others"
          role="tab"
          aria-controls="v-pills-others"
          aria-selected="false"
        >
          <span>{{ Browser.I18n.getMessage('tab_label_others') }}</span>
        </button>
        <button
          :class="className"
          id="v-pills-debug-tab"
          data-bs-toggle="pill"
          data-bs-target="#v-pills-debug"
          role="tab"
          aria-controls="v-pills-debug"
          aria-selected="false"
        >
          <span>{{ Browser.I18n.getMessage('tab_label_debug') }}</span>
        </button>
      </div>
    </div>
    <div class="tab-content">
      <HomeDefault></HomeDefault>
      <HomeAdvance></HomeAdvance>
      <HomeDebug></HomeDebug>
      <HomeOthers></HomeOthers>
    </div>
  </div>
</template>
