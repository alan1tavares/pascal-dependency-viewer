const { BrowserWindow } = require('electron');

function MainWindow(fileHtml) {

   return () => {
      const mainWindow = new BrowserWindow({
         width: 800,
         height: 600,
         webPreferences: {
            nodeIntegration: true
         }
      })
      mainWindow.webContents.openDevTools()
      mainWindow.loadFile(fileHtml);
   }
}

module.exports = MainWindow;