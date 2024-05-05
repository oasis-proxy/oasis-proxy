<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import Browser from '@/Browser/main'

onMounted(async () => {
  const result = await Browser.Storage.getLocal('config_ui')
  let theme
  switch (result.config_ui) {
    case 'dark':
      theme = 'dark'
      break
    case 'system':
      if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        theme = 'dark'
      } else {
        theme = 'light'
      }
      break
    default:
      theme = 'light'
      break
  }
  document.body.setAttribute('data-bs-theme', theme)
})
</script>

<template>
  <div style="width: 100%">
    <RouterView />
  </div>
</template>
