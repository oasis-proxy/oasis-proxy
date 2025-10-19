<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue'
import Browser from '@/Browser/main'
import { log } from '@/core/utils'

const instance = getCurrentInstance()
const toastMessage = instance?.appContext.config.globalProperties.$toastMessage

const tableList = ref([])

onMounted(async () => {
  const res = await Browser.Storage.getSession('temp_infoview')
  log.debug('res', res)
  if (res.temp_infoview) {
    tableList.value = JSON.parse(res.temp_infoview)
  }

  const resLocal = await Browser.Storage.getLocal('config_monitor')
  if (resLocal.config_monitor) {
    chrome.action.setPopup({ popup: '/popup.html#/monitor' })
  } else {
    chrome.action.setPopup({ popup: '/popup.html#/' })
  }
  await Browser.Storage.removeSession('temp_infoview')
})

async function copyToClipboard(text) {
  if (!text) return
  await navigator.clipboard.writeText(text)
  toastMessage.info(Browser.I18n.getMessage('desc_copy'))
}
</script>
<template>
  <div class="px-3 pb-1 mt-1">
    <table class="table table-sm" id="monitorTable">
      <tbody>
        <tr
          v-for="(item, index) in tableList"
          :key="index"
          :class="item.value ? '' : 'tr-bg text-info'"
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
