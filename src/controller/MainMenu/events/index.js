const { dialog } = require('electron')

async function handleOpenDialogSelectFile() {
   const properties = ['openFile'];
   const filters = [{
      name: 'Custom File Type',
      extensions: ['pas'],
   }];

   const filePath = await dialog.showOpenDialog({
      properties,
      filters,
   });

   return filePath.filePaths[0];
}

module.exports = {handleOpenDialogSelectFile};