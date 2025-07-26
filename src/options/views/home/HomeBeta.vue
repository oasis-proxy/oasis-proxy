<script setup>
import { watch } from 'vue'
import PopoverTips from '@/components/PopoverTips.vue'
import { useConfigStore } from '@/options/stores/config'
import Browser from '@/Browser/main'

const storeConfig = useConfigStore()

watch(
  () => storeConfig.configSiteRules,
  async (newValue) => {
    await Browser.Storage.setLocal({ config_siteRules: newValue })
  }
)

watch(
  () => storeConfig.configSiteRulesAutoRefresh,
  async (newValue) => {
    await Browser.Storage.setLocal({ config_siteRules_autoRefresh: newValue })
  }
)
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
        <div class="row mb-3 d-flex align-items-center">
          <label class="col-2 col-form-label">
            <span>{{ Browser.I18n.getMessage('section_label_site') }}</span>
          </label>
          <div class="col-10">
            <div class="form-check-sm d-flex align-items-center">
              <div class="form-check form-switch mt-1">
                <input
                  class="form-check-input form-check-input"
                  type="checkbox"
                  role="switch"
                  v-model="storeConfig.configSiteRules"
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
        <div
          class="row mb-3 d-flex align-items-center"
          v-if="storeConfig.configSiteRules"
        >
          <label class="col-2 col-form-label">
            <span>{{
              Browser.I18n.getMessage('form_label_auto_refresh')
            }}</span>
            <PopoverTips
              className="bi bi-question-circle-fill icon-btn ms-2"
              :content="
                Browser.I18n.getMessage('desc_auto_refresh_by_site_rule')
              "
            >
            </PopoverTips>
          </label>
          <div class="col-10">
            <div class="form-check-sm d-flex align-items-center">
              <div class="form-check form-switch mt-1">
                <input
                  class="form-check-input form-check-input"
                  type="checkbox"
                  role="switch"
                  v-model="storeConfig.configSiteRulesAutoRefresh"
                />
                <span>{{
                  storeConfig.configSiteRulesAutoRefresh == false
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
