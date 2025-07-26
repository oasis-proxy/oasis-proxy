<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Browser from '@/Browser/main'

const props = defineProps(['redirect'])
const tableList = ref([])
const copyShow = ref(false)

onMounted(async () => {
  const res = await Browser.Storage.getSession('temp_infoview')
  tableList.value = JSON.parse(res.temp_infoview)
  await Browser.Storage.removeSession('temp_infoview')

  const resLocal = await Browser.Storage.getLocal('config_monitor')
  if (resLocal.config_monitor) {
    chrome.action.setPopup({ popup: '/popup.html#/monitor' })
  } else {
    chrome.action.setPopup({ popup: '/popup.html#/' })
  }
})

async function copyToClipboard(text) {
  if (!text) return
  await navigator.clipboard.writeText(text)
  copyShow.value = true
  setTimeout(() => {
    copyShow.value = false
  }, 3000)
}
</script>
<template>
  <div class="position-fixed w-100 shadow-sm bg">
    <div class="row justify-content-between px-3 py-2 mt-1">
      <div
        class="col-4 d-inline-flex align-items-center cursor-point"
        @click="router.push('/')"
      >
        <i class="bi bi-send-check me-2"></i>
        <span>{{ Browser.I18n.getMessage('desc_proxy_selection') }}</span>
      </div>
      <div class="col-4 d-inline-flex justify-content-center">
        <Transition>
          <div v-show="copyShow">
            <i class="bi bi-check-circle-fill me-2 icon-btn"></i>
            <span>{{ Browser.I18n.getMessage('desc_copy') }}</span>
          </div>
        </Transition>
      </div>
      <div class="col-4 d-inline-flex justify-content-end">
        <div
          class="d-inline-flex align-items-center cursor-point"
          v-if="quickEnabled"
          @click="router.push('/quick')"
        >
          <span>{{ Browser.I18n.getMessage('desc_quick_add') }}</span>
          <i class="bi bi-plus-circle ms-2"></i>
        </div>
      </div>
    </div>
  </div>
  <div class="px-3 pb-1 mt-5">
    <table class="table table-sm" id="monitorTable">
      <tbody>
        <tr
          v-for="(item, index) in tableList"
          :key="index"
          :class="item.value ? '' : 'tr-bg'"
        >
          <td :colspan="item.value ? '1' : '2'">
            <span
              class="truncate-text d-inline-block text-nowrap fw-bold align-middle"
              :class="!item.value ? 'cursor-point' : ''"
              :style="item.value ? 'width: 90px' : 'width: 320px'"
              :title="item.name"
              @click="
                !item.value ? copyToClipboard(item.name) : copyToClipboard()
              "
              >{{ item.name }}</span
            >
          </td>
          <td v-if="item.value">
            <span
              class="truncate-text d-inline-block text-nowrap cursor-point align-middle"
              style="width: 120px"
              :title="item.value"
              @click="copyToClipboard(item.value)"
              >{{ item.value }}</span
            >
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
.bg {
  background-color: var(--bs-tertiary-bg);
}
.tr-bg {
  background-color: var(--bs-card-cap-bg);
}
</style>
