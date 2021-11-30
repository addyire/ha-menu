<img src="https://i.imgur.com/7nSvc2E.png" width=80 align="right"><br>
# ha-menu
<img src="https://img.shields.io/github/package-json/v/addyire/ha-menu?color=red"> <img src="https://img.shields.io/github/stars/addyire/ha-menu?style=badge&color=brightgreen"> <img src="https://img.shields.io/badge/contributions-welcome-blue"><br>
An **insanely** customizable way to interact with Home Assistant in the menubar
<img src="https://i.imgur.com/HAag5aG.png" width=800>

# [Example Configuration](example/README.md)

# Table Of Contents

- [Installation](#installation)
- [App Configuration](#app-configuration)
- [Importing & Exporting](#importing-&-exporting)
- [Menubar Configuration](#menubar-configuration)
  - [Title](#title)
  - [Menu Item Types](#menu-item-types)
  - [MenuAction](#menuaction)
  - [Icons](#icons)
  - [Templating](#templating)

# Installation

To use a prebuilt version...
1. Head over to [releases](https://github.com/addyire/ha-menu/releases) and download the latest release
2. Extract the zip and drag the application into your `Applications` folder. 
3. Open HA Menu

To build it yourself...
1. Clone this repository
2. Run `yarn install`
3. Run `yarn dist`
4. Your executable will be found in the newly created `dist` folder

# App Configuration

To open the Preferences window, click the Home Assistant Icon in your menubar, and then go to `Preferences`. 

The configuration file is stored here if you wish to edit it yourself: <br>
`/Users/[YOUR USERNAME]/Library/Application Support/ha-menu/settings.json` <br>
*Note: This file also contains the app configuration settings so make sure you know what you are doing* 

* ### `Server URL`
  * #### Example: `http://homeassistant`
  * The URL to your server. Don't add a `/` or a port to the end of the URL.

* ### `Server Port`
  * #### Example: `443`
  * The port to your server. If you use https make sure you put in port `443`.

* ### `Long Lived Access Token`
  * Your long lived access token from home assistant. To make one go to Your Profile -> Long-Lived Access Tokens

### Refresh Interval

The refresh interval is how often the menubar will automatically refresh with new data. If set to never, the menubar will never automatically refresh, but a refresh can still be triggered from a Menu Item.

# Importing & Exporting

In the preferences window, you can export your configuration as a `.bar` file. You can also import `.bar` configuration files from the preferences window. If you want a shortcut to import configuration files, you can hold **Shift** while clicking `Preferences` in the menubar or you can just double click on a `.bar` file.

# Menubar Configuration

In the preferences window, under `Config` is where you will put the JSON which creates your custom menubar.

* **required** `items` {[`MenuItem`]}: Your list of menu items
* **templatable** `title` {`String`} : The text that will show up next to the Home Assistant icon in the MenuBar. **Limited to 34 charachters.**
* **templatable** `icon` {`String`}: Name of the icon you wish to use

#### Example
```json
{
  "items": [
    {
      "type": "label",
      "label": "So much customization!"
    }
  ],
  "title": "Hello World!"
}
```

## Title

The title shows to the right of the icon in the menu bar. The title can be set by adding the `title` key to the main JSON. The title should be a string and templating is supported (scroll down for more info on templating).


#### Example
```json
{
  "title": "Hello!"
}
```

#### Note
  - The title is limited to 24 characters

## Menu Item Types

There are 4 types of Menu Items

* Label
* Dropdown
* Separator
* Open HASS

### Type: `label`

* **required** `type`: `label`
* **templatable** `label` {`String`}: The label for this Menu Item
* **templatable** `icon` {`String`}: The icon name for this item
* `reload` {`Boolean`}: Whether or not the Menu Bar should be reloaded on click
* `action` {`MenuAction`}: The action to run when clicked
* `checkedTemplate` {`String`}: Whether or not this label should be checked. The string is a Home Assistant template which should resolve to `on`, `true`,`off`, or `false`.
* `hiddenTemplate` {`String`}: Whether or not this label should be hidden. The string is a Home Assistant template which should resolve to `on`, `true`,`off`, or `false`.  

#### Note

* If an item has no `action` and `reload` is not true, the item will be greyed out.

#### Examples
<img src="https://imgur.com/5Hdeilt.png" width=400>

```json
{
  "type": "label",
  "label": "No Action"
},
{
  "type": "label",
  "label": "Reload",
  "reload": true
},
{
  "type": "label",
  "label": "Checked + Reload",
  "reload": true,
  "checkedTemplate": "true"
},
{
  "type": "label",
  "label": "Action",
  "action": {
    "domain": "light",
    "service": "toggle",
    "serviceData": {
      "entity_id": "light.my_light"
    }
  }
}
```

### Type: `dropdown`

Creates a dropdown menu

* **required** `type`: `dropdown`
* **required** **templatable**`label` {`String`}: The label for this dropdown
* **required** `items` {[`MenuItem`]}: A list of Menu Items to be displayed
* **templatable** `icon` {`String`} : The icon name for this item

#### Example
<img src="https://imgur.com/L3r9WOO.png" width=400>

```json
{
  "type": "dropdown",
  "label": "Dropdown",
  "items": [
    {
      "type": "label",
      "label": "Item 1"
    },
    {
      "type": "label",
      "label": "Item 2"
    },
    {
      "type": "label",
      "label": "Item 3"
    }
  ]
}
```

## Type: `separator`

* **required** `type`: `separator`

#### Example
<img src="https://imgur.com/p3yeolj.png" width=400>

```json
{
  "type": "normal",
  "label": "Item 1"
},
{
  "type": "separator"
},
{
  "type": "normal",
  "label": "Item 2"
}
```

## Type: `open_hass`

Looks like a label but opens Home Assistant in your browser when clicked.

* **required** `type`: `open_hass`
* **required** **templatable** `label` {`String`}: The label for this item
* `icon` **templatable** {`String`}: The icon name for this item

## MenuAction

A `MenuAction` is how you can interact with Home Assistant.

* **required** `domain` {`String`}: The domain to be called
* **required** `service` {`String`}: The service of the domain
* **required** `serviceeData` {{`Service Data`}}: The data that will be given when the service is called

#### Example
```json
{
  "domain" : "light",
  "service": "toggle",
  "serviceData": {
    "entity_id": "light.my_light"
  }
}
```

## Icons

To add an icon to your Menu Bar follow these steps

* Open Preferences
* Click `Open Icons Folder`
* Put all icons in the folder that opens
* On your `MenuItem` add the `icon` field and enter the name of the file **including the file extension**

### Recommendations

* Make the size of your image `32x32`
* Add `@2x` to the end of your file name to make it a "High Resolution Image" (Read below for more information)
* Get icons from [here](https://materialdesignicons.com/). Export them as PNG at 36x66 then use @2x magnification

### High Resolution Image

To make your image look better in the Menubar you can make it "High Resolution" which increases the DPI. Here are the following options:

* `@1x`
* `@1.25x`
* `@1.33x`
* `@1.4x`
* `@1.5x`
* `@1.8x`
* `@2x`
* `@2.5x`
* `@3x`
* `@4x`
* `@5x`

Just add one of these to the end of your file. 

#### Example
`icon.png` -> `icon@2x.png`

### Icon Templates

It is recommended that your icons are made a template. To make your icon a template

* Your image **must** be only black pixels with a transparent background
* Add `Template` to the end of the name of your file. 

### File Name Examples

* `icon.png` -> `iconTemplate.png`
* `icon@2x.png` -> `iconTemplate@2x.png`

### [More Information Here](https://www.electronjs.org/docs/latest/api/native-image#high-resolution-image)

## Templating

**The customization is not over!** You can also use Home Assistant Templates in certain fields!

### Supported Fields

* `label`
* `icon`
* `title`

### Converting To Templates

To make a field a template just add `Template` to the end of the field name and put your template in the value.

#### Example
```json
{
  "labelTemplate": "{{ states('light.my_light') }}"
}
```
Turns into...

```json
{
  "labelTemplate": "{{ states('light.my_light') }}"
}
```
