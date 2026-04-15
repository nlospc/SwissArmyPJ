import { ipcMain } from 'electron';
import * as crypto from 'node:crypto';

import { getDatabase } from '../database/schema';

import { registerMyWorkHandlers } from './myWorkHandlers';

import { registerDashboardHandlers } from './dashboardHandlers';

import type {

  IPCResponse,

  Workspace,

  Portfolio,

  Project,

  WorkItem,

  InboxItem,

  Todo,

  CreatePortfolioDTO,

  UpdatePortfolioDTO,

  CreateProjectDTO,

  UpdateProjectDTO,

  CreateWorkItemDTO,

  UpdateWorkItemDTO,

  CreateInboxItemDTO,

  CreateTodoDTO,

  UpdateTodoDTO,

  PortfolioSummary,

  SearchResult,

} from '../../shared/types';

import type {

  ProjectCanvasElementKey,

  ProjectCanvasGetResponse,

  ProjectCanvasRiskLevel,

  ProjectCanvasSaveResponse,

} from '../../shared/projectCanvas';

import { getProjectCanvas, saveProjectCanvasElement } from '../services/projectCanvasService';

// ============================================================================
// Audit Log Helper
// ============================================================================

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
    // Don't throw - audit log failures shouldn't break the main operation
  }
}

export function registerIPCHandlers(): void {

  // Register My Work handlers

  registerMyWorkHandlers();

  // Register Dashboard handlers


  registerDashboardHandlers();
  // ============================================================================
  // Workspace
  // ============================================================================

  ipcMain.handle('workspace:get', handleGetWorkspace);
  ipcMain.handle('workspace:update', handleUpdateWorkspace);

  // ============================================================================
  // Portfolios
  // ============================================================================

  ipcMain.handle('portfolios:getAll', handleGetAllPortfolios);
  ipcMain.handle('portfolios:getById', handleGetPortfolioById);
  ipcMain.handle('portfolios:create', handleCreatePortfolio);
  ipcMain.handle('portfolios:update', handleUpdatePortfolio);
  ipcMain.handle('portfolios:delete', handleDeletePortfolio);
  ipcMain.handle('portfolios:addProject', handleAddProjectToPortfolio);
  ipcMain.handle('portfolios:removeProject', handleRemoveProjectFromPortfolio);

  // ============================================================================
  // Projects
  // ============================================================================

  ipcMain.handle('projects:getAll', handleGetAllProjects);
  ipcMain.handle('projects:getById', handleGetProjectById);
  ipcMain.handle('projects:getByPortfolio', handleGetProjectsByPortfolio);
  ipcMain.handle('projects:create', handleCreateProject);
  ipcMain.handle('projects:update', handleUpdateProject);
  ipcMain.handle('projects:delete', handleDeleteProject);

  // ============================================================================
  // Work Items
  // ============================================================================

  ipcMain.handle('workItems:getAll', handleGetAllWorkItems);
  ipcMain.handle('workItems:getByProject', handleGetWorkItemsByProject);
  ipcMain.handle('workItems:getByParent', handleGetWorkItemsByParent);
  ipcMain.handle('workItems:create', handleCreateWorkItem);
  ipcMain.handle('workItems:update', handleUpdateWorkItem);
  ipcMain.handle('workItems:delete', handleDeleteWorkItem);

  // ============================================================================
  // Inbox
  // ============================================================================

  ipcMain.handle('inbox:getAll', handleGetAllInboxItems);
  ipcMain.handle('inbox:create', handleCreateInboxItem);
  ipcMain.handle('inbox:markProcessed', handleMarkInboxProcessed);
  ipcMain.handle('inbox:delete', handleDeleteInboxItem);

  // ============================================================================
  // Todos
  // ============================================================================

  ipcMain.handle('todos:getAll', handleGetAllTodos);
  ipcMain.handle('todos:getByDate', handleGetTodosByDate);
  ipcMain.handle('todos:create', handleCreateTodo);
  ipcMain.handle('todos:update', handleUpdateTodo);
  ipcMain.handle('todos:toggle', handleToggleTodo);
  ipcMain.handle('todos:delete', handleDeleteTodo);

  // ============================================================================
  // Settings
  // ============================================================================

  ipcMain.handle('settings:get', handleGetSetting);
  ipcMain.handle('settings:set', handleSetSetting);
  ipcMain.handle('settings:export', handleExportData);
  ipcMain.handle('settings:import', handleImportData);

  // ============================================================================
  // Dashboard
  // ============================================================================

  ipcMain.handle('dashboard:getPortfolioSummary', handleGetPortfolioSummary);

  // ============================================================================
  // Search
  // ============================================================================

  ipcMain.handle('search:global', handleGlobalSearch);
}

