<script setup>
import { onMounted, ref } from 'vue'
const emit = defineEmits(['click'])
defineProps({
  className: String,
  iconStyle: String,
  content: String,
  hint: {
    type: Boolean,
    default: true
  }
})
const popover = ref(null)
onMounted(() => {
  new bootstrap.Popover(popover.value)
})
</script>
<template>
  <i
    v-show="!hint"
    @click="emit('click')"
    :class="className"
    :style="iconStyle"
  ></i>
  <i
    v-show="hint"
    ref="popover"
    @click="emit('click')"
    :class="className"
    :style="iconStyle"
    data-bs-placement="top"
    data-bs-container="body"
    data-bs-toggle="popover"
    data-bs-trigger="hover"
    :data-bs-content="content"
  ></i>
</template>
