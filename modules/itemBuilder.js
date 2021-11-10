const { shell } = require('electron')

const hass = require('./hass')
const PATHS = require('./paths')
const { settings } = require('./storage')

const buildItems = async (items, rebuildFunction) => {
  const builtItems = []

  if (!items || !(items instanceof Array) || items.length === 0) return builtItems

  for (const item of items) {
    if (!item.type) continue

    if (item.hiddenTemplate) {
      const hidden = (await hass.render(item.hiddenTemplate)).toLowerCase()
      if (hidden === 'true' || hidden === 'on') continue
    }

    const builtItem = {
      label: item.labelTemplate ? await hass.render(item.labelTemplate) : item.label
    }

    if (item.icon) {
      builtItem.icon = PATHS.ICON_GENERATOR(item.icon)
    } else if (item.iconTemplate) {
      builtItem.icon = PATHS.ICON_GENERATOR(await hass.render(item.iconTemplate))
    }

    switch (item.type) {
      case 'dropdown': {
        builtItem.submenu = await buildItems(item.items, rebuildFunction)
        builtItem.type = 'submenu'
        break
      }
      case 'label': {
        if (item.checkedTemplate) {
          const state = await hass.render(item.checkedTemplate)
          builtItem.checked = state === 'on' || state === 'true'
          builtItem.type = 'checkbox'
        }

        builtItem.enabled = !!item.action || !!item.reload

        if (item.action) {
          builtItem.click = item.reload
            ? () => {
                setTimeout(rebuildFunction, 2000)
                hass.action(item.action)
              }
            : () => {
                hass.action(item.action)
              }
        } else if (item.reload) {
          builtItem.click = rebuildFunction
        }

        break
      }
      case 'seperator': {
        builtItem.type = 'separator'
        break
      }
      case 'open_hass': {
        builtItem.click = () => {
          const { url, port } = settings.get()
          shell.openExternal(`${url}:${port}`)
        }
        break
      }
      default: {
        continue
      }
    }

    builtItems.push(builtItem)
  }

  return builtItems
}

module.exports = buildItems
