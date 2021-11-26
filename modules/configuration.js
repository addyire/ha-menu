const { Notification, dialog } = require('electron')

const fs = require('fs')
const path = require('path')
const archiver = require('archiver')
const unzipper = require('unzipper')

const { settings, PATHS } = require('./data')

// function to export configuration
const exportConfig = (savePath) => {
  // if no path... return
  if (!savePath) return

  // create the archive and set where to output
  const archive = archiver('zip')
  archive.pipe(fs.createWriteStream(savePath))

  // set handlers
  archive.on('warning', console.warn)
  archive.on('error', (err) => {
    dialog.showErrorBox('Export Error', 'There was an error exporting your configuration file. \n' + err)
  })

  // add the config file
  archive.append(JSON.stringify(settings.getAll()), { name: 'config.json' })
  // add the icons folder
  archive.directory(PATHS.ICONS_FOLDER, 'icons')
  // finalize the archive
  archive.finalize()
}

// function to import configuration
const importConfig = (filePath, rebuildFunction) => {
  // if no path or file doesn't exist... return
  if (!filePath || !fs.existsSync(filePath)) return

  // open the file
  fs.createReadStream(filePath)
    // pipe to unzipper
    .pipe(unzipper.Parse())
    // on file...
    .on('entry', async (entry) => {
      // try...
      try {
        // if the entry is the config file...
        if (entry.path === 'config.json') {
          // set the settings
          settings.setAll(JSON.parse(await entry.buffer()))
        } else if (entry.path.startsWith('icons/')) { // if the entry is in the icons folder...
          // if the entry is a directory...
          if (entry.type === 'Directory') {
            // create the directory recursively
            fs.mkdirSync(path.join(PATHS.ICONS_FOLDER, entry.path.replace('icons/', '')), { recursive: true })
          } else { // otherwise...
            // write the icon file
            entry.pipe(fs.createWriteStream(path.join(PATHS.ICONS_FOLDER, entry.path.replace('icons/', ''))))
          }
        } else { // if none of the above...
          // unkown file, ignore
          console.log('unkown item', entry.path)
          entry.autodrain()
        }
      } catch (err) {
        // on error...
        dialog.showErrorBox('Import Error', 'Something is wrong with your configuration file. \n' + err)
      }
    })
    // on finished...
    .on('finish', () => {
      // display notificiation
      new Notification({
        title: 'Configuration File Imported',
        body: 'Your configuration file has been imported successfully.',
        silent: true
      }).show()
      // if rebuild function is defined... run it
      if (rebuildFunction) rebuildFunction()
    })
    // on error...
    .on('error', (err) => {
      // show error
      dialog.showErrorBox('Import Error', 'Something is wrong with your configuration file. \n' + err)
    })
}

module.exports = {
  importConfig,
  exportConfig
}
