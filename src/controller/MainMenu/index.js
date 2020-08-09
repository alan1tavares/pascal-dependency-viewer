const { Menu } = require('electron');
const { handleOpenFile } = require('./events');

class MainMenu {

   static create() {
      const menuTemlate = [{
         id: '1',
         label: 'File',
         submenu: [{
            label: "Open",
            click: () => handleOpenFile()
         },]
      },
      ]

      const menu = Menu.buildFromTemplate(menuTemlate);
      Menu.setApplicationMenu(menu)
   }
}

module.exports = MainMenu;