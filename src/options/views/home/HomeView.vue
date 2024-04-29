<script setup>
import HomeDefault from './HomeDefault.vue'
import HomeAdvance from './HomeAdvance.vue'
import HomeDebug from './HomeDebug.vue'
</script>

<template>
  <div id="profileAuto">
    <div class="hstack gap-2 pb-4 mb-3">
      <div class="fs-5 fw-bold text-truncate" id="title">插件设置</div>
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
          默认配置
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
          高级配置
        </button>
        <button
          class="nav-link d-none"
          id="v-pills-debug-tab"
          data-bs-toggle="pill"
          data-bs-target="#v-pills-debug"
          role="tab"
          aria-controls="v-pills-debug"
          aria-selected="false"
        >
          调试配置
        </button>
      </div>
    </div>
    <div class="tab-content" id="v-pills-tabContent">
      <HomeDefault></HomeDefault>
      <HomeAdvance></HomeAdvance>
      <HomeDebug></HomeDebug>
    </div>
  </div>
</template>
