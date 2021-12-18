const hass = require('./hass')
const { PATHS } = require('./data')
const { openHASSInBrowser } = require('./configuration')

// define function to build items from config
const buildItems = async (items, rebuildFunction) => {
  // start with empty list of items
  const builtItems = []

  // if theres no items... return the empty list
  if (!items || !(items instanceof Array) || items.length === 0) return builtItems

  // loop through the config items
  for (const item of items) {
    // if the item has no type... skip it
    if (!item.type) continue

    // if the item has a template for whether or not to hide...
    if (item.hiddenTemplate) {
      // render the template
      const hidden = (await hass.render(item.hiddenTemplate)).toLowerCase()
      // if the template returns true or on then skip this item
      if (hidden === 'true' || hidden === 'on') continue
    }

    // initialize the item
    const builtItem = {
      // if the label is a template, render it otherwise use the regular label
      label: item.labelTemplate ? await hass.render(item.labelTemplate) : item.label
    }

    // if the item has a regular icon...
    if (item.icon) {
      // get the icon path and set it
      builtItem.icon = PATHS.ICON_PATH_GENERATOR(item.icon)
    } else if (item.iconTemplate) { // if the item has a template for the icon...
      // render the template, get the path, and then set it
      builtItem.icon = PATHS.ICON_PATH_GENERATOR(await hass.render(item.iconTemplate))
    }

    // switch on item type
    switch (item.type) {
      // for dropdowns...
      case 'dropdown': {
        // set the submenu to be a built list of items from the dropdown items
        builtItem.submenu = await buildItems(item.items, rebuildFunction)
        // set the type
        builtItem.type = 'submenu'
        // break out of the switch
        break
      }
      // for label...
      case 'label': {
        // if the item has a template for if it should be checked...
        if (item.checkedTemplate) {
          // render the template
          const state = await hass.render(item.checkedTemplate)
          // set checked to true if the template returns true or on
          builtItem.checked = state === 'on' || state === 'true'
          // set the item type
          builtItem.type = 'checkbox'
        }

        // if there is no action or the item doesnt have reload enabled then disable the item
        builtItem.enabled = !!item.action || !!item.reload

        // if there is an action...
        if (item.action) {
          // set the click function
          builtItem.click = item.reload // if reload is enabled, set the click function to reload also
            ? () => {
                // call action
                hass.action(item.action)
                // rebuild the tray after 2 seconds so the action goes through first
                setTimeout(rebuildFunction, 2000)
              }
            : () => {
                // call action
                hass.action(item.action)
              }
        } else if (item.reload) { // otherwise if reload is enabled...
          // set the click function to be the rebuild tray function
          builtItem.click = rebuildFunction
        }

        // break
        break
      }
      // for separator...
      case 'separator': {
        // set the type to separator
        builtItem.type = 'separator'
        // break
        break
      }
      // for open_hass...
      case 'open_hass': {
        // set the click function
        builtItem.click = openHASSInBrowser
        // break
        break
      }
      // idk if i need this
      default: {
        continue
      }
    }

    // push the built item to the list
    builtItems.push(builtItem)
  }

  // return the built items
  return builtItems
}

// export the build items function
module.exports = buildItems
