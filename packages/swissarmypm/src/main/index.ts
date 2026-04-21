import * as electron from 'electron';
import { initDatabase } from './database/schema';
import { registerIPCHandlers } from './ipc/handlers';

// 在开发环境中导入 devtools installer
let installExtension: any, REACT_DEVELOPER_TOOLS: any, REDUX_DEVTOOLS: any;
if (process.env.NODE_ENV === 'development') {
  try {
    const devtools = require('electron-devtools-installer');
    installExtension = devtools.default || devtools;
    REACT_DEVELOPER_TOOLS = devtools.REACT_DEVELOPER_TOOLS;
    REDUX_DEVTOOLS = devtools.REDUX_DEVTOOLS;
  } catch (err) {
    console.log('Failed to load electron-devtools-installer:', err);
  }
}

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
    // NOTE: Auto-installing DevTools extensions can cause "object null is not iterable" errors
    // Users can still open DevTools with F12 or Ctrl+Shift+I
    // if (typeof installExtension === 'function') {
    //   installExtension(REACT_DEVELOPER_TOOLS)
    //     .then((name: string) => console.log(`Added Extension:  ${name}`))
    //     .catch((err: Error) => console.log('An error occurred:', err));

    //   // Install Redux DevTools (if using Redux)
    //   installExtension(REDUX_DEVTOOLS)
    //     .then((name: string) => console.log(`Added Extension:  ${name}`))
    //     .catch((err: Error) => console.log('An error occurred:', err));
    // }

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
