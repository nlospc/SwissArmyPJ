import { getDatabase } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import type { GanttTask, ApiResponse, GanttView, GanttViewInput } from '@shared/types';

interface TaskNode {
  id: number;
  predecessors: number[];
  successors: number[];
  earliestStart: number; // days from project start
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;
  isCritical: boolean;
}

export class GanttService {
  private get db() {
    return getDatabase();
  }

  getGanttState(projectId: number): ApiResponse<GanttTask[]> {
    try {
      // Get all work packages for the project
      const wpStmt = this.db.prepare(`
        SELECT * FROM work_packages
        WHERE project_id = ?
        ORDER BY start_date, created_at
      `);
      const workPackages = wpStmt.all(projectId) as any[];

      // Get all dependencies
      const depStmt = this.db.prepare(`
        SELECT d.* FROM dependencies d
        JOIN work_packages wp1 ON d.predecessor_id = wp1.id
        JOIN work_packages wp2 ON d.successor_id = wp2.id
        WHERE wp1.project_id = ? OR wp2.project_id = ?
      `);
      const dependencies = depStmt.all(projectId, projectId) as any[];

      // Build task graph
      const taskMap = new Map<number, TaskNode>();
      const tasksById = new Map<number, any>();

      // Initialize task nodes
      for (const wp of workPackages) {
        tasksById.set(wp.id, wp);
        taskMap.set(wp.id, {
          id: wp.id,
          predecessors: [],
          successors: [],
          earliestStart: 0,
          earliestFinish: 0,
          latestStart: Infinity,
          latestFinish: Infinity,
          slack: 0,
          isCritical: false,
        });
      }

      // Build predecessor/successor relationships
      for (const dep of dependencies) {
        const predNode = taskMap.get(dep.predecessor_id);
        const succNode = taskMap.get(dep.successor_id);
        if (predNode && succNode) {
          predNode.successors.push(dep.successor_id);
          succNode.predecessors.push(dep.predecessor_id);
        }
      }

      // Calculate project start date
      const projectStart = workPackages.reduce((min, wp) => {
        if (!wp.start_date) return min;
        const date = new Date(wp.start_date).getTime();
        return min === null || date < min ? date : min;
      }, null as number | null) || Date.now();

      // Forward pass - calculate earliest start/finish
      const visited = new Set<number>();
      const calculateEarliest = (taskId: number): void => {
        if (visited.has(taskId)) return;
        visited.add(taskId);

        const node = taskMap.get(taskId)!;
        const wp = tasksById.get(taskId)!;

        // Calculate duration in days
        let duration = 0;
        if (wp.start_date && wp.end_date) {
          duration = Math.ceil((new Date(wp.end_date).getTime() - new Date(wp.start_date).getTime()) / (24 * 60 * 60 * 1000));
        } else if (wp.duration_days) {
          duration = wp.duration_days;
        }

        // Calculate earliest start based on predecessors
        let maxPredFinish = 0;
        for (const predId of node.predecessors) {
          calculateEarliest(predId);
          const predNode = taskMap.get(predId)!;
          const dep = dependencies.find(
            (d: any) => d.predecessor_id === predId && d.successor_id === taskId
          );
          const lag = dep?.lag_days || 0;
          maxPredFinish = Math.max(maxPredFinish, predNode.earliestFinish + lag);
        }

        // Calculate days from project start
        if (wp.start_date) {
          node.earliestStart = Math.ceil((new Date(wp.start_date).getTime() - projectStart) / (24 * 60 * 60 * 1000));
        } else {
          node.earliestStart = maxPredFinish;
        }

        node.earliestFinish = node.earliestStart + duration;
      };

      for (const taskId of taskMap.keys()) {
        calculateEarliest(taskId);
      }

      // Calculate project end
      const projectEnd = Array.from(taskMap.values()).reduce(
        (max, node) => Math.max(max, node.earliestFinish),
        0
      );

      // Backward pass - calculate latest start/finish
      const calculateLatest = (taskId: number): void => {
        const node = taskMap.get(taskId)!;
        const wp = tasksById.get(taskId)!;

        if (node.successors.length === 0) {
          node.latestFinish = projectEnd;
        } else {
          let minSuccStart = Infinity;
          for (const succId of node.successors) {
            calculateLatest(succId);
            const succNode = taskMap.get(succId)!;
            const dep = dependencies.find(
              (d: any) => d.predecessor_id === taskId && d.successor_id === succId
            );
            const lag = dep?.lag_days || 0;
            minSuccStart = Math.min(minSuccStart, succNode.latestStart - lag);
          }
          node.latestFinish = minSuccStart;
        }

        // Calculate duration
        let duration = 0;
        if (wp.start_date && wp.end_date) {
          duration = Math.ceil((new Date(wp.end_date).getTime() - new Date(wp.start_date).getTime()) / (24 * 60 * 60 * 1000));
        } else if (wp.duration_days) {
          duration = wp.duration_days;
        }

        node.latestStart = node.latestFinish - duration;
        node.slack = node.latestStart - node.earliestStart;
        node.isCritical = node.slack === 0;
      };

      // Start backward pass from tasks with no successors
      const endTasks = Array.from(taskMap.values()).filter(node => node.successors.length === 0);
      for (const task of endTasks) {
        calculateLatest(task.id);
      }

      // Build Gantt tasks
      const ganttTasks: GanttTask[] = [];
      const ganttTaskMap = new Map<number, GanttTask>();

      for (const wp of workPackages) {
        const node = taskMap.get(wp.id)!;
        
        const startDate = wp.start_date 
          ? wp.start_date 
          : new Date(projectStart + node.earliestStart * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const endDate = wp.end_date 
          ? wp.end_date 
          : new Date(projectStart + node.earliestFinish * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const ganttTask: GanttTask = {
          id: wp.id,
          uuid: wp.uuid,
          name: wp.name,
          start_date: startDate,
          end_date: endDate,
          progress: wp.progress,
          status: wp.status,
          priority: wp.priority,
          type: wp.type || 'task',
          scheduling_mode: wp.scheduling_mode || 'manual',
          parent_id: wp.parent_id,
          children: [],
          dependencies: [],
          isCritical: node.isCritical,
          slack: node.slack,
          expanded: true,
        };

        ganttTasks.push(ganttTask);
        ganttTaskMap.set(wp.id, ganttTask);
      }

      // Add dependencies to tasks
      for (const dep of dependencies) {
        const task = ganttTaskMap.get(dep.successor_id);
        if (task) {
          task.dependencies.push({
            id: dep.id,
            predecessor_id: dep.predecessor_id,
            successor_id: dep.successor_id,
            type: dep.type,
            lag_days: dep.lag_days,
          });
        }
      }

      // Build parent-child relationships
      for (const task of ganttTasks) {
        if (task.parent_id) {
          const parent = ganttTaskMap.get(task.parent_id);
          if (parent) {
            parent.children.push(task);
          }
        }
      }

      return { success: true, data: ganttTasks };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // View management methods
  getViews(projectId: number | null): ApiResponse<GanttView[]> {
    try {
      let stmt;
      if (projectId === null) {
        // Get global views
        stmt = this.db.prepare(`
          SELECT * FROM gantt_views
          WHERE project_id IS NULL
          ORDER BY created_at DESC
        `);
      } else {
        // Get project-specific views
        stmt = this.db.prepare(`
          SELECT * FROM gantt_views
          WHERE project_id = ? OR project_id IS NULL
          ORDER BY created_at DESC
        `);
        stmt = stmt.bind(projectId);
      }
      const views = stmt.all() as any[];
      
      const parsedViews = views.map(v => ({
        ...v,
        filters: v.filters ? JSON.parse(v.filters) : undefined,
        grouping: v.grouping ? JSON.parse(v.grouping) : undefined,
        sorting: v.sorting ? JSON.parse(v.sorting) : undefined,
        columns: v.columns ? JSON.parse(v.columns) : undefined,
      }));
      
      return { success: true, data: parsedViews };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  createView(input: GanttViewInput): ApiResponse<GanttView> {
    try {
      const uuid = uuidv4();
      const now = new Date().toISOString();
      
      const stmt = this.db.prepare(`
        INSERT INTO gantt_views (
          uuid, project_id, name, scope, filters, grouping, sorting, columns, zoom_level, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        uuid,
        input.project_id || null,
        input.name,
        input.scope,
        input.filters ? JSON.stringify(input.filters) : null,
        input.grouping ? JSON.stringify(input.grouping) : null,
        input.sorting ? JSON.stringify(input.sorting) : null,
        input.columns ? JSON.stringify(input.columns) : null,
        input.zoomLevel || 'week',
        now,
        now
      );
      
      const newView = this.db.prepare('SELECT * FROM gantt_views WHERE id = ?').get(result.lastInsertRowid) as any;
      
      const parsedView = {
        ...newView,
        filters: newView.filters ? JSON.parse(newView.filters) : undefined,
        grouping: newView.grouping ? JSON.parse(newView.grouping) : undefined,
        sorting: newView.sorting ? JSON.parse(newView.sorting) : undefined,
        columns: newView.columns ? JSON.parse(newView.columns) : undefined,
      };
      
      return { success: true, data: parsedView };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  updateView(id: number, input: Partial<GanttViewInput>): ApiResponse<GanttView> {
    try {
      const now = new Date().toISOString();
      const updates: string[] = ['updated_at = ?'];
      const values: any[] = [now];
      
      if (input.name !== undefined) {
        updates.push('name = ?');
        values.push(input.name);
      }
      if (input.scope !== undefined) {
        updates.push('scope = ?');
        values.push(input.scope);
      }
      if (input.filters !== undefined) {
        updates.push('filters = ?');
        values.push(input.filters ? JSON.stringify(input.filters) : null);
      }
      if (input.grouping !== undefined) {
        updates.push('grouping = ?');
        values.push(input.grouping ? JSON.stringify(input.grouping) : null);
      }
      if (input.sorting !== undefined) {
        updates.push('sorting = ?');
        values.push(input.sorting ? JSON.stringify(input.sorting) : null);
      }
      if (input.columns !== undefined) {
        updates.push('columns = ?');
        values.push(input.columns ? JSON.stringify(input.columns) : null);
      }
      if (input.zoomLevel !== undefined) {
        updates.push('zoom_level = ?');
        values.push(input.zoomLevel);
      }
      
      values.push(id);
      
      const stmt = this.db.prepare(`
        UPDATE gantt_views SET ${updates.join(', ')} WHERE id = ?
      `);
      stmt.run(...values);
      
      const updatedView = this.db.prepare('SELECT * FROM gantt_views WHERE id = ?').get(id) as any;
      
      const parsedView = {
        ...updatedView,
        filters: updatedView.filters ? JSON.parse(updatedView.filters) : undefined,
        grouping: updatedView.grouping ? JSON.parse(updatedView.grouping) : undefined,
        sorting: updatedView.sorting ? JSON.parse(updatedView.sorting) : undefined,
        columns: updatedView.columns ? JSON.parse(updatedView.columns) : undefined,
      };
      
      return { success: true, data: parsedView };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  deleteView(id: number): ApiResponse<void> {
    try {
      const stmt = this.db.prepare('DELETE FROM gantt_views WHERE id = ?');
      stmt.run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  setFavoriteView(id: number, isFavorite: boolean): ApiResponse<GanttView> {
    try {
      const now = new Date().toISOString();
      const stmt = this.db.prepare(`
        UPDATE gantt_views SET scope = ?, updated_at = ? WHERE id = ?
      `);
      stmt.run(isFavorite ? 'favorite' : 'private', now, id);
      
      const updatedView = this.db.prepare('SELECT * FROM gantt_views WHERE id = ?').get(id) as any;
      
      const parsedView = {
        ...updatedView,
        filters: updatedView.filters ? JSON.parse(updatedView.filters) : undefined,
        grouping: updatedView.grouping ? JSON.parse(updatedView.grouping) : undefined,
        sorting: updatedView.sorting ? JSON.parse(updatedView.sorting) : undefined,
        columns: updatedView.columns ? JSON.parse(updatedView.columns) : undefined,
      };
      
      return { success: true, data: parsedView };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

export const ganttService = new GanttService();
