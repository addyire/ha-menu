const { ipcRenderer } = require('electron')

const elements = {
  buttons: {
    connect: document.getElementById('connect'),
    openIcons: document.getElementById('open-icons'),
    save: document.getElementById('save'),
    exit: document.getElementById('exit'),
    saveConfig: document.getElementById('saveConfig'),
    loadFile: document.getElementById('loadFile'),
    paste: document.getElementById('paste'),
    iconDownloader: document.getElementById('icon-downloader'),
  },
  fields: {
    url: document.getElementById('hassURL'),
    llac: document.getElementById('hassLLAC'),
    port: document.getElementById('hassPORT'),
    config: document.getElementById('appConfig'),
    openOnStart: document.getElementById('openOnStart'),
    refreshInterval: document.getElementById('refreshInterval')
  },
  elements: {
    version: document.getElementById('version'),
    refreshTime: document.getElementById('refreshTime'),
    failedConnectionReason: document.getElementById('failed-connection-reason'),
  },
  toasts: {
    connectSuccess: new bootstrap.Toast(document.getElementById('connect-success-toast')),
    connectFailure: new bootstrap.Toast(document.getElementById('connect-failed-toast')),
    saveSuccess: new bootstrap.Toast(document.getElementById('save-success-toast')),
    saveFailure: new bootstrap.Toast(document.getElementById('save-failed-toast')),
  },
  toastMessages: {
    saveError: document.getElementById('save-error-reason')
  }
}

// EVENT LISTENERS
elements.fields.refreshInterval.oninput = (event) => {
  const {refreshInterval} = elements.fields
  elements.elements.refreshTime.innerText = refreshInterval.value === '0' ? 'Never' : refreshInterval.value + ' minutes'
}

elements.fields.config.addEventListener('onChange', () => {
  const config = elements.fields.config
  try {
    config.value = JSON.stringify(JSON.parse(config.value), undefined, 2)
  } catch (e) {
    console.log('Invalid JSON')
  }
})

elements.buttons.connect.addEventListener('click', async () => {
  const { url, llac, port } = elements.fields
  await clearValidation(url, llac, port)
  const allValid = showValidation(url, llac, port)

  if (!allValid) return

  const response = await ipcRenderer.sendSync('connect', {
    url: url.value,
    llac: llac.value,
    port: port.value
  })

  if (response.valid) {
    elements.toasts.connectSuccess.show()
  } else {
    elements.elements.failedConnectionReason.innerText = response.message
    elements.toasts.connectFailure.show()
  }
})

elements.buttons.saveConfig.addEventListener('click', (e) => {
  e.preventDefault()
  ipcRenderer.send('exportConfig', {})
})

elements.buttons.loadFile.addEventListener('click', (e) => {
  e.preventDefault()
  ipcRenderer.send('importConfig', {})
  location.reload()
})

elements.buttons.paste.addEventListener('click', (e) => {
  e.preventDefault()
  navigator.clipboard.readText().then(text => {
    try{
      let parsedData = JSON.parse(text)
      elements.fields.config.value = JSON.stringify(parsedData, undefined, 2)
    } catch (e) {
      console.log('Invalid JSON')
    }
  }).catch(err => {
    console.log('Failed to read clipboard contents: ', err)
  })
})

elements.buttons.openIcons.addEventListener('click', () => {
  ipcRenderer.send('openIconsFolder', {})
})

elements.buttons.exit.addEventListener('click', (e) => {
  e.preventDefault()
  ipcRenderer.send('exit', {})
})

elements.buttons.iconDownloader.addEventListener('click', () => {
  ipcRenderer.send('open-icon-downloader', {})
})

elements.buttons.save.addEventListener('click', async (e) => {
  e.preventDefault()
  const { url, llac, port, config, openOnStart, refreshInterval } = elements.fields
  clearValidation(url, llac, port, config)
  const allValid = showValidation(url, llac, port)
  let parsedConfig

  if (!allValid) return

  try {
    parsedConfig = JSON.parse(config.value)
    if(!(parsedConfig.items instanceof Array)) throw new Error('Invalid config')
    setValidation(config, true)
  } catch (err) {
    setValidation(config, false)
    return
  }

  let response = await ipcRenderer.sendSync('save', {
    url: url.value,
    llac: llac.value,
    port: port.value,
    refreshInterval: parseInt(refreshInterval.value),
    config: parsedConfig,
    openOnStart: openOnStart.checked
  })

  if(!response.success) {
    elements.toastMessages.saveError.innerText = response.message 
    elements.toasts.saveFailure.show()
  } else {
    elements.toasts.saveSuccess.show()
  }
})

// IPC EVENTS
ipcRenderer.on('settings', (event, data) => {
  console.log(data)
  const { url, llac, port, config, refreshInterval } = elements.fields

  elements.elements.version.innerText = `v${data.version}`
  url.value = data.url
  llac.value = data.llac
  port.value = data.port
  refreshInterval.value = data.refreshInterval
  config.value = JSON.stringify(data.config, undefined, 2)
  openOnStart.checked = data.openOnStart

  refreshInterval.oninput()
})

// FUNCTIONS
function showValidation (...elements) {
  let allValid = true
  elements.forEach(element => {
    element.classList.add(element.checkValidity() ? 'is-valid' : 'is-invalid')
    allValid = allValid && element.checkValidity()
  })
  return allValid
}

function clearValidation (...elements) {
  elements.forEach(element => {
    element.classList.remove('is-valid', 'is-invalid')
  })
}

function setValidation (element, valid) {
  element.classList.remove('is-valid', 'is-invalid')
  element.classList.add(valid ? 'is-valid' : 'is-invalid')
}