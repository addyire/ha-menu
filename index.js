const { app, BrowserWindow, ipcMain, shell, Tray, Menu } = require('electron')

const PATHS = require('./modules/paths')
const { settings, cache } = require('./modules/storage')
const hass = require('./modules/hass')
const itemBuilder = require('./modules/itemBuilder')

const refreshInterval = 30 * 60 * 1000
let win, tray

const openPreferences = () => {
  if (win) return win.show()

  win = new BrowserWindow({
    width: 850,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.webContents.on('did-finish-load', async () => {
    win.webContents.send('settings', {
      ...settings.get(),
      version: app.getVersion()
    })
    win.webContents.send('hassStatus', await hass.status())
  })

  win.loadURL(`file://${PATHS.PAGES.PREFERENCES}`)
}

const buildTray = async () => {
  const { config } = settings.get()
  const hassStatus = await hass.status()

  if (!tray) tray = new Tray(PATHS.MENUBAR_ICONS.DEFAULT)

  let menuTemplate = []
  let trayTitle = ''

  if (!config.items || config.items.length === 0) {
    tray.setImage(PATHS.MENUBAR_ICONS.TRANSPARENT)
    tray.setTitle('')
    menuTemplate.push({
      label: 'No Items To Display',
      enabled: false
    })
  } else if (!hassStatus.connected) {
    tray.setImage(PATHS.MENUBAR_ICONS.ERROR)
    tray.setTitle('')
    menuTemplate.push({
      label: 'Unable To Connect',
      enabled: false,
      icon: PATHS.ICONS.WARNING_ICON
    }, {
      label: 'Retry',
      click: () => { buildTray() }
    })
  } else {
    if (config.titleTemplate) {
      trayTitle = await hass.render(config.titleTemplate)
    } else if (config.title) {
      trayTitle = config.title
    }

    tray.setImage(PATHS.MENUBAR_ICONS.DEFAULT)
    menuTemplate = await itemBuilder(config.items, () => { buildTray() })
  }

  menuTemplate.push(
    { type: 'separator' },
    { label: 'Preferences', click: () => { openPreferences() } },
    { label: 'Quit', click: () => { app.quit() }, role: 'quit' }
  )

  tray.setContextMenu(Menu.buildFromTemplate(menuTemplate))
  tray.setTitle(trayTitle.substr(0, 34))

  cache.clear()
}

app.on('ready', async () => {
  app.dock.hide()
  buildTray()
  setInterval(buildTray, refreshInterval)
})

app.on('window-all-closed', () => {
  win = null
})

// IPC

ipcMain.on('openIconsFolder', (_, __) => {
  shell.openPath(PATHS.ICONS_FOLDER)
})

ipcMain.on('connect', async (event, data) => {
  event.returnValue = await hass.test(data)
})

ipcMain.on('save', async (event, data) => {
  try {
    settings.set(data)
    app.setLoginItemSettings({ openAtLogin: data.openOnStart })
    hass.reload()
    buildTray(openPreferences)
    event.returnValue = {
      success: true
    }
  } catch (err) {
    event.returnValue = {
      success: false,
      message: err.message
    }
  }
})

ipcMain.on('exit', (_, __) => {
  if (win) win.close()
})
