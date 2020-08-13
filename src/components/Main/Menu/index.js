const fs = require('fs');
const { Menu } = require('electron');
const Store = require('electron-store');

const { handleOpenDialogSelectFile } = require('./events');
const { selectUsesFromSource, getUnitName } = require('../../../model/parsePascalSource');
const mountDependenceGraphStructure = require('../../../model/mountDependenceGraphStructure');
const { reloadMainWindow } = require('../Window');

function MainMenu() {
   const menuTemlate = [{
      id: '1',
      label: 'File',
      submenu: [{
         label: "Open",
         click: async () => {
            const filePath = await handleOpenDialogSelectFile();

            const source = fs.readFileSync(filePath, 'utf-8');
            const unitName = getUnitName(source);
            const listUses = selectUsesFromSource(source);
            const graph = mountDependenceGraphStructure(unitName, listUses);

            const store = new Store();
            store.set(graph);
            
            reloadMainWindow();
         }
      },]
   }];

   const menu = Menu.buildFromTemplate(menuTemlate);
   Menu.setApplicationMenu(menu)
}

module.exports = MainMenu;