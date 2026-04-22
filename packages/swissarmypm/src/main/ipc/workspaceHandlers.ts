import { ipcMain } from 'electron';

import { getDatabase } from '../database/schema';

import type { IPCResponse, Workspace } from '../../shared/types';

export function registerWorkspaceHandlers(): void {
  ipcMain.handle('workspace:get', handleGetWorkspace);
  ipcMain.handle('workspace:update', handleUpdateWorkspace);
}

function handleGetWorkspace(): IPCResponse<Workspace> {
  try {
    const db = getDatabase();
    const workspace = db.prepare('SELECT * FROM workspaces LIMIT 1').get() as Workspace;
    return { success: true, data: workspace };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleUpdateWorkspace(_event: any, name: string): IPCResponse<Workspace> {
  try {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare('UPDATE workspaces SET name = ?, updated_at = ? WHERE id = 1').run(name, now);
    const workspace = db.prepare('SELECT * FROM workspaces WHERE id = 1').get() as Workspace;
    return { success: true, data: workspace };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}