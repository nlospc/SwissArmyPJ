import { ipcMain } from 'electron';
import { getDatabase } from '../database/schema';

import type { IPCResponse, PortfolioSummary } from '../../shared/types';

export function registerDashboardHandlers() {
  ipcMain.handle('dashboard:getPortfolioSummary', handleGetPortfolioSummary);

  // Get portfolio metrics
  ipcMain.handle('dashboard:get-metrics', async () => {
    const db = getDatabase();

    const activeProjects = db.prepare(`
      SELECT COUNT(*) as count
      FROM projects
      WHERE status = 'in_progress'
    `).get() as { count: number };

    const totalTasks = db.prepare(`
      SELECT COUNT(*) as count
      FROM work_items
      WHERE type = 'task'
    `).get() as { count: number };

    const openIssues = db.prepare(`
      SELECT COUNT(*) as count
      FROM work_items
      WHERE type = 'issue' AND status != 'done'
    `).get() as { count: number };

    const upcomingMilestones = db.prepare(`
      SELECT COUNT(*) as count
      FROM work_items
      WHERE type = 'milestone'
        AND end_date >= date('now')
        AND end_date <= date('now', '+14 days')
    `).get() as { count: number };

    // Calculate on-track percentage
    const totalProjects = db.prepare(`
      SELECT COUNT(*) as count
      FROM projects
      WHERE status IN ('in_progress', 'not_started')
    `).get() as { count: number };

    const atRiskProjects = db.prepare(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM projects p
      LEFT JOIN work_items wi ON p.id = wi.project_id
      WHERE p.status = 'in_progress'
        AND (
          EXISTS (
            SELECT 1 FROM work_items
            WHERE project_id = p.id
              AND type = 'milestone'
              AND end_date < date('now')
          )
          OR EXISTS (
            SELECT 1 FROM work_items
            WHERE project_id = p.id
              AND status = 'blocked'
          )
          OR EXISTS (
            SELECT 1 FROM work_items
            WHERE project_id = p.id
              AND type = 'issue'
              AND status != 'done'
              AND notes LIKE '%Critical%'
          )
        )
    `).get() as { count: number };

    const blockedProjects = db.prepare(`
      SELECT COUNT(*) as count
      FROM projects
      WHERE status = 'blocked'
    `).get() as { count: number };

    const onTrackCount = totalProjects.count - atRiskProjects.count - blockedProjects.count;
    const onTrackPercentage = totalProjects.count > 0
      ? Math.round((onTrackCount / totalProjects.count) * 100)
      : 0;

    return {
      activeProjects: activeProjects.count,
      totalTasks: totalTasks.count,
      openIssues: openIssues.count,
      upcomingMilestones: upcomingMilestones.count,
      onTrackPercentage,
      atRiskCount: atRiskProjects.count,
      blockedCount: blockedProjects.count,
    };
  });

  // Get project health
  ipcMain.handle('dashboard:get-project-health', async (_event, portfolioId: number | null) => {
    const db = getDatabase();

    let portfolioFilter = '';
    if (portfolioId !== null) {
      portfolioFilter = `AND p.portfolio_id = ${portfolioId}`;
    }

    const projects = db.prepare(`
      SELECT
        p.id,
        p.uuid,
        p.name,
        p.status,
        COUNT(CASE WHEN wi.status = 'done' THEN 1 END) as done_tasks,
        COUNT(CASE WHEN wi.type = 'task' THEN 1 END) as total_tasks,
        COUNT(CASE WHEN wi.status = 'blocked' THEN 1 END) as blocked_count,
        COUNT(CASE WHEN wi.type = 'issue' AND wi.status != 'done' AND (wi.notes LIKE '%Critical%' OR wi.notes LIKE '%High%') THEN 1 END) as high_risks
      FROM projects p
      LEFT JOIN work_items wi ON p.id = wi.project_id
      WHERE p.status IN ('in_progress', 'not_started') ${portfolioFilter}
      GROUP BY p.id
    `).all() as any[];

    return projects.map((project) => {
      // Calculate health status
      let healthStatus: 'on_track' | 'at_risk' | 'critical' | 'blocked' = 'on_track';

      if (project.status === 'blocked' || project.blocked_count > 0) {
        healthStatus = 'blocked';
      } else {
        // Check for overdue milestones
        const overdueMilestones = db.prepare(`
          SELECT COUNT(*) as count
          FROM work_items
          WHERE project_id = ?
            AND type = 'milestone'
            AND end_date < date('now')
            AND status != 'done'
        `).get(project.id) as { count: number };

        if (overdueMilestones.count > 0) {
          healthStatus = 'critical';
        } else if (project.high_risks > 0) {
          healthStatus = 'at_risk';
        }
      }

      // Get next milestone
      const nextMilestone = db.prepare(`
        SELECT id, title, end_date
        FROM work_items
        WHERE project_id = ?
          AND type = 'milestone'
          AND end_date >= date('now')
        ORDER BY end_date ASC
        LIMIT 1
      `).get(project.id) as { id: number; title: string; end_date: string } | undefined;

      let milestoneStatus = 'on_track';
      if (nextMilestone) {
        const daysUntilDue = Math.ceil(
          (new Date(nextMilestone.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDue < 0) {
          milestoneStatus = 'overdue';
        } else if (daysUntilDue <= 3) {
          milestoneStatus = 'at_risk';
        }
      }

      return {
        id: project.id,
        uuid: project.uuid,
        name: project.name,
        status: healthStatus,
        progressPercent: project.total_tasks > 0
          ? Math.round((project.done_tasks / project.total_tasks) * 100)
          : 0,
        doneTasks: project.done_tasks,
        totalTasks: project.total_tasks,
        nextMilestone: nextMilestone ? {
          id: nextMilestone.id,
          name: nextMilestone.title,
          date: nextMilestone.end_date,
          status: milestoneStatus,
        } : null,
        blockerCount: project.blocked_count,
        highRiskCount: project.high_risks,
      };
    });
  });

  // Get change feed
  ipcMain.handle('dashboard:get-change-feed', async (_event, filters: { dateRange: string; eventTypes: string[] }) => {
    const db = getDatabase();

    let dateFilter = '';
    if (filters.dateRange === 'day') {
      dateFilter = "AND al.created_at > datetime('now', '-1 day')";
    } else if (filters.dateRange === 'week') {
      dateFilter = "AND al.created_at > datetime('now', '-7 days')";
    } else if (filters.dateRange === 'month') {
      dateFilter = "AND al.created_at > datetime('now', '-30 days')";
    }

    const typeFilter = filters.eventTypes.length > 0
      ? `AND al.action IN ('${filters.eventTypes.join("','")}')`
      : '';

    const events = db.prepare(`
      SELECT
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.created_at,
        al.source
      FROM audit_log al
      WHERE 1=1 ${dateFilter} ${typeFilter}
      ORDER BY al.created_at DESC
      LIMIT 50
    `).all() as any[];

    return events.map((event) => {
      let details = '';

      switch (event.action) {
        case 'created':
          details = `New ${event.entity_type.toLowerCase()}: "${event.entity_type}"`;
          break;
        case 'updated':
          details = `${event.entity_type} "${event.entity_type}" was updated`;
          break;
        case 'deleted':
          details = `Deleted ${event.entity_type.toLowerCase()}: "${event.entity_type}"`;
          break;
        case 'completed':
          details = `${event.entity_type} "${event.entity_type}" completed`;
          break;
        case 'conflict':
          details = `Conflict detected: "${event.entity_type}"`;
          break;
        case 'sync':
          details = `File sync: ${event.entity_type}`;
          break;
      }

      return {
        id: event.id,
        action: event.action,
        entityType: event.entity_type,
        entityId: event.entity_id,
        timestamp: event.created_at,
        details,
      };
    });
  });

  // Get upcoming milestones
  ipcMain.handle('dashboard:get-upcoming-milestones', async () => {
    const db = getDatabase();

    const milestones = db.prepare(`
      SELECT
        wi.id,
        wi.title as name,
        p.name as project_name,
        p.id as project_id,
        wi.end_date as due_date
      FROM work_items wi
      JOIN projects p ON wi.project_id = p.id
      WHERE wi.type = 'milestone'
        AND wi.end_date >= date('now', '-7 days')
        AND wi.status != 'done'
      ORDER BY wi.end_date ASC
      LIMIT 20
    `).all() as any[];

    return milestones.map((milestone) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(milestone.due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let status: 'on_track' | 'at_risk' | 'overdue' = 'on_track';
      if (daysUntilDue < 0) {
        status = 'overdue';
      } else if (daysUntilDue <= 3) {
        status = 'at_risk';
      }

      return {
        id: milestone.id,
        name: milestone.name,
        projectName: milestone.project_name,
        projectId: milestone.project_id,
        dueDate: milestone.due_date,
        status,
      };
    });
  });

  // Get risk summary
  ipcMain.handle('dashboard:get-risk-summary', async () => {
    const db = getDatabase();

    const critical = db.prepare(`
      SELECT COUNT(*) as count
      FROM work_items
      WHERE type = 'issue'
        AND status != 'done'
        AND (notes LIKE '%Critical%' OR notes LIKE '%critical%')
    `).get() as { count: number };

    const high = db.prepare(`
      SELECT COUNT(*) as count
      FROM work_items
      WHERE type = 'issue'
        AND status != 'done'
        AND (notes LIKE '%High%' OR notes LIKE '%high%')
    `).get() as { count: number };

    const medium = db.prepare(`
      SELECT COUNT(*) as count
      FROM work_items
      WHERE type = 'issue'
        AND status != 'done'
        AND (notes LIKE '%Medium%' OR notes LIKE '%medium%')
    `).get() as { count: number };

    const low = db.prepare(`
      SELECT COUNT(*) as count
      FROM work_items
      WHERE type = 'issue'
        AND status != 'done'
        AND (notes LIKE '%Low%' OR notes LIKE '%low%')
    `).get() as { count: number };

    return {
      critical: critical.count,
      high: high.count,
      medium: medium.count,
      low: low.count,
    };
  });
}

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
