const HomeAssistant = require('homeassistant')
const { Notification } = require('electron')
const axios = require('axios')

const data = require('./data')
const settingsManager = data.settings
const cache = data.cache

let hass, settings

// define reload function
const reload = () => {
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
    // if successful, return true wih the api message
    return {
      valid: true,
      message: apiStatus.message
    }
  } catch (err) {
    // on error, return false and the error message
    return {
      valid: false,
      message: err.message
    }
  }
}

// function to check the status of hass
module.exports.status = async () => {
  // get latest settings
  const settings = settingsManager.getAll()

  // if any settings missing, return
  if (!settings.url || !settings.llac || !settings.port) {
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
    // if successful, return true wih the api message
    return {
      connected: true,
      message: apiStatus.data
    }
  } catch (err) {
    // on error, return false and the error message
    return {
      connected: false,
      message: err.message
    }
  }
}

// function to get the state of a hass entity
module.exports.state = async (entity) => {
  // try...
  try {
    // split the entity into domain and entityId
    const [domain, entityId] = entity.split('.')
    // get the state of the entity
    const response = await hass.states.get(domain, entityId)
    // if no state... return nothing
    if (!response.state) return
    // return response
    return response
  } catch (err) {
    // on error log error
    console.log(`Failed to get state for ${entity}. Heres the error`)
    console.error(err)
    // return nothing
    return undefined
  }
}

// function to run actions
module.exports.action = (action) => {
  // call the service
  hass.services.call(action.service, action.domain, action.serviceData)
    // when promise resolves...
    .then((res) => {
      // if the result is not a string then it was succesfull so return
      if (typeof res !== 'string') return
      // otherwise throw an error
      throw new Error(res)
    })
    // on error...
    .catch((err) => {
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
  // if the template is in the cache...
  if (cache.get(template)) {
    // return the cached template
    return cache.get(template)
  }
  // try...
  try {
    // render the template
    const value = await hass.templates.render(template)
    // if error message...
    if (value.message) {
      console.log(value)
      // return INVALID TEMPLATE
      return 'INVALID TEMPLATE'
    }
    // store in cache
    cache.set(template, value)
    // return the rendered template as a string
    return String(value)
  } catch (err) {
    // on error...
    // log the error
    console.log(template)
    console.log('Failed to render template. Heres the error')
    console.error(err)
    // return INVALID TEMPLATE
    return 'INVALID TEMPLATE'
  }
}
