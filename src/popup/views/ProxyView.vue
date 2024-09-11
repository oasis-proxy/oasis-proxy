<script setup>
import Browser from '@/Browser/main'
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
        auto.value.push({
          name: result[key].name,
          tagColor: result[key].tagColor ? result[key].tagColor : '#3498db'
        })
        break
      case 'pac_script':
        pac.value.push({
          name: result[key].name,
          tagColor: result[key].tagColor ? result[key].tagColor : '#3498db'
        })
        break
      case 'fixed_servers':
        fixed.value.push({
          name: result[key].name,
          tagColor: result[key].tagColor ? result[key].tagColor : '#3498db'
        })
        break
      default:
    }
  })
  activeProxyKey.value = result.status_proxyKey
})

function setProxy(proxyConfigs, key) {
  Browser.Proxy.set(proxyConfigs, key, async () => {
    await Browser.Storage.setLocal({ status_proxyKey: key })
    Browser.Action.setBadgeBackgroundColor(
      proxyConfigs[key].tagColor ? proxyConfigs[key].tagColor : '#3498db'
    )
    if (import.meta.env.VITE_APP_DEBUG != 'debug') {
      window.close()
    }
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
      <span>{{ Browser.I18n.getMessage('desc_options') }}</span>
    </div>
    <div
      class="ms-auto d-flex align-items-center cursor-point"
      @click="router.push('/monitor')"
    >
      <span>{{ Browser.I18n.getMessage('desc_monitor') }}</span>
      <i class="bi bi-speedometer ms-2"></i>
    </div>
  </div>
  <hr class="my-1" />
  <ul id="proxyList" class="nav nav-pills flex-column pb-1">
    <li class="nav-item">
      <a
        :class="activeProxyKey == 'direct' ? activeClassName : className"
        @click="setProxy(proxyConfigs, 'direct')"
        ><i class="bi bi-arrow-left-right mx-2"></i
        ><span>{{ Browser.I18n.getMessage('input_label_direct') }}</span></a
      >
    </li>
    <li class="nav-item">
      <a
        :class="activeProxyKey == 'system' ? activeClassName : className"
        @click="setProxy(proxyConfigs, 'system')"
        ><i class="bi bi-tools mx-2"></i
        ><span>{{ Browser.I18n.getMessage('input_label_system') }}</span></a
      >
    </li>
    <hr class="my-1" />
    <li
      class="nav-item"
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
      </a>
    </li>
    <li
      class="nav-item"
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
      </a>
    </li>
    <li
      class="nav-item"
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
      </a>
    </li>
  </ul>
</template>
