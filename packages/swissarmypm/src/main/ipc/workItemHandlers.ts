import { ipcMain } from 'electron';
import * as crypto from 'node:crypto';

import { getDatabase } from '../database/schema';

import type {
  CreateWorkItemDTO,
  IPCResponse,
  UpdateWorkItemDTO,
  WorkItem,
} from '../../shared/types';

interface AuditLogEntry {
  entity_type: string;
  entity_id: string;
  action: 'create' | 'update' | 'delete';
  user_id?: string;
  source?: string;
  old_values_json?: string;
  new_values_json?: string;
}

function writeAuditLog(entry: AuditLogEntry): void {
  try {
    const db = getDatabase();
    const uuid = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO audit_log (uuid, entity_type, entity_id, action, user_id, source, old_values_json, new_values_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuid,
      entry.entity_type,
      entry.entity_id,
      entry.action,
      entry.user_id || null,
      entry.source || null,
      entry.old_values_json || null,
      entry.new_values_json || null,
      now
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

export function registerWorkItemHandlers(): void {
  ipcMain.handle('workItems:getAll', handleGetAllWorkItems);
  ipcMain.handle('workItems:getByProject', handleGetWorkItemsByProject);
  ipcMain.handle('workItems:getByParent', handleGetWorkItemsByParent);
  ipcMain.handle('workItems:create', handleCreateWorkItem);
  ipcMain.handle('workItems:update', handleUpdateWorkItem);
  ipcMain.handle('workItems:delete', handleDeleteWorkItem);
}

function handleGetAllWorkItems(): IPCResponse<WorkItem[]> {
  try {
    const db = getDatabase();
    const workItems = db.prepare('SELECT * FROM work_items ORDER BY created_at DESC').all() as WorkItem[];
    return { success: true, data: workItems };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleGetWorkItemsByProject(_event: any, projectId: number): IPCResponse<WorkItem[]> {
  try {
    const db = getDatabase();
    const workItems = db.prepare(`
      SELECT * FROM work_items
      WHERE project_id = ?
      ORDER BY level ASC, created_at ASC
    `).all(projectId) as WorkItem[];

    const itemMap = new Map<number, WorkItem>();
    const roots: WorkItem[] = [];

    for (const item of workItems) {
      item.children = [];
      itemMap.set(item.id, item);
    }

    for (const item of workItems) {
      if (item.parent_id === null) {
        roots.push(item);
      } else {
        const parent = itemMap.get(item.parent_id);
        if (parent) {
          parent.children!.push(item);
        }
      }
    }

    return { success: true, data: roots };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleGetWorkItemsByParent(_event: any, parentId: number): IPCResponse<WorkItem[]> {
  try {
    const db = getDatabase();
    const workItems = db.prepare('SELECT * FROM work_items WHERE parent_id = ? ORDER BY created_at ASC').all(parentId) as WorkItem[];
    return { success: true, data: workItems };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleCreateWorkItem(_event: any, data: CreateWorkItemDTO): IPCResponse<WorkItem> {
  try {
    const db = getDatabase();
    const uuid = crypto.randomUUID();
    const now = new Date().toISOString();
    const level = data.parent_id ? 2 : 1;

    const result = db.prepare(`
      INSERT INTO work_items (uuid, project_id, parent_id, type, title, status, start_date, end_date, level, notes, owner, priority, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuid,
      data.project_id,
      data.parent_id || null,
      data.type,
      data.title,
      data.status || 'not_started',
      data.start_date || null,
      data.end_date || null,
      level,
      data.notes || null,
      data.owner || null,
      data.priority || 'medium',
      now,
      now
    );

    const workItem = db.prepare('SELECT * FROM work_items WHERE id = ?').get(result.lastInsertRowid) as WorkItem;

    writeAuditLog({
      entity_type: 'work_item',
      entity_id: String(workItem.id),
      action: 'create',
      source: 'gantt',
      new_values_json: JSON.stringify(workItem),
    });

    return { success: true, data: workItem };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleUpdateWorkItem(_event: any, id: number, data: UpdateWorkItemDTO): IPCResponse<WorkItem> {
  try {
    const db = getDatabase();
    const now = new Date().toISOString();
    const oldWorkItem = db.prepare('SELECT * FROM work_items WHERE id = ?').get(id) as WorkItem | undefined;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.start_date !== undefined) {
      updates.push('start_date = ?');
      values.push(data.start_date);
    }
    if (data.end_date !== undefined) {
      updates.push('end_date = ?');
      values.push(data.end_date);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      values.push(data.notes);
    }
    if (data.type !== undefined) {
      updates.push('type = ?');
      values.push(data.type);
    }
    if (data.owner !== undefined) {
      updates.push('owner = ?');
      values.push(data.owner);
    }
    if (data.priority !== undefined) {
      updates.push('priority = ?');
      values.push(data.priority);
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    db.prepare(`UPDATE work_items SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const workItem = db.prepare('SELECT * FROM work_items WHERE id = ?').get(id) as WorkItem;

    if (oldWorkItem) {
      writeAuditLog({
        entity_type: 'work_item',
        entity_id: String(id),
        action: 'update',
        source: 'gantt',
        old_values_json: JSON.stringify(oldWorkItem),
        new_values_json: JSON.stringify(workItem),
      });
    }

    return { success: true, data: workItem };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleDeleteWorkItem(_event: any, id: number): IPCResponse<{ deletedIds: number[] }> {
  try {
    const db = getDatabase();
    const workItem = db.prepare('SELECT * FROM work_items WHERE id = ?').get(id) as WorkItem | undefined;
    const childItems = db.prepare('SELECT * FROM work_items WHERE parent_id = ?').all(id) as WorkItem[];

    db.prepare('DELETE FROM work_items WHERE id = ?').run(id);

    if (workItem) {
      writeAuditLog({
        entity_type: 'work_item',
        entity_id: String(id),
        action: 'delete',
        source: 'gantt',
        old_values_json: JSON.stringify(workItem),
      });
    }

    for (const child of childItems) {
      writeAuditLog({
        entity_type: 'work_item',
        entity_id: String(child.id),
        action: 'delete',
        source: 'gantt',
        old_values_json: JSON.stringify(child),
      });
    }

    const deletedIds = [id, ...childItems.map(c => c.id)];
    return { success: true, data: { deletedIds } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}