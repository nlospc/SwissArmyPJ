import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/schema';
import type { Project, ProjectInput, ProjectUpdate, ApiResponse } from '@shared/types';

export class ProjectService {
  private get db() {
    return getDatabase();
  }

  getAll(): ApiResponse<Project[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM projects
        ORDER BY created_at DESC
      `);
      const projects = stmt.all() as Project[];
      return { success: true, data: projects };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  getById(id: number): ApiResponse<Project> {
    try {
      const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
      const project = stmt.get(id) as Project | undefined;
      if (!project) {
        return { success: false, error: 'Project not found' };
      }
      return { success: true, data: project };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  create(input: ProjectInput): ApiResponse<Project> {
    try {
      const uuid = uuidv4();
      const now = new Date().toISOString();
      
      const stmt = this.db.prepare(`
        INSERT INTO projects (uuid, name, description, start_date, end_date, status, budget_planned, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        uuid,
        input.name,
        input.description || null,
        input.start_date || null,
        input.end_date || null,
        input.status || 'active',
        input.budget_planned || 0,
        now,
        now
      );

      return this.getById(result.lastInsertRowid as number);
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  update(id: number, input: ProjectUpdate): ApiResponse<Project> {
    try {
      const now = new Date().toISOString();
      
      const existing = this.getById(id);
      if (!existing.success || !existing.data) {
        return { success: false, error: 'Project not found' };
      }

      const stmt = this.db.prepare(`
        UPDATE projects
        SET name = COALESCE(?, name),
            description = COALESCE(?, description),
            start_date = COALESCE(?, start_date),
            end_date = COALESCE(?, end_date),
            status = COALESCE(?, status),
            budget_planned = COALESCE(?, budget_planned),
            updated_at = ?
        WHERE id = ?
      `);

      stmt.run(
        input.name ?? null,
        input.description ?? null,
        input.start_date ?? null,
        input.end_date ?? null,
        input.status ?? null,
        input.budget_planned ?? null,
        now,
        id
      );

      return this.getById(id);
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  delete(id: number): ApiResponse<void> {
    try {
      const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
      stmt.run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

export const projectService = new ProjectService();
