const { app, BrowserWindow, ipcMain, shell, Tray, Menu } = require('electron')

const PATHS = require('./modules/paths')
const { settings, cache } = require('./modules/storage')
const hass = require('./modules/hass')
const itemBuilder = require('./modules/itemBuilder')

const refreshInterval = 60 * 1000
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
    win.webContents.send('settings', settings.get())
    win.webContents.send('hassStatus', await hass.status())
  })

  win.loadURL(`file://${PATHS.PAGES.PREFERENCES}`)
}

const buildTray = async (openPreferences) => {
  const { config } = settings.get()
  const hassStatus = await hass.status()
  let menuTemplate = []

  if (!tray) tray = new Tray(PATHS.ICON)

  if (!hassStatus.connected || !config.items || config.items.length === 0) {
    tray.setImage(PATHS.ERROR_ICON)
    tray.setTitle('')
    menuTemplate.push({
      label: !hassStatus.connected ? 'Unable to connect' : 'No items to display',
      enabled: false
    })
  } else {
    tray.setImage(PATHS.ICON)
    menuTemplate = await itemBuilder(config.items, () => { buildTray(openPreferences) })
  }

  menuTemplate.push(
    { type: 'separator' },
    { label: 'Preferences', click: () => { openPreferences() } },
    { label: 'Quit', click: () => { app.quit() }, role: 'quit' }
  )

  tray.setContextMenu(Menu.buildFromTemplate(menuTemplate))

  let trayTitle = ''

  if (config.titleTemplate) {
    trayTitle = await hass.render(config.titleTemplate)
  } else if (config.title) {
    trayTitle = config.title
  }

  tray.setTitle(trayTitle.substr(0, 34))
  cache.clear()
}

app.on('ready', async () => {
  const autoUpdate = async () => {
    buildTray(openPreferences)
    app.dock.hide()
    setTimeout(autoUpdate, refreshInterval)
  }
  autoUpdate()
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
  settings.set(data)
  hass.reload()
  buildTray(openPreferences)
})

ipcMain.on('exit', (_, __) => {
  if (win) win.close()
})

ipcMain.on('validateConfig', async (event, data) => {
  try {
    await itemBuilder(data.items)
    event.returnValue = {
      valid: true
    }
  } catch (err) {
    event.returnValue = {
      valid: false,
      message: err.message
    }
  }
})
