const { ipcRenderer } = require('electron')

const elements = {
  buttons: {
    connect: document.getElementById('connect'),
    openIcons: document.getElementById('open-icons'),
    save: document.getElementById('save'),
    exit: document.getElementById('exit')
  },
  fields: {
    url: document.getElementById('hassURL'),
    llac: document.getElementById('hassLLAC'),
    port: document.getElementById('hassPORT'),
    config: document.getElementById('appConfig')
  },
  toasts: {
    connectSuccess: new bootstrap.Toast(document.getElementById('connect-success-toast')),
    connectFailure: new bootstrap.Toast(document.getElementById('connect-failed-toast'))
  }
}

// EVENT LISTENERS
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
    elements.toasts.connectFailure.show()
    // TODO show connection failure error
  }
})

elements.buttons.openIcons.addEventListener('click', () => {
  ipcRenderer.send('openIconsFolder', {})
})

elements.buttons.exit.addEventListener('click', (e) => {
  e.preventDefault()
  ipcRenderer.send('exit', {})
})

elements.buttons.save.addEventListener('click', (e) => {
  e.preventDefault()
  const { url, llac, port, config } = elements.fields
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

  ipcRenderer.send('save', {
    url: url.value,
    llac: llac.value,
    port: port.value,
    config: parsedConfig
  })
})

// IPC EVENTS
ipcRenderer.on('settings', (event, data) => {
  const { url, llac, port, config } = elements.fields
  console.log(data)

  url.value = data.url
  llac.value = data.llac
  port.value = data.port
  config.value = JSON.stringify(data.config, undefined, 2)
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

function prettyPrint () {
  const config = elements.fields.config
  try {
    config.value = JSON.stringify(JSON.parse(config.value), undefined, 2)
  } catch (e) {
    console.log('Invalid JSON')
  }
}
