const { Menu } = require('electron');
const { handleOpenDialogSelectFile } = require('./events');
const fs = require('fs');

function MainMenu() {
   const menuTemlate = [{
      id: '1',
      label: 'File',
      submenu: [{
         label: "Open",
         click: async () => {
            const filePath = await handleOpenDialogSelectFile();
            console.log('filePah', filePath);

            fs.readFile(filePath, 'utf8', (err, data) => {
               if (err) throw err;
               // console.log('data', data);
               const regex = /uses\s*(\w*\.\w*|\w*|\s|\,)*;/gi;
               const matchUses = data.match(regex);
               console.log('matchUses', matchUses);
            });

         },
      },]
   },
   ]

   const menu = Menu.buildFromTemplate(menuTemlate);
   Menu.setApplicationMenu(menu)
}

module.exports = MainMenu;