const { ipcMain } = require('electron')
const axios = require('axios')
const log = require('electron-log')
const fs = require('fs')
const path = require('path')

const { PATHS } = require('./data.js')

const ICON_URL = 'https://materialdesignicons.com/api'

const COLORS = {
  white: 'FFFFFF',
  black: '000000'
}
const SIZES = {
  small: 24,
  medium: 32,
  large: 48
}

let icons

async function loadIcons () {
  icons = icons || await getIcons()
}

async function clearIcons () {
  icons = null
}

async function iconExists (name) {
  try {
    icons = icons || await getIcons()
    if (!icons) {
      return false
    }

    const icon = icons.find(icon => icon.name === name)
    return !!icon
  } catch (error) {
    log.error('Encountered error while checking if icon exists', error)
    return false
  }
}

async function downloadIcon (name, fileName, size, color) {
  try {
    log.info(`Downloading ${name} to ${fileName} with size ${size} and color ${color}`)

    icons = icons || await getIcons()
    if (!icons) {
      return {
        success: false,
        message: 'Could not fetch icons. (Connection Error)'
      }
    }

    const icon = icons.find(icon => icon.name === name)
    if (!icon) {
      return {
        success: false,
        message: `I could not find an icon called "${name}"`
      }
    }

    size = SIZES[size]
    color = COLORS[color]

    const iconDownload = await axios.get(`${ICON_URL}/download/${icon.id}/${color}/1/FFFFFF/0/${size}`, { responseType: 'stream' })
    iconDownload.data.pipe(fs.createWriteStream(path.join(PATHS.ICONS_FOLDER, fileName + '.png')))

    return {
      success: true
    }
  } catch (err) {
    log.error('Encountered error while downloading icon', err)
    return {
      success: false,
      message: err.message
    }
  }
}

async function getIcons () {
  log.info('Fetching icons')
  try {
    const icons = (await axios.get(ICON_URL + '/package/38EF63D0-4744-11E4-B3CF-842B2B6CFE1B')).data.icons
    log.info(`Fetched ${icons.length} icons`)
    return icons
  } catch (error) {
    log.error('Encountered error while fetching icon packages', error)
    return undefined
  }
}

// on download icon request...
ipcMain.on('download-icon', async (event, data) => {
  // extract the data from the payload
  const { name, fileName, size, color } = data
  // try to download the icon
  const result = await downloadIcon(name, fileName, size, color)
  // return the result
  event.returnValue = result
})

// on icon-exists...
ipcMain.on('icon-exists', async (event, iconName) => {
  // try to check if the icon exists
  event.returnValue = await iconExists(iconName)
})

module.exports = {
  loadIcons,
  clearIcons
}
