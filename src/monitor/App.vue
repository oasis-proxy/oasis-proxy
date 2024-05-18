<script setup>
import { onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import Browser from '@/Browser/main'

const theme = ref('dark')
onMounted(async () => {
  const result = await Browser.Storage.getLocal('config_ui')
  switch (result.config_ui) {
    case 'dark':
      theme.value = 'dark'
      break
    case 'system':
      if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        theme.value = 'dark'
      } else {
        theme.value = 'light'
      }
      break
    default:
      theme.value = 'light'
      break
  }
  document.body.setAttribute('data-bs-theme', theme.value)
})
</script>

<template>
  <div
    class="container-fluid shadow card p-4 border-light h-100 px-4 position-relative"
    style="min-height: 720px"
  >
    <div class="row gy-4 w-100 h-100 gx-5">
      <RouterView />
    </div>
  </div>
</template>
