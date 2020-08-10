const fs = require('fs');
const { Menu } = require('electron');
const { handleOpenDialogSelectFile } = require('./events');
const selectUsesFromSource = require('../../../model/selectUsesFromSource');

function MainMenu() {
   const menuTemlate = [{
      id: '1',
      label: 'File',
      submenu: [{
         label: "Open",
         click: async () => {
            const filePath = await handleOpenDialogSelectFile();

            const source = fs.readFileSync(filePath, 'utf-8');
            const listUses = selectUsesFromSource(source);
            console.log(listUses);
         }
      },]
   }];

   const menu = Menu.buildFromTemplate(menuTemlate);
   Menu.setApplicationMenu(menu)
}

module.exports = MainMenu;