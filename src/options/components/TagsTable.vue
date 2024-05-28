<script setup>
import { ref, onMounted, computed, getCurrentInstance, inject } from 'vue'
import Browser from '@/Browser/main'
import { getNextLocalVersion } from '@/core/version_control.js'
const iptags = ref({})
onMounted(() => {
  getTags()
})

const showUploadConflictModal = inject('showUploadConflictModal')
const instance = getCurrentInstance()
const toast = instance?.appContext.config.globalProperties.$toast

const ip = ref('')
const name = ref('')
const title = [
  { name: Browser.I18n.getMessage('form_label_ip'), width: '300px' },
  { name: Browser.I18n.getMessage('form_label_tagsname'), width: '300px' },
  { name: '', width: '30px' }
]

const list = computed(() => {
  console.info(iptags.value, Object.keys(iptags.value).sort())
  return Object.keys(iptags.value).sort()
})

async function getTags() {
  const res = await Browser.Storage.getLocal('config_iptags')
  if (res.config_iptags != null) {
    iptags.value = res.config_iptags
  }
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
    config_version: version
  })
  getTags()
  name.value = ''
  ip.value = ''
  showUploadConflictModal()
}

async function deleteTags(ip) {
  if (iptags.value[ip] == null) {
    toast.warning(`${Browser.I18n.getMessage('desc_undeleted_iptags')}`)
    return
  }
  delete iptags.value[ip]
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    config_iptags: iptags.value,
    config_version: version
  })
  getTags()
  showUploadConflictModal()
}
</script>
<template>
  <div class="vstack gap-2">
    <div class="hstack gap-4">
      <div class="input-group-sm input-group" style="width: 280px">
        <span class="input-group-text">{{
          Browser.I18n.getMessage('form_label_ip')
        }}</span>
        <input
          class="form-control form-control-sm"
          :placeholder="Browser.I18n.getMessage('placeholder_ip')"
          type="text"
          v-model="ip"
        />
      </div>
      <div class="input-group-sm input-group" style="width: 280px">
        <span class="input-group-text">{{
          Browser.I18n.getMessage('form_label_tagsname')
        }}</span>
        <input
          class="form-control form-control-sm"
          :placeholder="Browser.I18n.getMessage('placeholder_iptags')"
          type="text"
          v-model="name"
        />
      </div>
      <i class="bi bi-plus-circle-fill icon-btn" @click="addTags"></i>
    </div>
    <div style="height: 300px; width: fit-content" class="overflow-auto">
      <table class="table table-sm table-striped">
        <thead class="table-primary text-nowrap">
          <tr>
            <th
              class="ps-3"
              v-for="(item, index) in title"
              :key="index"
              :style="{ width: item.width }"
            >
              {{ item.name }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in list" class="text-nowrap" :key="index">
            <td class="text-truncate ps-3" style="width: 280px">
              {{ item }}
            </td>
            <td class="text-truncate ps-3" style="width: 280px">
              {{ iptags[item] }}
            </td>
            <td>
              <i
                class="bi bi-trash-fill icon-btn"
                @click="deleteTags(item)"
              ></i>
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
  width: 630px;
}

thead {
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
