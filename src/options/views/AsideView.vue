<script setup>
import { inject, computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PolicyModal from './dialog/PolicyModal.vue'
import ServerModal from './dialog/ServerModal.vue'

const proxyConfig = inject('proxyConfig')
const theme = inject('theme')
const activeProxyKey = inject('activeProxyKey')

const policyModal = ref(null)
const serverModal = ref(null)
const router = useRouter()
const route = useRoute()

const imgPath = computed(() => {
  if (theme?.value == 'dark') {
    return '/img/banner-dark.png'
  }
  return '/img/banner-light.png'
})

const activeProxyName = computed(() => {
  console.log(activeProxyKey.value)
  return activeProxyKey.value.substring(6)
})
const proxyNamesObj = computed(() => {
  const fixed = []
  const pac = []
  const auto = []
  Object.keys(proxyConfig.value).forEach((key) => {
    switch (proxyConfig.value[key]?.mode) {
      case 'auto':
        auto.push(proxyConfig.value[key].name)
        break
      case 'pac_script':
        pac.push(proxyConfig.value[key].name)
        break
      case 'fixed_servers':
        fixed.push(proxyConfig.value[key].name)
        break
      default:
        break
    }
  })
  return { auto, fixed, pac }
})

function toPath(path) {
  router.push(path)
}

function addPolicy() {
  if (policyModal.value) policyModal.value.show()
}

function addServer() {
  if (serverModal.value) serverModal.value.show()
}
</script>
<template>
  <div>
    <img :src="imgPath" class="w-100" alt="" />
  </div>
  <div class="card">
    <div class="card-header hstack">
      <div class="fw-bold">通用设置</div>
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
              ><span>首页配置</span></span
            >
          </a>
        </li>
      </ul>
    </div>
  </div>
  <div class="card">
    <div class="card-header hstack">
      <div class="fw-bold">代理节点</div>
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
                v-if="activeProxyKey == 'proxy_' + item"
                class="badge rounded-pill bg-info ms-3"
                >使用中
              </span>
            </span>
          </a>
        </li>
      </ul>
    </div>
  </div>
  <div class="card">
    <div class="card-header hstack">
      <div class="fw-bold">策略模式</div>
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
                v-if="activeProxyKey == 'proxy_' + item"
                class="badge rounded-pill bg-info ms-3"
                >使用中
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
                v-if="activeProxyName == item"
                class="badge rounded-pill bg-info ms-3"
                >使用中
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
