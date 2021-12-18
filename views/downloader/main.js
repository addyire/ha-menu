const { ipcRenderer } = require('electron')

const elements = {
  icon: document.getElementById('name'),
  fileName: document.getElementById('file-name'),
  iconDisplay: document.getElementById('iconDisplay'),
  form: document.getElementById('form'),
  toastError: document.getElementById('toast-error'),
  toasts: {
    success: new bootstrap.Toast(document.getElementById('toastSuccess')),
    error: new bootstrap.Toast(document.getElementById('toastFailed'))
  }
}

elements.icon.oninput = async () => {
  const iconExists = await ipcRenderer.sendSync('icon-exists', elements.icon.value)
  if (iconExists) {
    iconDisplay(elements.icon.value)
  } else {
    iconDisplay('help-circle')
  }
}

elements.form.onsubmit = async (e) => {
  e.preventDefault()

  const result = await ipcRenderer.sendSync('download-icon', generateRequestJSON())
  console.log(result)
  if (result.success) {
    elements.toasts.success.show()
  } else {
    elements.toastError.innerText = result.message
    elements.toasts.error.show()
  }
}

function iconDisplay (icon) {
  elements.iconDisplay.innerHTML = `
    <span class="mdi mdi-${icon} m-auto" style="font-size: 30px;"></span>
  `
}

function generateRequestJSON () {
  const name = elements.icon.value
  const fileName = elements.fileName.value.replace(/\.[^/.]+$/, "")
  const size = selectedRadio('size')
  const color = selectedRadio('color')

  return {
    name,
    fileName,
    size,
    color
  }
}

function selectedRadio (name) {
  const radios = document.getElementsByName(name)
  for (const radio of radios) {
    if (radio.checked) return radio.id
  }
  return undefined
}
