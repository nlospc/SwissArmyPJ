import { getDatabase } from '../db/schema';
import type { Dependency, DependencyInput, ApiResponse } from '@shared/types';

export class DependencyService {
  private get db() {
    return getDatabase();
  }

  getAll(): ApiResponse<Dependency[]> {
    try {
      const stmt = this.db.prepare('SELECT * FROM dependencies');
      const dependencies = stmt.all() as Dependency[];
      return { success: true, data: dependencies };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  getByWorkPackage(workPackageId: number): ApiResponse<Dependency[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM dependencies
        WHERE predecessor_id = ? OR successor_id = ?
      `);
      const dependencies = stmt.all(workPackageId, workPackageId) as Dependency[];
      return { success: true, data: dependencies };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  create(input: DependencyInput): ApiResponse<Dependency> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO dependencies (predecessor_id, successor_id, type, lag_days)
        VALUES (?, ?, ?, ?)
      `);

      const result = stmt.run(
        input.predecessor_id,
        input.successor_id,
        input.type || 'finish_to_start',
        input.lag_days || 0
      );

      const getStmt = this.db.prepare('SELECT * FROM dependencies WHERE id = ?');
      const dependency = getStmt.get(result.lastInsertRowid as number) as Dependency;
      return { success: true, data: dependency };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  delete(id: number): ApiResponse<void> {
    try {
      const stmt = this.db.prepare('DELETE FROM dependencies WHERE id = ?');
      stmt.run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

export const dependencyService = new DependencyService();
