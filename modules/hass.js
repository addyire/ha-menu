const HomeAssistant = require('homeassistant')
const axios = require('axios')

const storage = require('./storage')
const settingsManager = storage.settings
const cache = storage.cache

let hass, settings

const reload = () => {
  settings = settingsManager.get()
  hass = new HomeAssistant({
    host: settings.url,
    token: settings.llac,
    port: settings.port
  })
}
reload()

module.exports.reload = reload

module.exports.test = async (connection) => {
  const { url, port, llac } = connection
  try {
    const apiStatus = await axios({
      method: 'get',
      baseURL: `${url}:${port}`,
      url: '/api/',
      headers: {
        Authorization: `Bearer ${llac}`
      },
      timeout: 2500
    })
    return {
      valid: true,
      message: apiStatus.message
    }
  } catch (err) {
    return {
      valid: false,
      message: err.message
    }
  }
}

module.exports.status = async () => {
  const settings = settingsManager.get()

  if (!settings.url || !settings.llac || !settings.port) {
    return {
      connected: false,
      message: 'No settings found'
    }
  }

  try {
    const apiStatus = await axios({
      method: 'get',
      baseURL: `${settings.url}:${settings.port}`,
      url: '/api/',
      headers: {
        Authorization: `Bearer ${settings.llac}`
      },
      timeout: 2500
    })
    return {
      connected: true,
      message: apiStatus.data
    }
  } catch (err) {
    console.log('status resulted in error')
    return {
      connected: false,
      message: err.message
    }
  }
}

module.exports.state = async (entity) => {
  try {
    const [domain, entityId] = entity.split('.')
    const response = await hass.states.get(domain, entityId)
    if (!response.state) return
    return response
  } catch (err) {
    console.log(`Failed to get state for ${entity}. Heres the error`)
    console.error(err)
    return undefined
  }
}

module.exports.action = (action) => {
  hass.services.call(action.service, action.domain, action.serviceData).catch((err) => {
    console.log('Failed to call this action:', action)
    console.error(err)
  })
}

module.exports.render = async (template) => {
  if (cache.get(template)) {
    return cache.get(template)
  }
  try {
    const value = await hass.templates.render(template)
    if (value.message) {
      return 'INVALID TEMPLATE'
    }
    cache.set(template, value)
    return String(value)
  } catch (err) {
    console.log(template)
    console.log('Failed to render template. Heres the error')
    console.error(err)
    return 'INVALID TEMPLATE'
  }
}
