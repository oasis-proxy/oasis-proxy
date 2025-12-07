<script setup>
import Browser from '@/Browser/main'
import { ref, onMounted } from 'vue'

const fixed = ref([])
const pac = ref([])
const auto = ref([])
const proxyConfigs = ref({})
const activeProxyKey = ref('')
const autoRefresh = ref(false)
const className = 'nav-link px-2 d-flex align-items-center hstack'
const activeClassName = 'nav-link px-2 d-flex align-items-center hstack active'
onMounted(async () => {
  const result = await Browser.Storage.getLocalAll()
  autoRefresh.value = result.config_autoRefresh
  proxyConfigs.value = result
  Object.keys(result).forEach((key) => {
    if (!key.startsWith('proxy_')) return
    switch (result[key].mode) {
      case 'auto':
        auto.value.push({
          name: result[key].name,
          tagColor: result[key].tagColor
        })
        break
      case 'pac_script':
        pac.value.push({
          name: result[key].name,
          tagColor: result[key].tagColor
        })
        break
      case 'fixed_servers':
        fixed.value.push({
          name: result[key].name,
          tagColor: result[key].tagColor
        })
        break
      default:
    }
  })
  activeProxyKey.value = result.status_proxyKey
})

function setProxy(proxyConfigs, key) {
  if (key == 'direct') {
    Browser.Proxy.setDirect(async () => {
      afterProxySetted(key)
    })
  } else if (key == 'system') {
    Browser.Proxy.setSystem(async () => {
      afterProxySetted(key)
    })
  } else {
    Browser.Proxy.set(proxyConfigs, key, async () => {
      await afterProxySetted(key)
    })
  }
  activeProxyKey.value = key
}

async function afterProxySetted(key) {
  await Browser.Storage.setLocal({ status_proxyKey: key })
  if (autoRefresh.value) {
    const tabs = await Browser.Tabs.getActiveTab()
    if (
      tabs != null &&
      tabs.length > 0 &&
      tabs[0].id != chrome.tabs.TAB_ID_NONE
    ) {
      const tab = await Browser.Tabs.get(tabs[0].id)
      if (tab.url?.startsWith('http')) {
        Browser.Tabs.reload(tabs[0].id)
      }
    }
  }
  if (import.meta.env.VITE_APP_DEBUG != 'debug') {
    window.close()
  }
}

function goToEditPage(name) {
  window.open('/options.html#' + name, '_blank')
}
</script>
<template>
  <ul id="proxyList" class="nav nav-pills flex-column pb-1 mt-1">
    <li class="nav-item w-100">
      <a
        :class="activeProxyKey == 'direct' ? activeClassName : className"
        @click="setProxy(proxyConfigs, 'direct')"
        ><i class="bi bi-arrow-left-right mx-2"></i
        ><span>{{ Browser.I18n.getMessage('input_label_direct') }}</span></a
      >
    </li>
    <li class="nav-item w-100">
      <a
        :class="activeProxyKey == 'system' ? activeClassName : className"
        @click="setProxy(proxyConfigs, 'system')"
        ><i class="bi bi-tools mx-2"></i
        ><span>{{ Browser.I18n.getMessage('input_label_system') }}</span></a
      >
    </li>
    <hr class="my-1" />
    <li
      class="nav-item w-100"
      v-for="(item, index) in fixed"
      :key="index"
      @click="setProxy(proxyConfigs, 'proxy_' + item.name)"
    >
      <a
        :class="
          activeProxyKey == 'proxy_' + item.name ? activeClassName : className
        "
      >
        <i class="bi bi-pc-display mx-2" :style="'color: ' + item.tagColor"></i>
        <span class="d-inline-block text-truncate">{{
          decodeURIComponent(item.name)
        }}</span>
        <i
          class="bi bi-pencil-square icon-btn ms-auto me-2"
          @click.stop="goToEditPage('/fixed/' + item.name)"
        ></i>
      </a>
    </li>
    <li
      class="nav-item w-100"
      v-for="(item, index) in pac"
      :key="index"
      @click="setProxy(proxyConfigs, 'proxy_' + item.name)"
    >
      <a
        :class="
          activeProxyKey == 'proxy_' + item.name ? activeClassName : className
        "
      >
        <i
          class="bi bi-file-earmark-ppt-fill mx-2"
          :style="'color: ' + item.tagColor"
        ></i>
        <span class="d-inline-block text-truncate">{{
          decodeURIComponent(item.name)
        }}</span>
        <i
          class="bi bi-pencil-square icon-btn ms-auto me-2"
          @click.stop="goToEditPage('/pac/' + item.name)"
        ></i>
      </a>
    </li>
    <li
      class="nav-item w-100"
      v-for="(item, index) in auto"
      :key="index"
      @click="setProxy(proxyConfigs, 'proxy_' + item.name)"
    >
      <a
        :class="
          activeProxyKey == 'proxy_' + item.name ? activeClassName : className
        "
      >
        <i
          class="bi bi-signpost-split-fill mx-2"
          :style="'color: ' + item.tagColor"
        ></i>
        <span class="d-inline-block text-truncate">{{
          decodeURIComponent(item.name)
        }}</span>
        <i
          class="bi bi-pencil-square icon-btn ms-auto me-2"
          @click.stop="goToEditPage('/auto/' + item.name)"
        ></i>
      </a>
    </li>
  </ul>
</template>
<style scoped>
.icon-btn {
  display: none;
}
.nav-item:hover .icon-btn {
  display: block;
}
</style>
