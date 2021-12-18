const path = require('path')
const fs = require('fs')
const electron = require('electron')

const isWindows = process.platform === 'win32'
const userDataPath = (electron.app || electron.remote.app).getPath('userData')

const settingsPath = path.join(userDataPath, 'settings.json')
const iconPath = path.join(__dirname, '..', 'assets')

const DEFAULT_SETTINGS = {
  url: '',
  llac: '',
  port: 8123,
  openOnStart: false,
  refreshInterval: 30,
  config: {
    items: [],
    title: ''
  }
}

class SpecialDictionary {
  constructor (filePath, defaults, validator) {
    // eslint complains when defaults aren't in the constructor
    this.writeToFile = false
    this.filePath = undefined
    this.data = {}
    this.defaults = undefined

    // if filePath is a string...
    if (filePath) {
      this.writeToFile = true
      this.filePath = filePath
      if (fs.existsSync(filePath)) this.data = JSON.parse(fs.readFileSync(filePath))
    }
    this.defaults = defaults
    this.validator = validator
  }

  set (key, value) {
    this.data[key] = value
    if (this.writeToFile) this.write()
  }

  get (key) {
    if (this.defaults && !this.data[key]) return this.defaults[key]
    return this.data[key]
  }

  getAll () {
    return { ...this.defaults, ...this.data }
  }

  setAll (data) {
    this.data = data
    if (this.writeToFile) this.write()
  }

  write (path) {
    fs.writeFileSync(path || this.filePath, JSON.stringify(this.data))
  }

  clear () {
    this.data = {}
    if (this.writeToFile) this.write()
  }

  validate (newData) {
    if (this.validator) return this.validator(newData || this.data)
  }
}

// export all of the different paths
module.exports = {
  PATHS: {
    MENUBAR_ICONS: {
      DEFAULT: path.join(iconPath, isWindows ? 'windows' : 'macos', isWindows ? 'icon@3x.png' : 'iconTemplate@3x.png'),
      TRANSPARENT: path.join(iconPath, isWindows ? 'windows' : 'macos', isWindows ? 'transparentIcon@3x.png' : 'transparentIconTemplate@3x.png'),
      WARNING_ICON: path.join(iconPath, isWindows ? 'windows' : 'macos', isWindows ? 'alert@2x.png' : 'alertTemplate@2x.png'),
      ERROR: path.join(iconPath, 'redIcon@3x.png')
    },
    ICONS_FOLDER: path.join(userDataPath, 'icons'),
    PAGES: {
      PREFERENCES: path.join(__dirname, '../views/preferences/index.html'),
      ICON_DOWNLOADER: path.join(__dirname, '../views/downloader/index.html')
    }
  },
  settings: new SpecialDictionary(settingsPath, DEFAULT_SETTINGS, configValidator),
  cache: new SpecialDictionary()
}

module.exports.DELETE_ALL_ICONS = () => {
  fs.rmSync(module.exports.PATHS.ICONS_FOLDER, { recursive: true })
  fs.mkdirSync(module.exports.PATHS.ICONS_FOLDER)
}

module.exports.PATHS.ICON_PATH_GENERATOR = (name) => {
  // make the path
  const iconPath = path.join(module.exports.PATHS.ICONS_FOLDER, name)
  // check if the icon exists... if it does return the path
  if (fs.existsSync(iconPath)) return iconPath
  // otherwise return the warning icon because the path wasn't found
  else return module.exports.PATHS.MENUBAR_ICONS.WARNING_ICON
}

// check if the icons folder doesnt exists
if (!fs.existsSync(module.exports.PATHS.ICONS_FOLDER)) {
  // create the icons folder
  fs.mkdirSync(module.exports.PATHS.ICONS_FOLDER)
}

// function to validate settings
function configValidator (settings) {
  // if the settings are undefined...
  if (!settings) {
    // return false
    console.log('settings are undefined')
    return false
  }
  // if the settings are not an object...
  if (typeof settings !== 'object') {
    // return false
    console.log('settings are not an object')
    return false
  }
  // if the settings do not contain a url...
  if (!settings.url) {
    // return false
    console.log('settings do not contain a url')
    return false
  }
  // if the settings do not contain a llac...
  if (!settings.llac) {
    // return false
    console.log('settings do not contain a llac')
    return false
  }
  // if the settings do not contain a port...
  if (!settings.port) {
    // return false
    console.log('settings do not contain a port')
    return false
  }
  // if the settings do not contain an openOnStart...
  if (!settings.openOnStart || typeof settings.openOnStart !== 'boolean') {
    // return false
    console.log('settings do not contain an openOnStart')
    return false
  }
  // if the settings do not contain a refresh interval...
  if (typeof settings.refreshInterval !== 'number' || settings.refreshInterval < 0) {
    // return false
    console.log('settings do not contain a refresh interval')
    return false
  }
  // if the settings do not contain a config...
  if (!settings.config) {
    // return false
    console.log('settings do not contain a config')
    return false
  }

  return true
}
