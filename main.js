const { app } = require('electron');
const createMainWindow = require('./src/controller/createMainWindow');
const MainMenu = require('./src/controller/MainMenu');

MainMenu.create();
app.whenReady().then(createMainWindow('index.html'));