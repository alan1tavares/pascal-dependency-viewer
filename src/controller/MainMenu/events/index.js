const { dialog } = require('electron')

async function handleOpenFile() {
   const properties = ['openFile'];
   const filters = [{
      name: 'Custom File Type',
      extensions: ['pas'],
   }];


   const filePath = await dialog.showOpenDialog({
      properties,
      filters,
   });

   return filePath;
}

module.exports = {handleOpenFile};