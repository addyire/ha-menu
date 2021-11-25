const { dialog, app, Notification } = require('electron')

const fs = require('fs')
const { settings } = require('./data')
const hass = require('./hass')

const loadFile = async (configPath, rebuildFunction) => {
  // if the configPath is undefined return
  if (!configPath) return

  // try...
  try {
    // read the file
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    // if settings are not valid... throw an error
    if (!settings.validate(config)) throw new Error('Invalid configuration file')
    // set the settings
    settings.setAll(config)
    // set whether or not to open on startup
    app.setLoginItemSettings({ openAtLogin: config.openOnStart })
    // reload home assistant connection
    hass.reload()
    // build the tray
    if (rebuildFunction) rebuildFunction()
    // show a notification
    new Notification({
      title: 'Configuration File Loaded',
      body: 'Your configuration file has been loaded successfully. Reloading items now.',
      silent: true
    }).show()
  } catch (err) {
    dialog.showErrorBox('Cannot Load Configuration', err.message)
  }
}

module.exports = {
  loadFile
}
