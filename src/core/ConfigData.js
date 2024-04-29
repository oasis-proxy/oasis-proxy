export const downloadUrl = async function (url, format = '') {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    let rawdata = await response.text()
    const curr = new Date().toLocaleString()
    if (format == 'base64') {
      rawdata = rawdata.replace(/\r?\n/g, '')
      const regstr =
        /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
      let base64data = ''
      if (regstr.test(rawdata)) {
        base64data = atob(rawdata)
      }
      return { data: base64data, updated: curr }
    } else {
      return { data: rawdata, updated: curr }
    }
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error)
  }
}

export const simplify = function (config) {
  const simplifyConfig = {}
  for (const key of Object.keys(config)) {
    if (key.startsWith('config_')) {
      simplifyConfig[key] = config[key]
    } else if (key.startsWith('proxy_')) {
      switch (config[key].mode) {
        case 'auto':
          simplifyConfig[key] = config[key]
          if (config[key].config.rules.external.url != '') {
            simplifyConfig[key].config.rules.external.data = ''
          }
          if (config[key].config.rules.reject.url != '') {
            simplifyConfig[key].config.rules.reject.data = ''
          }
          break
        case 'pac_script':
          simplifyConfig[key] = config[key]
          if (config[key].config.rules.url != '') {
            simplifyConfig[key].config.rules.data = ''
          }
          break
        case 'fixed_servers':
          simplifyConfig[key] = config[key]
          break
        default:
          break
      }
    }
  }
  return simplifyConfig
}

export const enrich = async function (config) {
  const enrichConfig = {
    direct: { mode: 'direct', name: 'direct', config: { mode: 'direct' } },
    system: { mode: 'system', name: 'system', config: { mode: 'system' } },
    reject: {
      mode: 'reject',
      name: 'reject',
      config: { mode: 'reject', rules: 'HTTPS 127.0.0.1:65432' }
    }
  }
  for (const key of Object.keys(config)) {
    if (key.startsWith('config_')) {
      enrichConfig[key] = config[key]
    } else if (key.startsWith('proxy_')) {
      let response
      switch (config[key].mode) {
        case 'auto':
          enrichConfig[key] = config[key]
          if (config[key].config.rules.external.url != '') {
            response = await downloadUrl(
              config[key].config.rules.external.url,
              'base64'
            )
            enrichConfig[key].config.rules.external.data = response.data
            enrichConfig[key].config.rules.external.urlUpdatedAt =
              response.updated
          }
          if (config[key].config.rules.reject.url != '') {
            response = await downloadUrl(
              config[key].config.rules.reject.url,
              'base64'
            )
            enrichConfig[key].config.rules.reject.data = response.data
            enrichConfig[key].config.rules.reject.urlUpdatedAt =
              response.updated
          }
          break
        case 'pac_script':
          enrichConfig[key] = config[key]
          if (config[key].config.rules.url != '') {
            response = await downloadUrl(config[key].config.rules.url, 'base64')
            enrichConfig[key].config.rules.data = response.data
            enrichConfig[key].config.rules.urlUpdatedAt = response.updated
          }
          break
        case 'fixed_servers':
          enrichConfig[key] = config[key]
          break
        default:
          break
      }
    }
  }

  return enrichConfig
}
