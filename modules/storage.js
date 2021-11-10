// thanks medium.com for this great class
const electron = require('electron')
const path = require('path')
const fs = require('fs')

let cache = {}

const userDataPath = (electron.app || electron.remote.app).getPath('userData')
const settingsPath = path.join(userDataPath, 'settings.json')

let settings = {
  url: '',
  llac: '',
  port: 8123,
  refreshInterval: 1800,
  config: {
    items: [
      {
        type: 'label',
        label: 'Welcome!'
      }
    ]
  }
}

if (readSettings()) {
  settings = readSettings()
}

module.exports = {
  settings: {
    set: (allSettings) => {
      settings = allSettings
      storeSettings()
    },
    get: () => {
      return settings
    }
  },
  cache: {
    set: (key, value) => {
      cache[key] = value
    },
    get: (key) => {
      return cache[key]
    },
    clear: () => {
      cache = {}
    }
  },
  path: userDataPath
}

function storeSettings () {
  fs.writeFileSync(settingsPath, JSON.stringify(settings))
}

function readSettings () {
  try {
    let data = fs.readFileSync(settingsPath)
    if (!data) return undefined
    data = JSON.parse(data)
    return data
  } catch (e) {
    return undefined
  }
}
