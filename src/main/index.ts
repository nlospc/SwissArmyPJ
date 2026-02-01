import * as electron from 'electron';
import { initDatabase } from './database/schema';
import { registerIPCHandlers } from './ipc/handlers';

let mainWindow: electron.BrowserWindow | null = null;

function createWindow(): void {
  const path = require('path');
  const preloadPath = path.join(__dirname, '../preload/index.js');

  mainWindow = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

electron.app.whenReady().then(() => {
  initDatabase();
  registerIPCHandlers();
  createWindow();
});

electron.app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    electron.app.quit();
  }
});
