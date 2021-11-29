const { app, BrowserWindow, ipcMain, shell, Tray, Menu, dialog } = require('electron')
const log = require('electron-log')

const { PATHS, settings, cache } = require('./modules/data')
const hass = require('./modules/hass')
const itemBuilder = require('./modules/itemBuilder')
const { importConfig, exportConfig } = require('./modules/configuration')

// set some variables
const isWindows = process.platform === 'win32'
let refreshInterval = settings.get('refreshInterval') * 60 * 1000 // default to 30 minutes
let win, tray

if (isWindows && app.isPackaged && process.argv.length >= 2) {
  (async () => {
    await app.whenReady()
    dialog.showErrorBox({
      title: 'Feature Not Supported',
      message: 'Please import the configuration file from the preferences window.'
    })
    process.exit()
  })()
}

// open the preferences window
const openPreferences = () => {
  log.info('Opening preferences window')
  // show the preference window if one is already open
  if (win) return win.show()

  // create the preference window
  win = new BrowserWindow({
    width: 850,
    height: isWindows ? 700 : 670,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // once the window loads, send the settings and hass status
  win.webContents.on('did-finish-load', async () => {
    log.info('Preferences window finished loading. Sending settings, and hass status.')
    win.webContents.send('settings', {
      ...settings.getAll(),
      version: app.getVersion()
    })
    win.webContents.send('hassStatus', await hass.status())
  })

  // load the html
  win.loadURL(`file://${PATHS.PAGES.PREFERENCES}`)
}

// open a configuration file
const openLoadConfigDialog = () => {
  log.info('Opening load config dialog')

  const path = dialog.showOpenDialogSync({
    title: 'Open Configuration File',
    message: 'This file should end in .bar',
    properties: ['openFile'],
    filters: [
      { name: 'bar', extensions: ['bar'] }
    ]
  })

  log.info(path ? `Loading config file ${path}` : 'No config file selected. Doing nothing.')
  if (!path) return

  importConfig(path[0], () => { buildTray(openPreferences) })
}

// build tray menu
const buildTray = async () => {
  log.info('Building tray menu')

  // get latest config and hass status
  const { config } = settings.getAll()
  const hassStatus = await hass.status()

  // create the tray if one doesnt exist
  if (!tray) tray = new Tray(PATHS.MENUBAR_ICONS.TRANSPARENT)

  // open tray on click on windows
  isWindows && tray.on('click', () => tray.popUpContextMenu())

  // set the tray icon to be transparent to indicate reload
  tray.setImage(PATHS.MENUBAR_ICONS.TRANSPARENT)

  // initialize the menuTemplate and trayTitle
  let menuTemplate = []
  let trayTitle = ''

  // if not connected to hass...
  if (!hassStatus.connected) {
    log.info('Not connected to hass')
    // set tray image to red, and clear title
    tray.setImage(PATHS.MENUBAR_ICONS.ERROR)
    tray.setTitle('')

    // add unable to connect and retry items to window
    menuTemplate.push({
      label: 'Unable To Connect',
      enabled: false,
      icon: PATHS.ICONS.WARNING_ICON
    }, {
      label: 'Retry',
      click: () => { buildTray() }
    })
  } else {
    // otherwise, set the tray title
    if (!isWindows && config.titleTemplate) {
      trayTitle = await hass.render(config.titleTemplate)
    } else if (!isWindows && config.title) {
      trayTitle = config.title
    }

    log.info('Building items')
    // build the tray items
    menuTemplate = await itemBuilder(config.items, () => { buildTray() })
    // set the tray image
    tray.setImage(PATHS.MENUBAR_ICONS.DEFAULT)
  }

  // add constant items
  menuTemplate.push(
    { type: 'separator' },
    {
      label: 'Preferences',
      click: (_, __, event) => {
        event.shiftKey ? openLoadConfigDialog() : openPreferences()
      }
    },
    { label: 'Quit', click: () => { app.quit() }, role: 'quit' }
  )

  // set the tray context menu
  tray.setContextMenu(Menu.buildFromTemplate(menuTemplate))

  // set the tray title
  // substr makes sure the title is not too long
  tray.setTitle(trayTitle.substr(0, 34))

  // clear the cache for next time
  cache.clear()
}

// when app is opened from file...
app.on('open-file', async (event, path) => {
  log.info(`Config file opened: ${path}`)
  // prevent default
  event.preventDefault()
  // load the file
  importConfig(path, () => { buildTray(openPreferences) })
  // if there is a window open... reload it
  if (win) win.reload()
})

// when app is ready...
app.on('ready', async () => {
  log.info('App is ready')
  // hide from dock
  !isWindows && app.dock.hide()
  const autoRebuild = () => {
    // build the tray
    buildTray()
    // get the refresh interval
    refreshInterval = settings.get('refreshInterval') * 60 * 1000
    // if refreshInterval is not 0, set timeout for refresh
    refreshInterval !== 0 && setTimeout(autoRebuild, refreshInterval)
  }
  // build the tray
  autoRebuild()
})

// when the window is closed...
app.on('window-all-closed', () => {
  // set the window to null
  win = null
  // this also prevents the default behavior of quitting the app
})

// IPC

// when openIconsFolder is recieved
ipcMain.on('openIconsFolder', (_, __) => {
  log.info('Opening icons folder')
  // open the icons folder
  shell.openPath(PATHS.ICONS_FOLDER)
})

// when connect is recieved
ipcMain.on('connect', async (event, data) => {
  log.info('Testing HASS connection')
  // check the connection and return the results
  event.returnValue = await hass.test(data)
})

// when save is recieved
ipcMain.on('save', async (event, data) => {
  log.info('Saving config')
  // try...
  try {
    // set the settings
    settings.setAll(data)
    // set refresh interval
    refreshInterval = data.refreshInterval * 60 * 1000
    // set whether or not to open on startup
    app.setLoginItemSettings({ openAtLogin: data.openOnStart })
    // reload home assistant connection
    hass.reload()
    // build the tray
    buildTray(openPreferences)
    // if no errors then return that it was successful
    event.returnValue = {
      success: true
    }
  } catch (err) {
    log.info('Failed to save config')
    log.error(err)
    // on error... return the error
    event.returnValue = {
      success: false,
      message: err.message
    }
  }
})

// on save config...
ipcMain.on('exportConfig', (_, __) => {
  log.info('Exporting config')
  // open the save dialog
  const saveDir = dialog.showSaveDialogSync(win, {
    filters: [{ name: 'Config', extensions: ['bar'] }],
    showsTagField: false,
    defaultPath: 'config.bar'
  })
  log.info(saveDir ? `Saving config to ${saveDir}` : 'No config file selected. Doing nothing.')

  // if no save directory was selected... return
  if (!saveDir) return

  try {
    exportConfig(saveDir)
  } catch (err) {
    log.info('Failed to export config')
    log.error(err)
    dialog.showErrorBox('Cannot Save Configuration', err.message)
  }
})

// on load from file...
ipcMain.on('loadFromFile', (_, __) => {
  openLoadConfigDialog()
})

// on exit...
ipcMain.on('exit', (_, __) => {
  // close the window
  if (win) win.close()
})
