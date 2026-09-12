const fs = require('fs');
const path = require('path');
const { Menu } = require('electron');
const Store = require('electron-store');

const { handleOpenDialogSelectFile, handleOpenDialogSelectProject } = require('./events');
const { selectUsesFromSource, getUnitName } = require('../../../model/parsePascalSource');
const mountDependenceGraphStructure = require('../../../model/mountDependenceGraphStructure');
const parseDprSource = require('../../../model/parseDprSource');
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
            store.delete('projectUnits');
            store.delete('projectDir');
            store.set({ view: 'graph', ...graph });

            reloadMainWindow();
         }
      }, {
         label: "Open Project",
         click: async () => {
            const filePath = await handleOpenDialogSelectProject();

            const source = fs.readFileSync(filePath, 'utf-8');
            const projectUnits = parseDprSource(source);
            const projectDir = path.dirname(filePath);

            const store = new Store();
            store.delete('nodes');
            store.delete('edges');
            store.set({ view: 'rootUnitSelection', projectUnits, projectDir });

            reloadMainWindow();
         }
      },]
   }];

   const menu = Menu.buildFromTemplate(menuTemlate);
   Menu.setApplicationMenu(menu)
}

module.exports = MainMenu;