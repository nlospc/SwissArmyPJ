import { ipcMain } from 'electron';
import * as crypto from 'node:crypto';

import { getDatabase } from '../database/schema';

import type {
  CreatePortfolioDTO,
  IPCResponse,
  Portfolio,
  UpdatePortfolioDTO,
} from '../../shared/types';

export function registerPortfolioHandlers(): void {
  ipcMain.handle('portfolios:getAll', handleGetAllPortfolios);
  ipcMain.handle('portfolios:getById', handleGetPortfolioById);
  ipcMain.handle('portfolios:create', handleCreatePortfolio);
  ipcMain.handle('portfolios:update', handleUpdatePortfolio);
  ipcMain.handle('portfolios:delete', handleDeletePortfolio);
  ipcMain.handle('portfolios:addProject', handleAddProjectToPortfolio);
  ipcMain.handle('portfolios:removeProject', handleRemoveProjectFromPortfolio);
}

function handleGetAllPortfolios(): IPCResponse<Portfolio[]> {
  try {
    const db = getDatabase();
    const portfolios = db.prepare('SELECT * FROM portfolios ORDER BY created_at DESC').all() as Portfolio[];

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
