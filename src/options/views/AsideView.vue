<script setup>
import { computed, ref, getCurrentInstance } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PolicyModal from './dialog/PolicyModal.vue'
import ServerModal from './dialog/ServerModal.vue'
import { useConfigStore } from '@/options/stores/config'
import { useStatusStore } from '@/options/stores/status'

import Browser from '@/Browser/main'

const policyModal = ref(null)
const serverModal = ref(null)
const router = useRouter()
const route = useRoute()
const storeConfig = useConfigStore()
const storeStatus = useStatusStore()

const instance = getCurrentInstance()
const toast = instance?.appContext.config.globalProperties.$toast

const proxyNamesObj = computed(() => {
  const fixed = []
  const pac = []
  const auto = []
  Object.keys(storeStatus.proxyConfigs).forEach((key) => {
    switch (storeStatus.proxyConfigs[key]?.mode) {
      case 'auto':
        auto.push(storeStatus.proxyConfigs[key].name)
        auto.sort()
        break
      case 'pac_script':
        pac.push(storeStatus.proxyConfigs[key].name)
        pac.sort()
        break
      case 'fixed_servers':
        fixed.push(storeStatus.proxyConfigs[key].name)
        fixed.sort()
        break
      default:
        break
    }
  })
  return { auto, fixed, pac }
})

function toPath(path) {
  if (storeStatus.isUnsaved) {
    toast.warning(Browser.I18n.getMessage('desc_unsave_toast'))
    return
  }
  router.push(path)
}

function addPolicy() {
  if (storeStatus.isUnsaved) {
    toast.warning(Browser.I18n.getMessage('desc_unsave_toast'))
    return
  }
  if (policyModal.value) policyModal.value.show()
}

function addServer() {
  if (storeStatus.isUnsaved) {
    toast.warning(Browser.I18n.getMessage('desc_unsave_toast'))
    return
  }
  if (serverModal.value) serverModal.value.show()
}
</script>
<template>
  <div class="w-100 mb-4 d-flex justify-content-center">
    <img
      v-show="storeConfig.computedTheme == 'dark'"
      src="/img/banner-dark.png"
      alt=""
      style="width: 193px"
    />
    <img
      v-show="storeConfig.computedTheme != 'dark'"
      src="/img/banner-light.png"
      alt=""
      style="width: 193px"
    />
  </div>
  <div class="card">
    <div class="card-header hstack">
      <div class="fw-bold">
        {{ Browser.I18n.getMessage('aside_label_setting') }}
      </div>
    </div>
    <div class="card-body">
      <ul class="nav nav-pills flex-column">
        <li class="nav-item">
          <a
            :class="route.path == '/home' ? 'nav-link active' : 'nav-link'"
            @click="toPath('/home')"
          >
            <span
              ><i class="bi bi-house-gear-fill me-3"></i
              ><span>
                {{ Browser.I18n.getMessage('aside_label_setting') }}</span
              ></span
            >
          </a>
        </li>
      </ul>
    </div>
  </div>
  <div class="card">
    <div class="card-header hstack">
      <div class="fw-bold">
        {{ Browser.I18n.getMessage('aside_label_proxy_server') }}
      </div>
      <i class="bi bi-plus-circle-fill ms-auto icon-btn" @click="addServer"></i>
    </div>
    <div class="card-body">
      <ul class="nav nav-pills flex-column">
        <li
          class="nav-item w-100"
          v-for="item in proxyNamesObj.fixed"
          :key="item"
        >
          <a
            :class="
              route.path == '/fixed/' + item
                ? 'nav-link d-inline-block text-truncate w-100 active'
                : 'nav-link d-inline-block text-truncate w-100'
            "
            @click="toPath('/fixed/' + item)"
            ><span class="position-relative d-flex align-items-center">
              <i class="bi bi-pc-display me-3"></i
              ><span>{{ decodeURIComponent(item) }}</span
              ><span
                v-if="storeStatus.activeProxyKey == 'proxy_' + item"
                class="badge rounded-pill bg-info ms-3"
              >
                {{ Browser.I18n.getMessage('badge_label_using') }}
              </span>
            </span>
          </a>
        </li>
      </ul>
    </div>
  </div>
  <div class="card">
    <div class="card-header hstack">
      <div class="fw-bold">
        {{ Browser.I18n.getMessage('aside_label_proxy_policy') }}
      </div>
      <i class="bi bi-plus-circle-fill icon-btn ms-auto" @click="addPolicy">
      </i>
    </div>
    <div class="card-body">
      <ul class="nav nav-pills flex-column">
        <li
          class="nav-item w-100"
          v-for="item in proxyNamesObj.pac"
          :key="item"
        >
          <a
            :class="
              route.path == '/pac/' + item
                ? 'nav-link d-inline-block text-truncate w-100 active'
                : 'nav-link d-inline-block text-truncate w-100'
            "
            @click="toPath('/pac/' + item)"
            ><span class="position-relative d-flex align-items-center">
              <i class="bi bi-file-earmark-ppt-fill me-3"></i
              ><span>{{ decodeURIComponent(item) }}</span
              ><span
                v-if="storeStatus.activeProxyKey == 'proxy_' + item"
                class="badge rounded-pill bg-info ms-3"
              >
                {{ Browser.I18n.getMessage('badge_label_using') }}
              </span>
            </span>
          </a>
        </li>
        <li
          class="nav-item w-100"
          v-for="item in proxyNamesObj.auto"
          :key="item"
        >
          <a
            :class="
              route.path == '/auto/' + item
                ? 'nav-link d-inline-block text-truncate w-100 active'
                : 'nav-link d-inline-block text-truncate w-100'
            "
            @click="toPath('/auto/' + item)"
            ><span class="position-relative d-flex align-items-center">
              <i class="bi bi-signpost-split-fill me-3"></i
              ><span>{{ decodeURIComponent(item) }}</span
              ><span
                v-if="storeStatus.activeProxyKey == 'proxy_' + item"
                class="badge rounded-pill bg-info ms-3"
              >
                {{ Browser.I18n.getMessage('badge_label_using') }}
              </span>
            </span>
          </a>
        </li>
      </ul>
    </div>
  </div>
  <PolicyModal ref="policyModal"></PolicyModal>
  <ServerModal ref="serverModal"></ServerModal>
</template>
