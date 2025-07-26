<script setup>
import { getCurrentInstance, ref, onMounted, inject } from 'vue'
import RuleItem from '../../components/InternalRuleGroup.vue'
import Browser from '@/Browser/main'
import { getNextLocalVersion } from '@/core/version_control.js'
import { addLocalRuleItemForAuto } from '@/core/proxy_config.js'
import TempRuleMergeModal from '../dialog/TempRuleMergeModal.vue'
import { filterPrefixArray, sortDomain } from '@/core/utils'

const showUploadConflictModal = inject('showUploadConflictModal')
const instance = getCurrentInstance()
const confirmModal = instance?.appContext.config.globalProperties.$confirm
const tempRuleMergeModal = ref(null)

const tempRules = ref([])
const ruleList = ref([])

onMounted(() => {
  load()

  chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName !== 'session') {
      return
    }
    Object.keys(changes).forEach((key) => {
      if (!key.startsWith('tempRule_')) {
        return
      }
      if (changes[key].newValue && changes[key].newValue.valid) {
        // insert into list
        const i = tempRules.value.findIndex(
          (rule) => sortDomain(changes[key].newValue.data, rule.data) < 0
        )
        if (i == -1) {
          tempRules.value.push(changes[key].newValue)
        } else {
          tempRules.value.splice(i, 0, changes[key].newValue)
        }
      } else if (changes[key].oldValue && changes[key].oldValue.valid) {
        // remove from list
        const i = tempRules.value.findIndex(
          (rule) => rule.data == changes[key].oldValue.data
        )
        tempRules.value.splice(i, 1)
      }
    })
  })
})

async function load() {
  const result = await Browser.Storage.getSession()
  tempRules.value = filterPrefixArray(result, 'tempRule_').filter(
    (element) => element.valid
  )
}

async function showMergeDialog(index) {
  if (tempRuleMergeModal.value) {
    ruleList.value = tempRules.value.filter(
      (element) => element.suffix == tempRules.value[index].suffix
    )

    tempRuleMergeModal.value.show()
  }
}

async function remove(index) {
  const result = await Browser.Storage.getSession()
  const allTempRules = filterPrefixArray(result, 'tempRule_')

  const removeList = allTempRules
    .filter((element) => {
      return element.data == tempRules.value[index].data
    })
    .map((element) => 'tempRule_' + element.data + '_' + element.siteRule)
  await Browser.Storage.removeSession(removeList)
  await Browser.Proxy.reloadOrDirect()
  await load()
}

async function removeBySuffix(suffix) {
  const result = await Browser.Storage.getSession()
  const allTempRules = filterPrefixArray(result, 'tempRule_')

  const removeList = allTempRules
    .filter((element) => {
      return element.suffix == suffix
    })
    .map((element) => 'tempRule_' + element.data + '_' + element.siteRule)
  await Browser.Storage.removeSession(removeList)
  await Browser.Proxy.reloadOrDirect()
  await load()
}

async function clear() {
  confirmModal.createConfirm(
    Browser.I18n.getMessage('modal_title_warning'),
    Browser.I18n.getMessage('modal_desc_reset'),
    async () => {
      const result = await Browser.Storage.getSession()
      const removeList = filterPrefixArray(result, 'tempRule_').map(
        (element) => 'tempRule_' + element.data + '_' + element.siteRule
      )
      await Browser.Storage.removeSession(removeList)
      await Browser.Proxy.reloadOrDirect()
      await load()
    }
  )
}

async function acceptMerge(mergeRule) {
  const result = await Browser.Storage.getLocalAll()
  const newProxyConfig = addLocalRuleItemForAuto(
    [mergeRule],
    result[result.status_proxyKey]
  )
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    [result.status_proxyKey]: newProxyConfig,
    config_version: version
  })
  removeBySuffix(mergeRule.data)
  showUploadConflictModal()
}

async function accept(index) {
  const result = await Browser.Storage.getLocalAll()
  const newProxyConfig = addLocalRuleItemForAuto(
    [tempRules.value[index]],
    result[result.status_proxyKey]
  )
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    [result.status_proxyKey]: newProxyConfig,
    config_version: version
  })
  remove(index)
  showUploadConflictModal()
}

async function acceptAll() {
  confirmModal.createConfirm(
    Browser.I18n.getMessage('modal_title_warning'),
    Browser.I18n.getMessage('modal_desc_reset'),
    async () => {
      const result = await Browser.Storage.getLocalAll()
      const newProxyConfig = addLocalRuleItemForAuto(
        tempRules.value,
        result[result.status_proxyKey]
      )
      const version = await getNextLocalVersion()
      await Browser.Storage.setLocal({
        [result.status_proxyKey]: newProxyConfig,
        config_version: version
      })
      clear()
      showUploadConflictModal()
    }
  )
}
</script>

<template>
  <div class="card">
    <div class="card-header">
      <span class="fw-bold">{{
        Browser.I18n.getMessage('aside_label_temp_rules')
      }}</span>
    </div>
    <div class="card-body">
      <div class="mb-3">
        <div v-for="(element, index) in tempRules" :key="index">
          <RuleItem
            :key="index"
            :is-draggable="false"
            v-model="tempRules[index]"
          >
            <template #operation
              ><i
                class="bi bi-check-circle-fill icon-btn me-2 mt-1"
                @click="accept(index)"
              ></i
              ><i
                class="bi bi-folder-fill icon-btn me-2 mt-1"
                @click="showMergeDialog(index)"
              ></i>
            </template>
            <template #delete>
              <i
                class="bi bi-trash-fill icon-btn mt-1"
                @click="remove(index)"
              ></i>
            </template>
          </RuleItem>
        </div>
      </div>
      <div class="hstack gap-3">
        <button class="btn btn-outline-secondary btn-sm ms-auto" @click="clear">
          <i class="bi bi-reply-fill me-2"></i>
          <span>清空规则</span>
        </button>
        <button class="btn btn-primary btn-sm" @click="acceptAll">
          <i class="bi bi-check-circle-fill me-2"></i>
          <span>接受所有</span>
        </button>
      </div>
    </div>
  </div>
  <TempRuleMergeModal
    ref="tempRuleMergeModal"
    v-model="ruleList"
    @submit="acceptMerge"
  ></TempRuleMergeModal>
</template>
