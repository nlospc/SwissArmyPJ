import { ipcMain } from 'electron';
import * as crypto from 'node:crypto';

import { getDatabase } from '../database/schema';

import type {
  CreateProjectDTO,
  IPCResponse,
  Project,
  UpdateProjectDTO,
} from '../../shared/types';

export function registerProjectHandlers(): void {
  ipcMain.handle('projects:getAll', handleGetAllProjects);
  ipcMain.handle('projects:getById', handleGetProjectById);
  ipcMain.handle('projects:getByPortfolio', handleGetProjectsByPortfolio);
  ipcMain.handle('projects:create', handleCreateProject);
  ipcMain.handle('projects:update', handleUpdateProject);
  ipcMain.handle('projects:delete', handleDeleteProject);
}

function handleGetAllProjects(): IPCResponse<Project[]> {
  try {
    const db = getDatabase();
    const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as Project[];

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