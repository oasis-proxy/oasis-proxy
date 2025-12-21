<script setup>
import { inject } from 'vue'
import PopoverTips from '@/components/PopoverTips.vue'
import { useConfigStore } from '@/options/stores/config'
import Browser from '@/Browser/main'
import { getNextLocalVersion } from '@/core/version_control.js'
import {
  addQuickAddSiteRulesContextMenus,
  removeQuickAddSiteRulesContextMenus
} from '@/core/context_menus.js'

const showUploadConflictModal = inject('showUploadConflictModal')

const storeConfig = useConfigStore()

async function handleSiteRulesChange() {
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    config_siteRules: storeConfig.configSiteRules,
    config_version: version,
    config_syncTime: new Date().getTime()
  })
  if (storeConfig.configContextMenus) {
    if (storeConfig.configSiteRules) {
      await addQuickAddSiteRulesContextMenus()
    } else {
      await removeQuickAddSiteRulesContextMenus()
    }
  }
  showUploadConflictModal()
}

async function handleContextMenusChanged() {
  await Browser.Storage.setLocal({
    config_contextMenus: storeConfig.configContextMenus
  })
}
</script>

<template>
  <div class="tab-pane fade show" id="v-pills-beta">
    <div class="card">
      <div class="card-header">
        <span class="fw-bold">{{
          Browser.I18n.getMessage('tab_label_beta')
        }}</span>
      </div>
      <div class="card-body">
        <!-- section: menus -->
        <div class="row mb-3 d-flex align-items-center">
          <label class="col-2 col-form-label">
            <span>{{ Browser.I18n.getMessage('section_label_menus') }}</span>
          </label>
          <div class="col-10">
            <div class="form-check-sm d-flex align-items-center">
              <div class="form-check form-switch mt-1">
                <input
                  class="form-check-input form-check-input"
                  type="checkbox"
                  role="switch"
                  v-model="storeConfig.configContextMenus"
                  @change="handleContextMenusChanged"
                />
                <span>{{
                  storeConfig.configContextMenus
                    ? Browser.I18n.getMessage('input_label_on')
                    : Browser.I18n.getMessage('input_label_off')
                }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- section: site rule -->
        <div class="row mb-3 d-flex align-items-center">
          <label class="col-2 col-form-label">
            <span>{{ Browser.I18n.getMessage('section_label_site') }}</span>
            <PopoverTips
              className="bi bi-question-circle-fill icon-btn ms-2"
              :content="Browser.I18n.getMessage('popover_iconbtn_hint')"
            ></PopoverTips>
          </label>
          <div class="col-10">
            <div class="form-check-sm d-flex align-items-center">
              <div class="form-check form-switch mt-1">
                <input
                  class="form-check-input form-check-input"
                  type="checkbox"
                  role="switch"
                  v-model="storeConfig.configSiteRules"
                  @change="handleSiteRulesChange"
                />
                <span>{{
                  storeConfig.configSiteRules == false
                    ? Browser.I18n.getMessage('input_label_off')
                    : Browser.I18n.getMessage('input_label_on')
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
