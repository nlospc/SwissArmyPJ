import { getDatabase } from '../db/schema';
import type { GanttTask, GanttDependency, ApiResponse } from '@shared/types';

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
          parent_id: wp.parent_id,
          children: [],
          dependencies: [],
          isCritical: node.isCritical,
          slack: node.slack,
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
}

export const ganttService = new GanttService();
