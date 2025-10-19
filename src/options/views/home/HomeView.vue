<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import Browser from '@/Browser/main'

const router = useRouter()
const route = useRoute()
const className = ref('nav-link d-none')
const activeTab = ref('')

if (import.meta.env.VITE_APP_DEBUG == 'debug') {
  className.value = 'nav-link'
}

onMounted(() => {
  activeTab.value = route.path.split('/')[2]
})

watch(
  () => route.path,
  (newQuery) => {
    activeTab.value = newQuery.split('/')[2]
  },
  { deep: true }
)

function handleTabChange(tabName) {
  router.push('/home/' + tabName)
}
</script>

<template>
  <div id="profileAuto">
    <div class="hstack gap-3 pb-4 mb-3">
      <div>
        <i class="bi bi-gear-wide-connected fs-4"></i>
      </div>
      <div class="fs-5 fw-bold text-truncate" id="title">
        {{ Browser.I18n.getMessage('page_title_setting') }}
      </div>
    </div>
    <div>
      <div class="nav nav-tabs mb-2">
        <button
          :class="activeTab == 'default' ? 'nav-link active' : 'nav-link'"
          data-bs-toggle="pill"
          @click="handleTabChange('default')"
        >
          <span>{{ Browser.I18n.getMessage('tab_label_default') }}</span>
        </button>
        <button
          :class="activeTab == 'advance' ? 'nav-link active' : 'nav-link'"
          data-bs-toggle="pill"
          @click="handleTabChange('advance')"
        >
          <span>{{ Browser.I18n.getMessage('tab_label_advance') }}</span>
        </button>
        <button
          :class="activeTab == 'beta' ? 'nav-link active' : 'nav-link'"
          data-bs-toggle="pill"
          @click="handleTabChange('beta')"
        >
          <span>{{ Browser.I18n.getMessage('tab_label_beta') }}</span>
          <i class="bi bi-flask-fill ms-2"></i>
        </button>
        <button
          :class="className"
          data-bs-toggle="pill"
          @click="handleTabChange('debug')"
        >
          <span>{{ Browser.I18n.getMessage('tab_label_debug') }}</span>
        </button>
      </div>
    </div>
    <div>
      <RouterView />
    </div>
  </div>
</template>
