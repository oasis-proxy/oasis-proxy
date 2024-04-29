<script setup></script>
<template>
  <div
    ref="modal"
    class="modal fade"
    tabindex="-1"
    aria-hidden="true"
    data-bs-backdrop="static"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-body">
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
