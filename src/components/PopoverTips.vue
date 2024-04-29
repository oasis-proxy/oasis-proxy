<script setup>
import { onMounted, ref } from 'vue'
defineProps({
  className: String,
  content: String
})
const popover = ref(null)
onMounted(() => {
  new bootstrap.Popover(popover.value)
})
</script>
<template>
  <i
    ref="popover"
    :class="className"
    data-bs-container="body"
    data-bs-toggle="popover"
    data-bs-trigger="hover"
    :data-bs-content="content"
  ></i>
</template>
