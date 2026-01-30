import * as electron from 'electron';
import { initDatabase } from './database/schema';
import { registerIPCHandlers } from './ipc/handlers';

let mainWindow: electron.BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: electron.app.getPath('userData') + '/preload.js',
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile('dist/renderer/index.html');
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
