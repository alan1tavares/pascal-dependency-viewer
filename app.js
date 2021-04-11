const { app } = require('electron');
const {MainWindow, MainMenu} = require('./src/components/Main');

MainMenu();
app.whenReady().then(MainWindow('index.html'));