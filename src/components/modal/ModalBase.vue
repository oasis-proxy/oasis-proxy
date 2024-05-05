<script setup>
import { computed } from 'vue'

const props = defineProps({
  mode: String
})

const modalClass = computed(() => {
  switch (props.mode) {
    case 'form':
      return 'modal-dialog form-dialog'
    case 'large':
      return 'modal-dialog large-dialog'
    default:
      return 'modal-dialog'
  }
})

const modalBodyClass = computed(() => {
  switch (props.mode) {
    case 'form':
      return 'modal-body'
    case 'large':
      return 'modal-body m-3'
    default:
      return 'modal-body'
  }
})
</script>
<template>
  <div
    ref="modal"
    class="modal fade"
    aria-hidden="true"
    data-bs-backdrop="static"
  >
    <div :class="modalClass">
      <div class="modal-content">
        <div :class="modalBodyClass">
          <h1 class="modal-title fs-6 mb-4">
            <slot name="title"></slot>
          </h1>
          <slot></slot>

          <div class="hstack gap-3 pt-4">
            <slot name="operations"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
