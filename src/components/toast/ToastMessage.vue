<script setup>
import { computed, onMounted, getCurrentInstance } from 'vue'

const props = defineProps(['message', 'mode'])

const instance = getCurrentInstance()
// eslint-disable-next-line no-unused-vars
const show = function () {
  // eslint-disable-next-line no-undef
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
      title.value = '提示'
      break
    case 'warning':
      title.icon = title.icon + 'bi-info-circle-fill text-warning'
      title.value = '警告'
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
