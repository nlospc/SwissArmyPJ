import { ipcMain } from 'electron';

import { getDatabase } from '../database/schema';

import type { IPCResponse } from '../../shared/types';

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', handleGetSetting);
  ipcMain.handle('settings:set', handleSetSetting);
  ipcMain.handle('settings:export', handleExportData);
  ipcMain.handle('settings:import', handleImportData);
}

function handleGetSetting(_event: any, key: string): IPCResponse<string | null> {
  try {
    const db = getDatabase();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    return { success: true, data: row?.value || null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleSetSetting(_event: any, key: string, value: string): IPCResponse<void> {
  try {
    const db = getDatabase();
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleExportData(): IPCResponse<any> {
  try {
    const db = getDatabase();

    const data = {
      workspaces: db.prepare('SELECT * FROM workspaces').all(),
      portfolios: db.prepare('SELECT * FROM portfolios').all(),
      portfolio_projects: db.prepare('SELECT * FROM portfolio_projects').all(),
      projects: db.prepare('SELECT * FROM projects').all(),
      work_items: db.prepare('SELECT * FROM work_items').all(),
      inbox_items: db.prepare('SELECT * FROM inbox_items').all(),
      todos: db.prepare('SELECT * FROM todos').all(),
      settings: db.prepare('SELECT * FROM settings').all(),
      exportedAt: new Date().toISOString(),
    };

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleImportData(_event: any, data: any): IPCResponse<void> {
  try {
    const db = getDatabase();

    db.prepare('DELETE FROM todos').run();
    db.prepare('DELETE FROM inbox_items').run();
    db.prepare('DELETE FROM work_items').run();
    db.prepare('DELETE FROM portfolio_projects').run();
    db.prepare('DELETE FROM projects').run();
    db.prepare('DELETE FROM portfolios').run();
    db.prepare('DELETE FROM settings').run();

    if (data.portfolios) {
      for (const portfolio of data.portfolios) {
        db.prepare('INSERT INTO portfolios (id, uuid, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
          .run(portfolio.id, portfolio.uuid, portfolio.name, portfolio.description, portfolio.created_at, portfolio.updated_at);
      }
    }

    if (data.projects) {
      for (const project of data.projects) {
        db.prepare('INSERT INTO projects (id, uuid, name, owner, status, start_date, end_date, portfolio_id, tags_json, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .run(project.id, project.uuid, project.name, project.owner, project.status, project.start_date, project.end_date, project.portfolio_id, project.tags_json, project.description, project.created_at, project.updated_at);
      }
    }

    if (data.portfolio_projects) {
      for (const pp of data.portfolio_projects) {
        db.prepare('INSERT INTO portfolio_projects (portfolio_id, project_id) VALUES (?, ?)').run(pp.portfolio_id, pp.project_id);
      }
    }

    if (data.work_items) {
      for (const item of data.work_items) {
        db.prepare('INSERT INTO work_items (id, uuid, project_id, parent_id, type, title, status, start_date, end_date, level, notes, owner, priority, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .run(item.id, item.uuid, item.project_id, item.parent_id, item.type, item.title, item.status, item.start_date, item.end_date, item.level, item.notes, item.owner || null, item.priority || 'medium', item.created_at, item.updated_at);
      }
    }

    if (data.inbox_items) {
      for (const item of data.inbox_items) {
        db.prepare('INSERT INTO inbox_items (id, uuid, source_type, raw_text, processed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(item.id, item.uuid, item.source_type, item.raw_text, item.processed, item.created_at, item.updated_at);
      }
    }

    if (data.todos) {
      for (const todo of data.todos) {
        db.prepare('INSERT INTO todos (id, uuid, text, done, due_date, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(todo.id, todo.uuid, todo.text, todo.done, todo.due_date, todo.priority, todo.created_at);
      }
    }

    if (data.settings) {
      for (const setting of data.settings) {
        db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(setting.key, setting.value);
      }
    }

    if (data.workspaces && data.workspaces.length > 0) {
      const ws = data.workspaces[0];
      db.prepare('UPDATE workspaces SET name = ?, updated_at = ? WHERE id = 1').run(ws.name, ws.updated_at);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}