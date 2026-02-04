import * as electron from 'electron';
import { initDatabase } from './database/schema';
import { registerIPCHandlers } from './ipc/handlers';
import { default as installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } from 'electron-devtools-installer';

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

    // Install React DevTools
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred:', err));

    // Install Redux DevTools (if using Redux)
    installExtension(REDUX_DEVTOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred:', err));

    // Add keyboard shortcuts for DevTools
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && input.key === 'i')) {
        if (mainWindow) {
          mainWindow.webContents.toggleDevTools();
        }
      }
    });
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
