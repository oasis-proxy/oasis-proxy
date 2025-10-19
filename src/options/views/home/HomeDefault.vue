<script setup>
import { watch, inject } from 'vue'
import PopoverTips from '@/components/PopoverTips.vue'
import HomeDefaultProfile from './HomeDefaultProfile.vue'
import HomeDefaultSync from './HomeDefaultSync.vue'
import { useConfigStore } from '@/options/stores/config'
import Browser from '@/Browser/main'
import { getNextLocalVersion } from '@/core/version_control.js'

const showUploadConflictModal = inject('showUploadConflictModal')

const storeConfig = useConfigStore()

const isDebug = import.meta.env.VITE_APP_DEBUG == 'debug'
watch(
  () => storeConfig.configUI,
  async (newValue) => {
    await Browser.Storage.setLocal({ config_ui: newValue })
  }
)

async function handleUpdateUrlChange() {
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    config_updateUrl: storeConfig.configUpdateUrl,
    config_version: version,
    config_syncTime: new Date().getTime()
  })
  showUploadConflictModal()
}

async function handleAutoRefreshChange() {
  const version = await getNextLocalVersion()
  await Browser.Storage.setLocal({
    config_autoRefresh: storeConfig.configAutoRefresh,
    config_version: version,
    config_syncTime: new Date().getTime()
  })
  showUploadConflictModal()
}
</script>

<template>
  <div class="tab-pane fade show active" id="v-pills-default">
    <div class="card">
      <div class="card-header">
        <span class="fw-bold">{{
          Browser.I18n.getMessage('section_label_extention_setting')
        }}</span>
      </div>
      <div class="card-body">
        <div class="row mb-3 d-flex align-items-center">
          <label class="col-2 col-form-label">{{
            Browser.I18n.getMessage('form_label_ui_config')
          }}</label>
          <div class="col-10 d-flex align-items-center">
            <div class="form-check-sm form-check-inline">
              <input
                class="form-check-input"
                type="radio"
                value="light"
                id="uiLight"
                v-model="storeConfig.configUI"
              />
              <label class="form-check-label" for="uiLight">
                <i class="bi bi-sun-fill ms-2 me-2"></i>
                <span>{{
                  Browser.I18n.getMessage('input_label_ui_light')
                }}</span>
              </label>
            </div>
            <div class="form-check-sm form-check-inline">
              <input
                class="form-check-input"
                type="radio"
                value="dark"
                id="uiDark"
                v-model="storeConfig.configUI"
              />
              <label class="form-check-label" for="uiDark">
                <i class="bi bi-moon-stars-fill ms-2 me-2"></i>
                <span>{{
                  Browser.I18n.getMessage('input_label_ui_dark')
                }}</span>
              </label>
            </div>
            <div class="form-check-sm form-check-inline">
              <input
                class="form-check-input"
                type="radio"
                value="system"
                id="uiSystem"
                v-model="storeConfig.configUI"
              />
              <label class="form-check-label" for="uiSystem">
                <i class="bi bi-circle-half ms-2 me-2"></i>
                <span>{{
                  Browser.I18n.getMessage('input_label_ui_system')
                }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="row mb-3 d-flex align-items-center">
          <label class="col-2 col-form-label">
            <span>{{ Browser.I18n.getMessage('form_label_rule_update') }}</span>
            <PopoverTips
              className="bi bi-question-circle-fill icon-btn ms-2"
              :content="Browser.I18n.getMessage('popover_update_url')"
            ></PopoverTips>
          </label>
          <div class="col-10">
            <div class="form-check-sm col-4">
              <select
                class="form-select form-select-sm"
                v-model="storeConfig.configUpdateUrl"
                @change="handleUpdateUrlChange"
              >
                <option value="manual">
                  {{ Browser.I18n.getMessage('input_selection_manual') }}
                </option>
                <option value="24h">
                  {{ Browser.I18n.getMessage('input_selection_24h') }}
                </option>
                <option value="12h">
                  {{ Browser.I18n.getMessage('input_selection_12h') }}
                </option>
                <option value="6h">
                  {{ Browser.I18n.getMessage('input_selection_6h') }}
                </option>
                <option value="3h">
                  {{ Browser.I18n.getMessage('input_selection_3h') }}
                </option>
                <option value="1h">
                  {{ Browser.I18n.getMessage('input_selection_1h') }}
                </option>
                <option value="15m">
                  {{ Browser.I18n.getMessage('input_selection_15m') }}
                </option>
                <option value="1m" v-if="isDebug">
                  {{ Browser.I18n.getMessage('input_selection_1m') }}
                </option>
                <option value="disableAll">
                  {{ Browser.I18n.getMessage('input_selection_disable_all') }}
                </option>
              </select>
            </div>
          </div>
        </div>
        <!-- section: auto refresh -->
        <div class="row mb-3 d-flex align-items-center">
          <label class="col-2 col-form-label">
            <span>{{
              Browser.I18n.getMessage('form_label_auto_refresh')
            }}</span>
            <PopoverTips
              className="bi bi-question-circle-fill icon-btn ms-2"
              :content="
                Browser.I18n.getMessage('desc_auto_refresh_by_switch_proxy')
              "
            ></PopoverTips>
          </label>
          <div class="col-10">
            <div class="form-check-sm d-flex align-items-center">
              <div class="form-check form-switch mt-1">
                <input
                  class="form-check-input form-check-input"
                  type="checkbox"
                  role="switch"
                  v-model="storeConfig.configAutoRefresh"
                  @change="handleAutoRefreshChange"
                />
                <span>{{
                  storeConfig.configAutoRefresh == false
                    ? Browser.I18n.getMessage('input_label_off')
                    : Browser.I18n.getMessage('input_label_on')
                }}</span>
              </div>
            </div>
          </div>
        </div>
        <HomeDefaultSync></HomeDefaultSync>
      </div>
    </div>
    <HomeDefaultProfile></HomeDefaultProfile>
  </div>
</template>
