<script setup>
import Browser from '@/Browser/main'
import { ref, onMounted } from 'vue'
import { formatCode, log } from '@/core/utils'

const localProfile = ref('')
const syncProfile = ref('')
const sessionProfile = ref('')
onMounted(() => {
  getLocal()
  getSync()
  getSession()
})

async function getLocal() {
  const result = await Browser.Storage.getLocalAll()
  localProfile.value = await formatCode(JSON.stringify(result), 'json')
}
async function getSync() {
  const result = await Browser.Storage.getSyncAll()
  syncProfile.value = await formatCode(JSON.stringify(result), 'json')
}
async function getSession() {
  const result = await Browser.Storage.getSessionAll()
  sessionProfile.value = await formatCode(JSON.stringify(result), 'json')
}
function clearSync() {
  Browser.Storage.clearSync()
}

async function removePermission() {
  await chrome.contextMenus.removeAll()
  chrome.permissions.remove(
    {
      permissions: ['contextMenus']
    },
    (removed) => {
      log.debug('permission removed', removed)
    }
  )
}

function getPermission() {
  chrome.permissions.request(
    {
      permissions: ['contextMenus']
    },
    (granted) => {
      if (granted) {
        log.debug('权限已授予，可以访问 API')

        // 对链接添加菜单项
        chrome.contextMenus.create({
          id: 'linkMenu',
          title: '对这个链接执行操作',
          contexts: ['link'] // 仅在右键点击链接时显示
        })

        // 对图片添加菜单项
        chrome.contextMenus.create({
          id: 'imageMenu',
          title: '对这张图片执行操作',
          contexts: ['image'] // 仅在右键点击图片时显示
        })

        // 监听点击事件
        chrome.contextMenus.onClicked.addListener((info, tab) => {
          if (info.menuItemId === 'linkMenu') {
            log.debug('点击了链接菜单:', info.linkUrl)
            // 你可以在这里对 info.linkUrl 执行处理，比如复制、发送、打开新标签等
          }

          if (info.menuItemId === 'imageMenu') {
            log.debug('点击了图片菜单:', info.srcUrl)
            // 你可以对图片的 srcUrl 做处理，比如保存、识别等
          }
        })
      } else {
        log.debug('用户拒绝了权限请求')
      }
    }
  )
}

function open() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0]
    chrome.action.getPopup({ tabId: currentTab.id }, function (popupUrl) {
      const url = new URL(popupUrl)

      log.debug('当前 popup URL:', url)

      chrome.action.setPopup({
        popup: '/popup.html#/info?redirect=' + encodeURIComponent('/monitor')
        // encodeURI(url.pathname + url.hash)
      })
      chrome.action.openPopup()
    })
  })
}
</script>
<template>
  <div class="tab-pane fade show" id="v-pills-debug">
    <div class="card">
      <div class="card-header">
        <span class="fw-bold">Session</span>
        <div>
          <button class="btn btn-primary btn-sm" @click="clearSync">
            clear Sync
          </button>
          <button class="btn btn-primary btn-sm" @click="open">Open</button>
          <button class="btn btn-primary btn-sm" @click="getPermission">
            getPermission
          </button>
          <button class="btn btn-primary btn-sm" @click="removePermission">
            removePermission
          </button>
        </div>
      </div>
      <div class="card-body">
        <div
          class=""
          style="max-height: 400px; min-height: 100px; overflow: scroll"
        >
          <pre><code>{{ sessionProfile }}</code></pre>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="fw-bold">Local</span>
      </div>
      <div class="card-body">
        <div class="" style="height: 400px; overflow: scroll">
          <pre><code>{{ localProfile }}</code></pre>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="fw-bold">sync</span>
      </div>
      <div class="card-body">
        <div class="" style="max-height: 400px; overflow: scroll">
          <pre><code>{{ syncProfile }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
pre {
  padding: 8px;
  border-radius: 4px;
  background-color: var(--bs-tertiary-bg);
  opacity: 0.8;
}
</style>
