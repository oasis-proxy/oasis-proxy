<script setup>
import { getCurrentInstance } from 'vue'
import { resetAppConfig, convertToNewVersionConfig } from '@/core/app_config.js'
import { formatCode, log } from '@/core/utils'
import Browser from '@/Browser/main'

const instance = getCurrentInstance()
const toast = instance?.appContext.config.globalProperties.$toast
const confirmModal = instance?.appContext.config.globalProperties.$confirm

async function exportConfig() {
  const result = await Browser.Storage.getLocalAll()
  const backup = await formatCode(JSON.stringify(result), 'json')
  await Browser.saveFile(backup, 'backup.oas')
}

async function handleImportConfig(event) {
  const file = event.target.files[0]
  const reader = new FileReader()
  reader.onload = async function (event) {
    try {
      const tmpObj = JSON.parse(event.target.result)
      tmpObj.config_autoSync = false
      tmpObj.status_proxyKey = 'direct'
      const result = await Browser.Storage.getLocalAll()
      log.debug(Object.keys(result))
      await Browser.Storage.removeLocal(Object.keys(result))
      await Browser.Storage.setLocal(tmpObj)
      await convertToNewVersionConfig()
      toast.info(Browser.I18n.getMessage('desc_import_config_success'))
      setTimeout(() => {
        location.reload()
      }, 2000)
    } catch (err) {
      toast.warning(Browser.I18n.getMessage('desc_import_config_failed'))
      log.debug('Error: ', err)
    }
  }
  reader.readAsText(file)
}

function clearConfig() {
  confirmModal.createConfirm(
    Browser.I18n.getMessage('modal_title_resetall'),
    Browser.I18n.getMessage('modal_desc_resetall'),
    async function () {
      await Browser.Storage.clearLocal()
      const obj = resetAppConfig()
      await Browser.Storage.setLocal(obj)
      await Browser.Proxy.setDirect(async () => {
        await Browser.Storage.setLocal({ status_proxyKey: 'direct' })
        toast.info(Browser.I18n.getMessage('desc_set_proxy_direct'))
      })
      toast.info(Browser.I18n.getMessage('desc_init_config'))
      setTimeout(() => {
        location.reload()
      }, 2000)
    }
  )
}
</script>
<template>
  <div class="card">
    <div class="card-header">
      <div>
        <span class="fw-bold">{{
          Browser.I18n.getMessage('section_label_import_export')
        }}</span>
      </div>
    </div>
    <div class="card-body">
      <div class="hstack gap-3 mb-3">
        <div>
          <button class="btn btn-primary btn-sm" @click="exportConfig">
            <i class="bi bi-download me-2"></i>
            <span>{{
              Browser.I18n.getMessage('btn_label_export_config')
            }}</span>
          </button>
        </div>
        <div>{{ Browser.I18n.getMessage('desc_export') }}</div>
      </div>
      <div class="hstack gap-3 mb-3">
        <div>
          <label for="fileInput" class="btn btn-primary btn-sm">
            <i class="bi bi-upload me-2"></i>
            <span>
              <span>{{
                Browser.I18n.getMessage('btn_label_import_config')
              }}</span>
            </span>
            <input
              type="file"
              id="fileInput"
              class="d-none"
              @change="handleImportConfig"
            />
          </label>
        </div>
        <div>{{ Browser.I18n.getMessage('desc_import') }}</div>
      </div>
      <div class="hstack gap-3 mb-3">
        <div>
          <button @click="clearConfig" class="btn btn-danger btn-sm" id="clear">
            <i class="bi bi-trash-fill me-2"></i>
            <span>
              <span>{{
                Browser.I18n.getMessage('btn_label_clear_config')
              }}</span>
            </span>
          </button>
        </div>
        <div>{{ Browser.I18n.getMessage('desc_clear') }}</div>
      </div>
    </div>
  </div>
</template>
