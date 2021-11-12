
const path = require('path')
const settings = require('./storage')
const fs = require('fs')

module.exports = {
  MENUBAR_ICONS: {
    DEFAULT: path.join(__dirname, '../assets/iconTemplate@3x.png'),
    TRANSPARENT: path.join(__dirname, '../assets/transparentIconTemplate@3x.png'),
    ERROR: path.join(__dirname, '../assets/redIcon@3x.png')
  },
  ICONS: {
    WARNING_ICON: path.join(__dirname, '../assets/alertTemplate@2x.png')
  },
  ICONS_FOLDER: path.join(settings.path, 'icons'),
  PAGES: {
    PREFERENCES: path.join(__dirname, '../views/preferences.html')
  }
}

module.exports.ICON_GENERATOR = (name) => {
  const iconPath = path.join(module.exports.ICONS_FOLDER, name)
  if (fs.existsSync(iconPath)) return iconPath
  return module.exports.WARNING_ICON
}

if (!fs.existsSync(module.exports.ICONS_FOLDER)) {
  fs.mkdirSync(module.exports.ICONS_FOLDER)
}
