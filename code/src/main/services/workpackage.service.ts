import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/schema';
import type { WorkPackage, WorkPackageInput, WorkPackageUpdate, ApiResponse } from '@shared/types';
import { progressFromStatus } from '@shared/workPackageRules';

export class WorkPackageService {
  private get db() {
    return getDatabase();
  }

  getAll(): ApiResponse<WorkPackage[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM work_packages
        ORDER BY project_id, parent_id, created_at DESC
      `);
      const workPackages = stmt.all() as WorkPackage[];
      return { success: true, data: workPackages };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  getByProject(projectId: number): ApiResponse<WorkPackage[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM work_packages
        WHERE project_id = ?
        ORDER BY parent_id, start_date, created_at DESC
      `);
      const workPackages = stmt.all(projectId) as WorkPackage[];
      return { success: true, data: workPackages };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  getById(id: number): ApiResponse<WorkPackage> {
    try {
      const stmt = this.db.prepare('SELECT * FROM work_packages WHERE id = ?');
      const workPackage = stmt.get(id) as WorkPackage | undefined;
      if (!workPackage) {
        return { success: false, error: 'Work package not found' };
      }
      return { success: true, data: workPackage };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  create(input: WorkPackageInput): ApiResponse<WorkPackage> {
    try {
      const uuid = uuidv4();
      const now = new Date().toISOString();

      const status = input.status || 'todo';
      const progress = progressFromStatus(status, input.progress ?? 0);
      
      const stmt = this.db.prepare(`
        INSERT INTO work_packages (
          uuid, project_id, parent_id, name, description, start_date, end_date,
          duration_days, progress, status, priority, type, scheduling_mode, budget_planned, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        uuid,
        input.project_id,
        input.parent_id || null,
        input.name,
        input.description || null,
        input.start_date || null,
        input.end_date || null,
        input.duration_days || null,
        progress,
        status,
        input.priority || 'medium',
        input.type || 'task',
        input.scheduling_mode || 'manual',
        input.budget_planned || 0,
        now,
        now
      );

      return this.getById(result.lastInsertRowid as number);
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  update(id: number, input: WorkPackageUpdate): ApiResponse<WorkPackage> {
    try {
      const now = new Date().toISOString();
      
      const existing = this.getById(id);
      if (!existing.success || !existing.data) {
        return { success: false, error: 'Work package not found' };
      }

      const nextStatus = input.status ?? existing.data.status;
      const nextProgress = progressFromStatus(nextStatus, input.progress ?? existing.data.progress);
      const shouldUpdateProgress =
        input.progress !== undefined || (input.status !== undefined && (input.status === 'todo' || input.status === 'done'));

      const stmt = this.db.prepare(`
        UPDATE work_packages
        SET name = COALESCE(?, name),
            description = COALESCE(?, description),
            start_date = COALESCE(?, start_date),
            end_date = COALESCE(?, end_date),
            duration_days = COALESCE(?, duration_days),
            progress = COALESCE(?, progress),
            status = COALESCE(?, status),
            priority = COALESCE(?, priority),
            type = COALESCE(?, type),
            scheduling_mode = COALESCE(?, scheduling_mode),
            parent_id = COALESCE(?, parent_id),
            budget_planned = COALESCE(?, budget_planned),
            updated_at = ?
        WHERE id = ?
      `);

      stmt.run(
        input.name ?? null,
        input.description ?? null,
        input.start_date ?? null,
        input.end_date ?? null,
        input.duration_days ?? null,
        shouldUpdateProgress ? nextProgress : null,
        input.status ?? null,
        input.priority ?? null,
        input.type ?? null,
        input.scheduling_mode ?? null,
        input.parent_id ?? null,
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
      const stmt = this.db.prepare('DELETE FROM work_packages WHERE id = ?');
      stmt.run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Update dates for a work package and propagate to dependents
  updateDates(id: number, startDate: string, endDate: string): ApiResponse<WorkPackage[]> {
    try {
      const now = new Date().toISOString();
      
      // Update the work package
      const updateStmt = this.db.prepare(`
        UPDATE work_packages
        SET start_date = ?, end_date = ?, updated_at = ?
        WHERE id = ?
      `);
      updateStmt.run(startDate, endDate, now, id);

      // Get all dependencies where this is a predecessor
      const depStmt = this.db.prepare(`
        SELECT d.*, wp.start_date, wp.end_date
        FROM dependencies d
        JOIN work_packages wp ON d.successor_id = wp.id
        WHERE d.predecessor_id = ?
      `);
      const dependencies = depStmt.all(id) as any[];

      const updatedIds = new Set<number>([id]);

      // Propagate to dependent tasks
      for (const dep of dependencies) {
        let newStartDate: string;
        let newEndDate: string;

        switch (dep.type) {
          case 'finish_to_start':
            newStartDate = new Date(new Date(endDate).getTime() + dep.lag_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            if (dep.end_date) {
              const duration = new Date(dep.end_date).getTime() - new Date(dep.start_date).getTime();
              newEndDate = new Date(new Date(newStartDate).getTime() + duration).toISOString().split('T')[0];
            } else {
              newEndDate = newStartDate;
            }
            break;
          case 'start_to_start':
            newStartDate = startDate;
            if (dep.end_date) {
              const duration = new Date(dep.end_date).getTime() - new Date(dep.start_date).getTime();
              newEndDate = new Date(new Date(newStartDate).getTime() + duration).toISOString().split('T')[0];
            } else {
              newEndDate = newStartDate;
            }
            break;
          case 'finish_to_finish':
            newEndDate = endDate;
            if (dep.start_date) {
              const duration = new Date(dep.end_date).getTime() - new Date(dep.start_date).getTime();
              newStartDate = new Date(new Date(newEndDate).getTime() - duration).toISOString().split('T')[0];
            } else {
              newStartDate = newEndDate;
            }
            break;
          case 'start_to_finish':
            newEndDate = new Date(new Date(startDate).getTime() + dep.lag_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            if (dep.start_date) {
              const duration = new Date(dep.end_date).getTime() - new Date(dep.start_date).getTime();
              newStartDate = new Date(new Date(newEndDate).getTime() - duration).toISOString().split('T')[0];
            } else {
              newStartDate = newEndDate;
            }
            break;
          default:
            continue;
        }

        if (!updatedIds.has(dep.successor_id)) {
          updatedIds.add(dep.successor_id);
          const result = this.updateDates(dep.successor_id, newStartDate, newEndDate);
          if (result.success && result.data) {
            result.data.forEach(wp => updatedIds.add(wp.id));
          }
        }
      }

      // Return all updated work packages
      const ids = Array.from(updatedIds);
      const placeholders = ids.map(() => '?').join(',');
      const getStmt = this.db.prepare(`SELECT * FROM work_packages WHERE id IN (${placeholders})`);
      const updated = getStmt.all(...ids) as WorkPackage[];

      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

export const workPackageService = new WorkPackageService();
