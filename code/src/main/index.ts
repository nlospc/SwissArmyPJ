import * as electron from 'electron';
import path from 'path';
import { initDatabaseSingleton } from './db/schema';
import { registerIPCHandlers } from './ipc/handlers';

let mainWindow: electron.BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default',
  });
  
  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
electron.app.whenReady().then(() => {
  // Initialize database
  initDatabaseSingleton(electron.app);
  
  // Register IPC handlers
  registerIPCHandlers();
  
  // Create window
  createWindow();

  electron.app.on('activate', () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

electron.app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    electron.app.quit();
  }
});

electron.app.on('before-quit', () => {
  // Close database connection
  const { closeDatabase } = require('./db/schema');
  closeDatabase();
});
