const { app } = require('electron');
const createWindow = require('./src/view/MainWindow');

app.whenReady().then(createWindow('index.html'));