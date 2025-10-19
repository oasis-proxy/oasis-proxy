<script setup>
import { computed, onMounted, getCurrentInstance } from 'vue'

const props = defineProps(['message', 'mode'])

const instance = getCurrentInstance()
const show = function () {
  const toastMessage = new bootstrap.Toast(instance.refs.toastMessage)
  toastMessage.show()
}

onMounted(() => {
  show()
})

const title = computed(() => {
  const title = {
    icon: 'bi me-2',
    value: ''
  }
  switch (props.mode) {
    case 'info':
      title.icon = title.icon + ' bi-info-circle-fill'
      break
    case 'warning':
      title.icon = title.icon + ' bi-info-circle-fill text-warning'
      break
    default:
      break
  }
  return title
})
</script>
<template>
  <div ref="toastMessage" class="toast w-auto position-relative">
    <div class="toast-body">
      <i :class="title.icon"></i>
      <span>{{ message }}</span>
    </div>
  </div>
</template>
