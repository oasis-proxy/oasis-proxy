<script setup>
import Browser from '@/Browser/main'
import { computed, onMounted, getCurrentInstance } from 'vue'

const props = defineProps(['message', 'mode'])

const instance = getCurrentInstance()
const show = function () {
  const toast = new bootstrap.Toast(instance.refs.toast)
  toast.show()
}

onMounted(() => {
  show()
})

const title = computed(() => {
  const title = {
    icon: 'bi bi-info-circle-fill icon-btn ms-1 me-3 ',
    value: ''
  }
  switch (props.mode) {
    case 'info':
      title.icon = title.icon + 'bi-info-circle-fill'
      title.value = Browser.I18n.getMessage('modal_title_info')
      break
    case 'warning':
      title.icon = title.icon + 'bi-info-circle-fill text-warning'
      title.value = Browser.I18n.getMessage('modal_title_warning')
      break
    default:
      break
  }
  return title
})
</script>
<template>
  <div ref="toast" class="toast position-relative">
    <button
      class="btn-close position-absolute"
      style="top: 1rem; right: 1rem"
      data-bs-dismiss="toast"
      aria-label="Close"
    ></button>
    <div class="toast-body p-3">
      <div class="mb-2 fw-bold">
        <i :class="title.icon"></i>
        <span>{{ title.value }}</span>
      </div>
      {{ props.message }}
    </div>
  </div>
</template>
