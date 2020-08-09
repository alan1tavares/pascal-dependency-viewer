const { BrowserWindow } = require('electron');


function createWindow(fileHtml) {

   return () => {
      const mainWindow = new BrowserWindow({
         width: 800,
         height: 600,
         webPreferences: {
            nodeIntegration: true
         }
      })

      mainWindow.loadFile(fileHtml);
   }
}

module.exports = createWindow;