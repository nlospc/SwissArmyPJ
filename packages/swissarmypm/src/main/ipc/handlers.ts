import { ipcMain } from 'electron';
import * as crypto from 'node:crypto';

import { getDatabase } from '../database/schema';

import type {

  IPCResponse,

  Portfolio,

  Todo,

  CreatePortfolioDTO,

  UpdatePortfolioDTO,

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



export function registerCoreIPCHandlers(): void {
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
  // Todos
  // ============================================================================

  ipcMain.handle('todos:getAll', handleGetAllTodos);
  ipcMain.handle('todos:getByDate', handleGetTodosByDate);
  ipcMain.handle('todos:create', handleCreateTodo);
  ipcMain.handle('todos:update', handleUpdateTodo);
  ipcMain.handle('todos:toggle', handleToggleTodo);
  ipcMain.handle('todos:delete', handleDeleteTodo);

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
