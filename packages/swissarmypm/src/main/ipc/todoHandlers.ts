import { ipcMain } from 'electron';
import * as crypto from 'node:crypto';

import { getDatabase } from '../database/schema';

import type {
  CreateTodoDTO,
  IPCResponse,
  Todo,
  UpdateTodoDTO,
} from '../../shared/types';

export function registerTodoHandlers(): void {
  ipcMain.handle('todos:getAll', handleGetAllTodos);
  ipcMain.handle('todos:getByDate', handleGetTodosByDate);
  ipcMain.handle('todos:create', handleCreateTodo);
  ipcMain.handle('todos:update', handleUpdateTodo);
  ipcMain.handle('todos:toggle', handleToggleTodo);
  ipcMain.handle('todos:delete', handleDeleteTodo);
}

function handleGetAllTodos(): IPCResponse<Todo[]> {
  try {
    const db = getDatabase();
    const todos = db.prepare('SELECT * FROM todos ORDER BY due_date ASC, created_at DESC').all() as Todo[];
    return { success: true, data: todos };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleGetTodosByDate(_event: any, date: string): IPCResponse<Todo[]> {
  try {
    const db = getDatabase();
    const todos = db.prepare('SELECT * FROM todos WHERE due_date = ? ORDER BY created_at ASC').all(date) as Todo[];
    return { success: true, data: todos };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleCreateTodo(_event: any, data: CreateTodoDTO): IPCResponse<Todo> {
  try {
    const db = getDatabase();
    const uuid = crypto.randomUUID();
    const now = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO todos (uuid, text, done, due_date, priority, created_at)
      VALUES (?, ?, 0, ?, ?, ?)
    `).run(uuid, data.text, data.due_date || null, data.priority || null, now);

    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid) as Todo;
    return { success: true, data: todo };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleUpdateTodo(_event: any, id: number, data: UpdateTodoDTO): IPCResponse<Todo> {
  try {
    const db = getDatabase();

    const updates: string[] = [];
    const values: any[] = [];

    if (data.text !== undefined) {
      updates.push('text = ?');
      values.push(data.text);
    }
    if (data.done !== undefined) {
      updates.push('done = ?');
      values.push(data.done ? 1 : 0);
    }
    if (data.due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(data.due_date);
    }
    if (data.priority !== undefined) {
      updates.push('priority = ?');
      values.push(data.priority);
    }

    values.push(id);

    if (updates.length > 0) {
      db.prepare(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as Todo;
    return { success: true, data: todo };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleToggleTodo(_event: any, id: number): IPCResponse<Todo> {
  try {
    const db = getDatabase();
    db.prepare('UPDATE todos SET done = NOT done WHERE id = ?').run(id);
    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as Todo;
    return { success: true, data: todo };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleDeleteTodo(_event: any, id: number): IPCResponse<void> {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM todos WHERE id = ?').run(id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
