<script setup>
import { getCurrentInstance, ref, onMounted, inject, onUnmounted } from 'vue'
import RuleItem from '../../components/InternalRuleGroup.vue'
import Browser from '@/Browser/main'
import { getNextLocalVersion } from '@/core/version_control.js'
import { addRuleItemForAuto } from '@/core/proxy_config.js'
import TempRuleMergeModal from '../dialog/TempRuleMergeModal.vue'
import { filterPrefixArray, sortDomain, log } from '@/core/utils'
import PopoverTips from '@/components/PopoverTips.vue'
import { useConfigStore } from '@/options/stores/config'

const showUploadConflictModal = inject('showUploadConflictModal')
const instance = getCurrentInstance()
const confirmModal = instance?.appContext.config.globalProperties.$confirm
const tempRuleMergeModal = ref(null)
const storeConfig = useConfigStore()

const tempRules = ref([])
const ruleList = ref([])

onMounted(() => {
  load()
  Browser.Storage.addChangedListener(handleStorageChanged)
})

onUnmounted(() => {
  Browser.Storage.removeChangedListener(handleStorageChanged)
})

function handleStorageChanged(changes, areaName) {
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
}

async function load() {
  const result = await Browser.Storage.getSession()
  tempRules.value = filterPrefixArray(result, 'tempRule_').filter(
    (element) => element.valid
  )
  log.debug('load tempRules', tempRules.value)
}

async function showMergeDialog(index) {
  // if index is null or undefined, merge all
  // else merge by suffix of tempRules[index]
  if (tempRuleMergeModal.value) {
    ruleList.value = tempRules.value.filter(
      (element) =>
        (index == null || element.suffix == tempRules.value[index].suffix) &&
        element.suffix !== ''
    )
    tempRuleMergeModal.value.show()
  }
}

async function remove(index) {
  // if index is null or undefined, remove all
  // else remove tempRules[index]
  const result = await Browser.Storage.getSession()
  const allTempRules = filterPrefixArray(result, 'tempRule_')

  const removeList = allTempRules
    .filter((element) => {
      return index == null || element.key == tempRules.value[index].key
    })
    .map((element) => element.key)

  await Browser.Storage.removeSession(removeList)
  await Browser.Proxy.reloadOrDirect()
  await load()
}

async function removeBySuffix(suffixList) {
  log.debug('removeBySuffix', suffixList)
  const result = await Browser.Storage.getSession()
  const allTempRules = filterPrefixArray(result, 'tempRule_')

  const removeList = allTempRules
    .filter((element) => {
      return suffixList.includes(element.suffix)
    })
    .map((element) => element.key)
  log.debug('removeBySuffix', removeList)
  await Browser.Storage.removeSession(removeList)
  await Browser.Proxy.reloadOrDirect()
  await load()
}

async function showClearDialog() {
  confirmModal.createConfirm(
    Browser.I18n.getMessage('modal_title_warning'),
    Browser.I18n.getMessage('modal_desc_reset'),
    async () => {
      await remove()
    }
  )
}

async function acceptMerge(mergeRule) {
  log.debug('acceptMerge', mergeRule)
  const result = await Browser.Storage.getLocalAll()
  // tempRules[index] has some keys not needed in local-rules
  const newRules = mergeRule.map((item) => {
    return {
      data: item.data,
      mode: item.mode,
      proxy: item.proxy,
      valid: true
    }
  })
  const newProxyConfig = addRuleItemForAuto(
    newRules,
    result[result.status_proxyKey]
  )
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    [result.status_proxyKey]: newProxyConfig,
    config_version: version
  })
  await removeBySuffix(mergeRule.map((item) => item.suffix))
  showUploadConflictModal()
}

async function accept(index) {
  const result = await Browser.Storage.getLocalAll()
  // tempRules[index] has some keys not needed in local-rules
  const newRules = []
  if (index != null) {
    newRules.push({
      data: tempRules.value[index].data,
      mode: tempRules.value[index].mode,
      proxy: tempRules.value[index].proxy,
      valid: true
    })
  } else {
    newRules.push([
      ...tempRules.value.map((item) => {
        return {
          data: item.data,
          mode: item.mode,
          proxy: item.proxy,
          valid: true
        }
      })
    ])
  }
  const newProxyConfig = addRuleItemForAuto(
    newRules,
    result[result.status_proxyKey]
  )
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    [result.status_proxyKey]: newProxyConfig,
    config_version: version
  })
  await remove(index)
  showUploadConflictModal()
}

async function showAcceptAllDialog() {
  confirmModal.createConfirm(
    Browser.I18n.getMessage('modal_title_info'),
    Browser.I18n.getMessage('modal_desc_accept_temprules'),
    accept
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
              ><PopoverTips
                class-name="bi bi-check-circle-fill icon-btn me-2 mt-1"
                :content="Browser.I18n.getMessage('iconbtn_accept_rule')"
                :hint="storeConfig.configIconBtnHint"
                @click="accept(index)"
              ></PopoverTips
              ><PopoverTips
                :iconStyle="{
                  visibility: tempRules[index].suffix == '' ? 'hidden' : 'show'
                }"
                class-name="bi bi-cart-check-fill icon-btn me-2 mt-1"
                :content="Browser.I18n.getMessage('iconbtn_merge_rule')"
                :hint="storeConfig.configIconBtnHint"
                @click="showMergeDialog(index)"
              ></PopoverTips>
            </template>
            <template #delete>
              <PopoverTips
                class-name="bi bi-trash-fill icon-btn mt-1"
                :content="Browser.I18n.getMessage('iconbtn_delete_rule')"
                :hint="storeConfig.configIconBtnHint"
                @click="remove(index)"
              ></PopoverTips>
            </template>
          </RuleItem>
        </div>
      </div>
      <div v-show="tempRules.length == 0" class="text-center text-muted">
        {{ Browser.I18n.getMessage('desc_list_empty') }}
      </div>
      <div class="hstack gap-3">
        <button
          class="btn btn-outline-secondary btn-sm ms-auto"
          @click="showClearDialog"
        >
          <i class="bi bi-reply-fill me-2"></i>
          <span>{{ Browser.I18n.getMessage('btn_label_empty_rules') }}</span>
        </button>
        <button class="btn btn-primary btn-sm" @click="showAcceptAllDialog">
          <i class="bi bi-check-circle-fill me-2"></i>
          <span>{{
            Browser.I18n.getMessage('btn_label_accept_all_rules')
          }}</span>
        </button>
        <button class="btn btn-primary btn-sm" @click="showMergeDialog()">
          <i class="bi bi-cart-check-fill me-2"></i>
          <span>{{
            Browser.I18n.getMessage('btn_label_merge_all_rules')
          }}</span>
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
