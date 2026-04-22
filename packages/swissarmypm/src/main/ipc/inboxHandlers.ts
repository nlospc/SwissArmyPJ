import { ipcMain } from 'electron';
import * as crypto from 'node:crypto';

import { getDatabase } from '../database/schema';

import type { CreateInboxItemDTO, InboxItem, IPCResponse } from '../../shared/types';

export function registerInboxHandlers(): void {
  ipcMain.handle('inbox:getAll', handleGetAllInboxItems);
  ipcMain.handle('inbox:create', handleCreateInboxItem);
  ipcMain.handle('inbox:markProcessed', handleMarkInboxProcessed);
  ipcMain.handle('inbox:delete', handleDeleteInboxItem);
}

function handleGetAllInboxItems(): IPCResponse<InboxItem[]> {
  try {
    const db = getDatabase();
    const items = db.prepare('SELECT * FROM inbox_items ORDER BY created_at DESC').all() as InboxItem[];
    return { success: true, data: items };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleCreateInboxItem(_event: any, data: CreateInboxItemDTO): IPCResponse<InboxItem> {
  try {
    const db = getDatabase();
    const uuid = crypto.randomUUID();
    const now = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO inbox_items (uuid, source_type, raw_text, processed, created_at, updated_at)
      VALUES (?, ?, ?, 0, ?, ?)
    `).run(uuid, data.source_type, data.raw_text, now, now);

    const item = db.prepare('SELECT * FROM inbox_items WHERE id = ?').get(result.lastInsertRowid) as InboxItem;
    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleMarkInboxProcessed(_event: any, id: number): IPCResponse<InboxItem> {
  try {
    const db = getDatabase();
    const now = new Date().toISOString();

    db.prepare('UPDATE inbox_items SET processed = 1, updated_at = ? WHERE id = ?').run(now, id);
    const item = db.prepare('SELECT * FROM inbox_items WHERE id = ?').get(id) as InboxItem;

    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleDeleteInboxItem(_event: any, id: number): IPCResponse<void> {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM inbox_items WHERE id = ?').run(id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}