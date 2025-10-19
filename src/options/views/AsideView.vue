<script setup>
import { computed, getCurrentInstance, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useConfigStore } from '@/options/stores/config'
import { useStatusStore } from '@/options/stores/status'
import PopoverTips from '@/components/PopoverTips.vue'

import Browser from '@/Browser/main'

const handleNewConfig = inject('handleNewConfig')

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
        auto.push({
          name: storeStatus.proxyConfigs[key].name,
          tagColor: storeStatus.proxyConfigs[key].tagColor
        })
        auto.sort((a, b) => a.name - b.name)
        break
      case 'pac_script':
        pac.push({
          name: storeStatus.proxyConfigs[key].name,
          tagColor: storeStatus.proxyConfigs[key].tagColor
        })
        pac.sort((a, b) => a.name - b.name)
        break
      case 'fixed_servers':
        fixed.push({
          name: storeStatus.proxyConfigs[key].name,
          tagColor: storeStatus.proxyConfigs[key].tagColor
        })
        fixed.sort((a, b) => a.name - b.name)
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

function toGithubWiki() {
  window.open('https://github.com/oasis-proxy/oasis-proxy/wiki', '_blank')
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
            :class="
              route.path.startsWith('/home/') ? 'nav-link active' : 'nav-link'
            "
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
        <li class="nav-item">
          <a class="nav-link" @click="toGithubWiki">
            <span>
              <i class="bi bi-lightbulb-fill me-3"></i>
              <span>{{ Browser.I18n.getMessage('aside_label_helper') }}</span>
              <i
                class="bi bi-link-45deg ms-1"
                style="vertical-align: middle"
              ></i>
            </span>
          </a>
        </li>
        <li class="nav-item" v-if="storeConfig.configSiteRules">
          <a
            :class="route.path == '/temp' ? 'nav-link active' : 'nav-link'"
            @click="toPath('/temp')"
          >
            <span>
              <i class="bi bi-clock-fill me-3"></i>
              <span>
                {{ Browser.I18n.getMessage('aside_label_temp_rules') }}
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
        {{ Browser.I18n.getMessage('aside_label_proxy_server') }}
      </div>
      <PopoverTips
        className="bi bi-plus-circle-fill ms-auto icon-btn"
        :content="Browser.I18n.getMessage('iconbtn_create_server')"
        :hint="storeConfig.configIconBtnHint"
        @click="handleNewConfig('servers')"
      ></PopoverTips>
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
              route.path == '/fixed/' + item.name
                ? 'nav-link d-inline-block text-truncate w-100 active'
                : 'nav-link d-inline-block text-truncate w-100'
            "
            @click="toPath('/fixed/' + item.name)"
            ><span class="position-relative d-flex align-items-center">
              <i
                class="bi bi-pc-display me-3"
                :style="'color: ' + item.tagColor"
              ></i
              ><span>{{ decodeURIComponent(item.name) }}</span
              ><span
                v-if="storeStatus.activeProxyKey == 'proxy_' + item.name"
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
      <PopoverTips
        className="bi bi-plus-circle-fill icon-btn ms-auto"
        :content="Browser.I18n.getMessage('iconbtn_create_policy')"
        :hint="storeConfig.configIconBtnHint"
        @click="handleNewConfig('policy')"
      >
      </PopoverTips>
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
              route.path == '/pac/' + item.name
                ? 'nav-link d-inline-block text-truncate w-100 active'
                : 'nav-link d-inline-block text-truncate w-100'
            "
            @click="toPath('/pac/' + item.name)"
            ><span class="position-relative d-flex align-items-center">
              <i
                class="bi bi-file-earmark-ppt-fill me-3"
                :style="'color: ' + item.tagColor"
              ></i
              ><span>{{ decodeURIComponent(item.name) }}</span
              ><span
                v-if="storeStatus.activeProxyKey == 'proxy_' + item.name"
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
              route.path == '/auto/' + item.name
                ? 'nav-link d-inline-block text-truncate w-100 active'
                : 'nav-link d-inline-block text-truncate w-100'
            "
            @click="toPath('/auto/' + item.name)"
            ><span class="position-relative d-flex align-items-center">
              <i
                class="bi bi-signpost-split-fill me-3"
                :style="'color: ' + item.tagColor"
              ></i>
              <span>{{ decodeURIComponent(item.name) }}</span
              ><span
                v-if="storeStatus.activeProxyKey == 'proxy_' + item.name"
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
</template>
