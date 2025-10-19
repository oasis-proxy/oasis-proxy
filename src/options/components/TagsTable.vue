<script setup>
import { ref, onMounted, computed, getCurrentInstance, inject } from 'vue'
import Browser from '@/Browser/main'
import { getNextLocalVersion } from '@/core/version_control.js'
import { useConfigStore } from '@/options/stores/config'
import PopoverTips from '@/components/PopoverTips.vue'

import * as ipaddr from 'ipaddr.js'

const storeConfig = useConfigStore()

const iptags = ref({})
const isVisible = ref(false)
onMounted(() => {
  getTags()
})

const showUploadConflictModal = inject('showUploadConflictModal')
const instance = getCurrentInstance()
const toast = instance?.appContext.config.globalProperties.$toast

const ip = ref('')
const name = ref('')

const list = computed(() => {
  return Object.keys(iptags.value).sort((a, b) => {
    let tmpA, tmpB
    if (ipaddr.IPv4.isValid(a)) {
      tmpA =
        ipaddr.parse(a).octets.reduce((acc, curr) => acc * 256 + curr, 0) -
        2 ** 32
    } else if (ipaddr.IPv6.isValid(a)) {
      tmpA = ipaddr.parse(a).parts.reduce((acc, curr) => acc * 256 + curr, 0)
    } else {
      tmpA = -1 - 2 ** 32
    }
    if (ipaddr.IPv4.isValid(b)) {
      tmpB =
        ipaddr.parse(b).octets.reduce((acc, curr) => acc * 256 + curr, 0) -
        2 ** 32
    } else if (ipaddr.IPv6.isValid(b)) {
      tmpB = ipaddr.parse(b).parts.reduce((acc, curr) => acc * 256 + curr, 0)
    } else {
      tmpB = -1 - 2 ** 32
    }
    return tmpA - tmpB
  })
})

async function getTags() {
  const res = await Browser.Storage.getLocal('config_iptags')
  if (res.config_iptags != null) {
    iptags.value = res.config_iptags
  }
}

function showAddTags() {
  if (isVisible.value) {
    ip.value = ''
    name.value = ''
  }
  isVisible.value = !isVisible.value
}

async function addTags() {
  if (ip.value == '' || name.value == '' || iptags.value[ip.value] != null) {
    toast.warning(`${Browser.I18n.getMessage('desc_add_iptags_info')}`)
    return
  }
  iptags.value[ip.value] = name.value
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    config_iptags: iptags.value,
    config_version: version,
    config_syncTime: new Date().getTime()
  })
  getTags()
  showAddTags()
  showUploadConflictModal()
}

async function deleteTags(ip) {
  if (!iptags.value[ip]) {
    toast.warning(`${Browser.I18n.getMessage('desc_undeleted_iptags')}`)
    return
  }
  delete iptags.value[ip]
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    config_iptags: iptags.value,
    config_version: version,
    config_syncTime: new Date().getTime()
  })
  getTags()
  showUploadConflictModal()
}
</script>
<template>
  <div class="vstack gap-2">
    <div style="max-height: 300px; width: fit-content" class="overflow-auto">
      <table class="table table-sm table-striped">
        <thead class="table-primary text-nowrap">
          <tr>
            <th class="ps-3" style="width: 300px">
              {{ Browser.I18n.getMessage('form_label_ip') }}
            </th>
            <th class="ps-3" style="width: 300px">
              {{ Browser.I18n.getMessage('form_label_tagsname') }}
            </th>
            <th style="width: 30px">
              <PopoverTips
                className="bi bi-plus-circle-fill icon-btn"
                :content="Browser.I18n.getMessage('iconbtn_add_iptags')"
                :hint="storeConfig.configIconBtnHint"
                @click="showAddTags"
              ></PopoverTips>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="text-nowrap" v-show="isVisible">
            <td class="text-truncate ps-3">
              <input
                class="form-control form-control-sm"
                :placeholder="Browser.I18n.getMessage('placeholder_ip')"
                type="text"
                v-model="ip"
              />
            </td>
            <td class="text-truncate ps-3">
              <input
                class="form-control form-control-sm"
                :placeholder="Browser.I18n.getMessage('placeholder_iptags')"
                type="text"
                v-model="name"
              />
            </td>
            <td>
              <PopoverTips
                iconStyle="vertical-align: sub"
                className="bi bi-floppy-fill icon-btn"
                :content="Browser.I18n.getMessage('iconbtn_save_iptag')"
                :hint="storeConfig.configIconBtnHint"
                @click="addTags"
              ></PopoverTips>
            </td>
          </tr>
          <tr v-for="(item, index) in list" class="text-nowrap" :key="index">
            <td class="text-truncate ps-3">
              {{ item }}
            </td>
            <td class="text-truncate ps-3">
              {{ iptags[item] }}
            </td>
            <td>
              <PopoverTips
                style="vertical-align: sub"
                className="bi bi-trash-fill icon-btn"
                :content="Browser.I18n.getMessage('iconbtn_delete_iptag')"
                :hint="storeConfig.configIconBtnHint"
                @click="deleteTags(item)"
              ></PopoverTips>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<style scoped>
table {
  table-layout: fixed;
  /* width: 630px; */
}

thead {
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
