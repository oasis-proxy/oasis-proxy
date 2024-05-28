<script setup>
import { ref } from 'vue'
import Browser from '@/Browser/main'
const props = defineProps({
  tabsList: Array
})

const emit = defineEmits(['filterTabsId'])

const activeTabId = ref('')

function handleClick(tabId) {
  activeTabId.value = tabId
  emit('filterTabsId', tabId)
}
</script>
<template>
  <div>
    <div class="card">
      <div class="card-header">
        <div class="fw-bold">
          {{ Browser.I18n.getMessage('aside_label_alltabs') }}
        </div>
      </div>
      <div class="card-body">
        <ul class="nav nav-pills flex-column">
          <li class="nav-item">
            <a
              :class="activeTabId == '' ? 'nav-link active' : 'nav-link'"
              @click="handleClick('')"
            >
              <span
                ><i class="bi bi-speedometer me-3"></i
                ><span>
                  {{
                    Browser.I18n.getMessage('aside_label_alltabs_item')
                  }}</span
                ></span
              >
            </a>
          </li>
        </ul>
      </div>
    </div>
    <div class="card flex-grow-1">
      <div class="card-header">
        <div class="fw-bold">
          {{ Browser.I18n.getMessage('aside_label_tabs') }}
        </div>
      </div>
      <div class="card-body overflow-auto" style="height: 1px">
        <ul class="nav nav-pills flex-column">
          <li
            :class="e.valid ? 'nav-item w-100' : 'nav-item invalid w-100'"
            v-for="(e, i) in props.tabsList"
            :key="i"
          >
            <a
              :class="
                e.tabId == activeTabId
                  ? 'nav-link active truncate-text'
                  : 'nav-link truncate-text'
              "
              @click="handleClick(e.tabId)"
            >
              <span>
                <i class="bi bi-play-fill me-1" v-if="e.valid == true"></i>
                <i class="bi bi-stop-fill me-1" v-else></i>
                <span> {{ e.title }}</span>
              </span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
