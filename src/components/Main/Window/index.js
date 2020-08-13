const { BrowserWindow, webContents } = require('electron');
const Store = require('electron-store');

function MainWindow(fileHtml) {

   return () => {
      const store = new Store();
      const mainWindow = new BrowserWindow({
         width: 800,
         height: 600,
         webPreferences: {
            nodeIntegration: true
         }
      });
      store.set('mainWindowId', mainWindow.id);
      mainWindow.webContents.openDevTools()
      mainWindow.loadFile(fileHtml);

      mainWindow.on('close', (e) => {
         store.clear();
      })
   }
}

function reloadMainWindow() {
   const store = new Store();
   const mainWindowId = store.get('mainWindowId');
   const webContentsMmainWindowId = webContents.fromId(mainWindowId);
   webContentsMmainWindowId.reload();
}

module.exports = { MainWindow, reloadMainWindow };