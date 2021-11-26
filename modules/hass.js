const HomeAssistant = require('homeassistant')
const { Notification } = require('electron')
const log = require('electron-log')
const axios = require('axios')

const data = require('./data')
const settingsManager = data.settings
const cache = data.cache

let hass, settings

// define reload function
const reload = () => {
  log.info('Reloading hass connection')
  // get new settings
  settings = settingsManager.getAll()
  // create new hass instance
  hass = new HomeAssistant({
    host: settings.url,
    token: settings.llac,
    port: settings.port
  })
}
// reload so hass is defined
reload()

// export reload
module.exports.reload = reload

// make test function to test hass conneciton
module.exports.test = async (connection) => {
  log.info('Testing connection...')
  // extract the url, port, and long lived access token
  const { url, port, llac } = connection
  // try...
  try {
    // try sending req to hass
    const apiStatus = await axios({
      method: 'get',
      baseURL: `${url}:${port}`,
      url: '/api/',
      headers: {
        Authorization: `Bearer ${llac}`
      },
      timeout: 2500
    })
    log.info('Connection successful!')
    // if successful, return true wih the api message
    return {
      valid: true,
      message: apiStatus.message
    }
  } catch (err) {
    log.info('Connection failed' + err.message)
    // on error, return false and the error message
    return {
      valid: false,
      message: err.message
    }
  }
}

// function to check the status of hass
module.exports.status = async () => {
  log.info('Checking status...')
  // get latest settings
  const settings = settingsManager.getAll()

  // if any settings missing, return
  if (!settings.url || !settings.llac || !settings.port) {
    log.info('No settings found')
    return {
      connected: false,
      message: 'No settings found'
    }
  }

  // try...
  try {
    // try sending req to hass
    const apiStatus = await axios({
      method: 'get',
      baseURL: `${settings.url}:${settings.port}`,
      url: '/api/',
      headers: {
        Authorization: `Bearer ${settings.llac}`
      },
      timeout: 2500
    })
    log.info('Connection successful!')
    // if successful, return true wih the api message
    return {
      connected: true,
      message: apiStatus.data
    }
  } catch (err) {
    log.info('Connection failed' + err.message)
    // on error, return false and the error message
    return {
      connected: false,
      message: err.message
    }
  }
}

// function to run actions
module.exports.action = (action) => {
  log.info('Running action...')
  // call the service
  hass.services.call(action.service, action.domain, action.serviceData)
    // when promise resolves...
    .then((res) => {
      log.info('Action completed')
      // if the result is not a string then it was succesfull so return
      if (typeof res !== 'string') return
      // otherwise throw an error
      throw new Error(res)
    })
    // on error...
    .catch((err) => {
      log.info('Failed to call action ' + err.message)
      // show a notification with the error
      new Notification({
        title: 'Action Failed',
        body: err.message,
        silent: true
      }).show()
    })
}

// function to render a template
module.exports.render = async (template) => {
  log.debug('Rendering template...')
  log.debug(template)
  // if the template is in the cache...
  if (cache.get(template)) {
    log.debug('Template found in cache')
    // return the cached template
    return cache.get(template)
  }
  // try...
  try {
    // render the template
    const value = await hass.templates.render(template)
    // if error message...
    if (value.message) throw new Error(value.message)
    log.debug(`Template resolved to: ${String(value)}`)
    // store in cache
    cache.set(template, value)
    // return the rendered template as a string
    return String(value)
  } catch (err) {
    log.info('Failed to render template')
    log.error(err.message)
    // on error...
    // log the error
    // return INVALID TEMPLATE
    return 'INVALID TEMPLATE'
  }
}
