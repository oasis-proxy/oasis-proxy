<script setup>
import Browser from '@/Browser/chrome/chrome.js'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const fixed = ref([])
const pac = ref([])
const auto = ref([])
const proxyConfigs = ref({})
const activeProxyKey = ref('')
const className = 'nav-link px-2 d-flex align-items-center'
const activeClassName = 'nav-link px-2 d-flex align-items-center active'
onMounted(async () => {
  const result = await Browser.Storage.getLocalAll()
  proxyConfigs.value = result
  Object.keys(result).forEach((key) => {
    if (!key.startsWith('proxy_')) return
    switch (result[key].mode) {
      case 'auto':
        auto.value.push(result[key].name)
        break
      case 'pac_script':
        pac.value.push(result[key].name)
        break
      case 'fixed_servers':
        fixed.value.push(result[key].name)
        break
      default:
    }
  })
  activeProxyKey.value = result.status_proxyKey
})

function setProxy(proxyConfigs, key) {
  Browser.Proxy.set(proxyConfigs, key, async () => {
    await Browser.Storage.setLocal({ status_proxyKey: key })
    window.close()
  })
  activeProxyKey.value = key
}
</script>
<template>
  <div class="hstack px-3 py-2 mt-1">
    <div
      class="d-flex align-items-center cursor-point"
      @click="Browser.Runtime.openOptionsPage()"
    >
      <i class="bi bi-gear-wide-connected me-2"></i>
      <span>选项设置</span>
    </div>
    <div
      class="ms-auto d-flex align-items-center cursor-point"
      @click="router.push('/monitor')"
    >
      <span>监控</span>
      <i class="bi bi-speedometer ms-2"></i>
    </div>
  </div>
  <hr class="my-1" />
  <ul id="proxyList" class="nav nav-pills flex-column pb-1">
    <li class="nav-item">
      <a
        :class="activeProxyKey == 'direct' ? activeClassName : className"
        @click="setProxy(proxyConfigs, 'direct')"
        ><i class="bi bi-arrow-left-right mx-2"></i><span>直连</span></a
      >
    </li>
    <li class="nav-item">
      <a
        :class="activeProxyKey == 'system' ? activeClassName : className"
        @click="setProxy(proxyConfigs, 'system')"
        ><i class="bi bi-tools mx-2"></i><span>系统代理</span></a
      >
    </li>
    <hr class="my-1" />
    <li
      class="nav-item"
      v-for="(item, index) in fixed"
      :key="index"
      @click="setProxy(proxyConfigs, 'proxy_' + item)"
    >
      <a
        :class="activeProxyKey == 'proxy_' + item ? activeClassName : className"
      >
        <i class="bi bi-pc-display mx-2"></i>
        <span class="d-inline-block text-truncate">{{
          decodeURIComponent(item)
        }}</span>
      </a>
    </li>
    <li
      class="nav-item"
      v-for="(item, index) in pac"
      :key="index"
      @click="setProxy(proxyConfigs, 'proxy_' + item)"
    >
      <a
        :class="activeProxyKey == 'proxy_' + item ? activeClassName : className"
      >
        <i class="bi bi-pc-display mx-2"></i>
        <span class="d-inline-block text-truncate">{{
          decodeURIComponent(item)
        }}</span>
      </a>
    </li>
    <li
      class="nav-item"
      v-for="(item, index) in auto"
      :key="index"
      @click="setProxy(proxyConfigs, 'proxy_' + item)"
    >
      <a
        :class="activeProxyKey == 'proxy_' + item ? activeClassName : className"
      >
        <i class="bi bi-pc-display mx-2"></i>
        <span class="d-inline-block text-truncate">{{
          decodeURIComponent(item)
        }}</span>
      </a>
    </li>
  </ul>
</template>
