import { app } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
const { ipcMain } = require('electron')
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
  await app.whenReady();

  const mainWindow = createWindow('main', {
    width: 1080,
    height: 1920,
    kiosk: true,
    frame: false
  });

  mainWindow.removeMenu();

  if (isProd) {
    await mainWindow.loadURL('app://./index.html');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/`);
    mainWindow.webContents.openDevTools();
  }
})();

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.on('close-me', (event, arg) => {
  app.quit();
})