// ============================================================================
// Workspace Handlers
// ============================================================================

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

// ============================================================================
// Portfolio Handlers
// ============================================================================

function handleGetAllPortfolios(): IPCResponse<Portfolio[]> {
  try {
    const db = getDatabase();
    const portfolios = db.prepare('SELECT * FROM portfolios ORDER BY created_at DESC').all() as Portfolio[];

    // Populate project IDs for each portfolio
    for (const portfolio of portfolios) {
      const projectIds = db.prepare('SELECT project_id FROM portfolio_projects WHERE portfolio_id = ?')
        .all(portfolio.id)
        .map((row: any) => row.project_id);
      portfolio.projectIds = projectIds;
    }

    return { success: true, data: portfolios };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleGetPortfolioById(_event: any, id: number): IPCResponse<Portfolio> {
  try {
    const db = getDatabase();
    const portfolio = db.prepare('SELECT * FROM portfolios WHERE id = ?').get(id) as Portfolio;

    if (portfolio) {
      const projectIds = db.prepare('SELECT project_id FROM portfolio_projects WHERE portfolio_id = ?')
        .all(id)
        .map((row: any) => row.project_id);
      portfolio.projectIds = projectIds;
    }

    return { success: true, data: portfolio };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleCreatePortfolio(_event: any, data: CreatePortfolioDTO): IPCResponse<Portfolio> {
  try {
    const db = getDatabase();
    const uuid = crypto.randomUUID();
    const now = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO portfolios (uuid, name, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuid, data.name, data.description || null, now, now);

    const portfolio = db.prepare('SELECT * FROM portfolios WHERE id = ?').get(result.lastInsertRowid) as Portfolio;
    portfolio.projectIds = [];

    return { success: true, data: portfolio };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleUpdatePortfolio(_event: any, id: number, data: UpdatePortfolioDTO): IPCResponse<Portfolio> {
  try {
    const db = getDatabase();
    const now = new Date().toISOString();

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    db.prepare(`UPDATE portfolios SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const portfolio = db.prepare('SELECT * FROM portfolios WHERE id = ?').get(id) as Portfolio;
    const projectIds = db.prepare('SELECT project_id FROM portfolio_projects WHERE portfolio_id = ?')
      .all(id)
      .map((row: any) => row.project_id);
    portfolio.projectIds = projectIds;

    return { success: true, data: portfolio };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleDeletePortfolio(_event: any, id: number): IPCResponse<void> {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM portfolios WHERE id = ?').run(id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleAddProjectToPortfolio(_event: any, portfolioId: number, projectId: number): IPCResponse<void> {
  try {
    const db = getDatabase();
    db.prepare('INSERT OR IGNORE INTO portfolio_projects (portfolio_id, project_id) VALUES (?, ?)')
      .run(portfolioId, projectId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleRemoveProjectFromPortfolio(_event: any, portfolioId: number, projectId: number): IPCResponse<void> {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM portfolio_projects WHERE portfolio_id = ? AND project_id = ?')
      .run(portfolioId, projectId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// Project Handlers
// ============================================================================

function handleGetAllProjects(): IPCResponse<Project[]> {
  try {
    const db = getDatabase();
    const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as Project[];

    // Parse tags_json for each project
    for (const project of projects) {
      if (project.tags_json) {
        try {
          project.tags = JSON.parse(project.tags_json);
        } catch {
          project.tags = [];
        }
      }
    }

    return { success: true, data: projects };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleGetProjectById(_event: any, id: number): IPCResponse<Project> {
  try {
    const db = getDatabase();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project;

    if (project && project.tags_json) {
      try {
        project.tags = JSON.parse(project.tags_json);
      } catch {
        project.tags = [];
      }
    }

    return { success: true, data: project };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleGetProjectsByPortfolio(_event: any, portfolioId: number): IPCResponse<Project[]> {
  try {
    const db = getDatabase();
    const projects = db.prepare(`
      SELECT p.* FROM projects p
      INNER JOIN portfolio_projects pp ON p.id = pp.project_id
      WHERE pp.portfolio_id = ?
      ORDER BY p.created_at DESC
    `).all(portfolioId) as Project[];

    for (const project of projects) {
      if (project.tags_json) {
        try {
          project.tags = JSON.parse(project.tags_json);
        } catch {
          project.tags = [];
        }
      }
    }

    return { success: true, data: projects };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleCreateProject(_event: any, data: CreateProjectDTO): IPCResponse<Project> {
  try {
    const db = getDatabase();
    const uuid = crypto.randomUUID();
    const now = new Date().toISOString();
    const tags_json = data.tags ? JSON.stringify(data.tags) : null;

    const result = db.prepare(`
      INSERT INTO projects (uuid, name, owner, status, start_date, end_date, portfolio_id, tags_json, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuid,
      data.name,
      data.owner || null,
      data.status || 'not_started',
      data.start_date || null,
      data.end_date || null,
      data.portfolio_id || null,
      tags_json,
      data.description || null,
      now,
      now
    );

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid) as Project;
    if (project.tags_json) {
      project.tags = JSON.parse(project.tags_json);
    }

    // If portfolio_id provided, add to junction table
    if (data.portfolio_id) {
      db.prepare('INSERT OR IGNORE INTO portfolio_projects (portfolio_id, project_id) VALUES (?, ?)')
        .run(data.portfolio_id, result.lastInsertRowid);
    }

    return { success: true, data: project };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleUpdateProject(_event: any, id: number, data: UpdateProjectDTO): IPCResponse<Project> {
  try {
    const db = getDatabase();
    const now = new Date().toISOString();

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.owner !== undefined) {
      updates.push('owner = ?');
      values.push(data.owner);
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
    if (data.portfolio_id !== undefined) {
      updates.push('portfolio_id = ?');
      values.push(data.portfolio_id);
    }
    if (data.tags !== undefined) {
      updates.push('tags_json = ?');
      values.push(JSON.stringify(data.tags));
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project;
    if (project && project.tags_json) {
      project.tags = JSON.parse(project.tags_json);
    }

    return { success: true, data: project };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function handleDeleteProject(_event: any, id: number): IPCResponse<void> {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// Work Item Handlers
// ============================================================================

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

    // Build hierarchy
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

    // Determine level: if has parent_id, level is 2, otherwise 1
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

    // Write audit log
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

    // Get old values for audit log before updating
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

    // Write audit log
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

    // Get the item being deleted for audit log
    const workItem = db.prepare('SELECT * FROM work_items WHERE id = ?').get(id) as WorkItem | undefined;

    // Get child items that will be cascade deleted
    const childItems = db.prepare('SELECT * FROM work_items WHERE parent_id = ?').all(id) as WorkItem[];

    // Delete the item (CASCADE will delete children)
    db.prepare('DELETE FROM work_items WHERE id = ?').run(id);

    // Write audit log for the deleted item
    if (workItem) {
      writeAuditLog({
        entity_type: 'work_item',
        entity_id: String(id),
        action: 'delete',
        source: 'gantt',
        old_values_json: JSON.stringify(workItem),
      });
    }

    // Write audit logs for cascade-deleted children
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

// ============================================================================
// Inbox Handlers
// ============================================================================

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

// ============================================================================
// Todo Handlers
// ============================================================================

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

// ============================================================================
// Settings Handlers
// ============================================================================

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

    // Clear existing data
    db.prepare('DELETE FROM todos').run();
    db.prepare('DELETE FROM inbox_items').run();
    db.prepare('DELETE FROM work_items').run();
    db.prepare('DELETE FROM portfolio_projects').run();
    db.prepare('DELETE FROM projects').run();
    db.prepare('DELETE FROM portfolios').run();
    db.prepare('DELETE FROM settings').run();

    // Import data
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

// ============================================================================
// Dashboard Handlers
// ============================================================================

function handleGetPortfolioSummary(): IPCResponse<PortfolioSummary> {
  try {
    const db = getDatabase();

    const totalProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
    const totalWorkItems = db.prepare('SELECT COUNT(*) as count FROM work_items').get() as { count: number };

    const statusCounts = db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'not_started' THEN 1 ELSE 0 END) as not_started,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
        SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked
      FROM (
        SELECT status FROM projects
        UNION ALL
        SELECT status FROM work_items
      )
    `).get() as any;

    const blockedCount = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT id FROM projects WHERE status = 'blocked'
        UNION ALL
        SELECT id FROM work_items WHERE status = 'blocked'
      )
    `).get() as { count: number };

    const atRiskCount = db.prepare(`
      SELECT COUNT(*) as count FROM work_items WHERE type = 'issue'
    `).get() as { count: number };

    const summary: PortfolioSummary = {
      totalProjects: totalProjects.count,
      totalWorkItems: totalWorkItems.count,
      atRisk: atRiskCount.count,
      blocked: blockedCount.count,
      statusDistribution: {
        not_started: statusCounts.not_started || 0,
        in_progress: statusCounts.in_progress || 0,
        done: statusCounts.done || 0,
        blocked: statusCounts.blocked || 0,
      },
    };

    return { success: true, data: summary };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// Search Handlers
// ============================================================================

function handleGlobalSearch(_event: any, query: string): IPCResponse<SearchResult[]> {
  try {
    const db = getDatabase();
    const results: SearchResult[] = [];
    const searchPattern = `%${query}%`;

    // Search portfolios
    const portfolios = db.prepare(`
      SELECT id, uuid, name, description FROM portfolios
      WHERE name LIKE ? OR description LIKE ?
      LIMIT 10
    `).all(searchPattern, searchPattern) as any[];

    for (const p of portfolios) {
      results.push({
        type: 'portfolio',
        id: p.id,
        uuid: p.uuid,
        title: p.name,
        subtitle: p.description,
      });
    }

    // Search projects
    const projects = db.prepare(`
      SELECT id, uuid, name, owner, status FROM projects
      WHERE name LIKE ? OR description LIKE ?
      LIMIT 10
    `).all(searchPattern, searchPattern) as any[];

    for (const p of projects) {
      results.push({
        type: 'project',
        id: p.id,
        uuid: p.uuid,
        title: p.name,
        subtitle: p.owner,
        metadata: { status: p.status },
      });
    }

    // Search work items
    const workItems = db.prepare(`
      SELECT id, uuid, title, type, status FROM work_items
      WHERE title LIKE ? OR notes LIKE ?
      LIMIT 10
    `).all(searchPattern, searchPattern) as any[];

    for (const w of workItems) {
      results.push({
        type: 'work_item',
        id: w.id,
        uuid: w.uuid,
        title: w.title,
        subtitle: w.type,
        metadata: { status: w.status },
      });
    }

    // Search inbox
    const inboxItems = db.prepare(`
      SELECT id, uuid, raw_text FROM inbox_items
      WHERE raw_text LIKE ? AND processed = 0
      LIMIT 10
    `).all(searchPattern) as any[];

    for (const i of inboxItems) {
      results.push({
        type: 'inbox',
        id: i.id,
        uuid: i.uuid,
        title: i.raw_text.substring(0, 100),
      });
    }

    return { success: true, data: results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
