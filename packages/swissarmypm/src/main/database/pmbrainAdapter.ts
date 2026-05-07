import Database from 'better-sqlite3';
import * as path from 'path';

// ============================================================================
// PMBrain 原生类型
// ============================================================================

interface PMBrainProject {
  id: string;           // UUID (TEXT)
  code: string;         // PROJ-001
  owner: string | null;
  sponsor: string | null;
  status: string;       // planning/active/completed/on_hold/cancelled
  priority: string | null;
  health: string | null;
  objective: string | null;
  start_date: string | null;
  target_date: string | null;
  end_date: string | null;
  progress_pct: number;
  program_id: string | null;
  program_role: string;
  created_at: string;
  updated_at: string;
  title: string;        // from pages
  summary: string | null; // from pages
}

interface PMBrainWorkItem {
  id: string;
  project_id: string;
  page_id: string;
  code: string | null;  // ISSUE-001
  title: string;
  description: string | null;
  item_type: string;    // issue/defect/requirement/action_item
  status: string;       // new/analysis/in_progress/done/cancelled/on_hold
  priority: string | null;
  severity: string | null;
  owner: string | null;
  reporter: string | null;
  parent_id: string | null;
  due_date: string | null;
  resolved_at: string | null;
  resolution: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SwissArmyPM 兼容类型（从 shared/types 复用）
// ============================================================================

type ProjectStatus = 'not_started' | 'in_progress' | 'done' | 'blocked';
type WorkItemType = 'task' | 'issue' | 'milestone' | 'phase' | 'remark' | 'clash';
type WorkItemStatus = 'not_started' | 'in_progress' | 'done' | 'blocked';
type WorkItemPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Project {
  id: number;
  uuid: string;
  name: string;
  owner: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  portfolio_id: number | null;
  tags_json: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export interface WorkItem {
  id: number;
  uuid: string;
  project_id: number;
  parent_id: number | null;
  type: WorkItemType;
  title: string;
  status: WorkItemStatus;
  start_date: string | null;
  end_date: string | null;
  level: 1 | 2;
  notes: string | null;
  owner: string | null;
  priority: WorkItemPriority | null;
  created_at: string;
  updated_at: string;
  children?: WorkItem[];
}

export interface SearchResult {
  entity_id: string;
  entity_type: string;
  title: string;
  highlight: string;
}

// ============================================================================
// 适配器核心类
// ============================================================================

export class PMBrainAdapter {
  private db: Database.Database;
  private projectIdMap: Map<string, number>; // uuid -> temp integer id

  constructor(dbPath?: string) {
    // 优先使用传入路径，其次检测 monorepo 结构
    let finalPath = dbPath;
    if (!finalPath) {
      // 尝试 monorepo 结构：packages/pmbrain/.pmbrain/pmbrain.db
      const monorepoPath = path.join(process.cwd(), 'packages/pmbrain/.pmbrain/pmbrain.db');
      if (require('fs').existsSync(monorepoPath)) {
        finalPath = monorepoPath;
      } else {
        // 回退到当前工作目录
        finalPath = path.join(process.cwd(), '.pmbrain/pmbrain.db');
      }
    }
    console.log('[PMBrain Adapter] Opening database:', finalPath);
    this.db = new Database(finalPath, { fileMustExist: true });
    this.projectIdMap = new Map();
  }

  // ==========================================================================
  // 字段映射逻辑
  // ==========================================================================

  private mapProjectStatus(pmbrainStatus: string): ProjectStatus {
    const mapping: Record<string, ProjectStatus> = {
      'planning': 'not_started',
      'active': 'in_progress',
      'completed': 'done',
      'on_hold': 'blocked',
      'cancelled': 'blocked',
    };
    return mapping[pmbrainStatus] || 'not_started';
  }

  private mapWorkItemType(pmbrainType: string): WorkItemType {
    const mapping: Record<string, WorkItemType> = {
      'issue': 'issue',
      'defect': 'issue',
      'requirement': 'task',
      'action_item': 'task',
    };
    return mapping[pmbrainType] || 'task';
  }

  private mapWorkItemStatus(pmbrainStatus: string): WorkItemStatus {
    const mapping: Record<string, WorkItemStatus> = {
      'new': 'not_started',
      'analysis': 'not_started',
      'in_progress': 'in_progress',
      'done': 'done',
      'cancelled': 'blocked',
      'on_hold': 'blocked',
    };
    return mapping[pmbrainStatus] || 'not_started';
  }

  private mapWorkItemPriority(pmbrainPriority: string | null): WorkItemPriority | null {
    if (!pmbrainPriority) return null;
    const validPriorities: WorkItemPriority[] = ['low', 'medium', 'high', 'critical'];
    return validPriorities.includes(pmbrainPriority as WorkItemPriority)
      ? pmbrainPriority as WorkItemPriority
      : null;
  }

  // ==========================================================================
  // 项目查询
  // ==========================================================================

  getProjects(): Project[] {
    const pmProjects = this.db.prepare(`
      SELECT p.*, pg.title, pg.summary
      FROM projects p
      JOIN pages pg ON p.id = pg.id
      ORDER BY p.updated_at DESC
    `).all() as PMBrainProject[];

    // 清空并重建 ID 映射
    this.projectIdMap.clear();

    return pmProjects.map((p, index) => {
      const tempId = index + 1;
      this.projectIdMap.set(p.id, tempId);
      
      return {
        id: tempId,                          // 临时 INTEGER ID（UI 展示用）
        uuid: p.id,                          // 真实 UUID 存在这里
        name: p.title,                       // 来自 pages.title
        owner: p.owner,
        status: this.mapProjectStatus(p.status),
        start_date: p.start_date,
        end_date: p.target_date,
        portfolio_id: null,                  // 暂不支持 portfolio 映射
        tags_json: null,
        description: p.summary,              // 来自 pages.summary
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
    });
  }

  getProjectByTempId(tempId: number): Project | undefined {
    const projects = this.getProjects();
    return projects.find(p => p.id === tempId);
  }

  getProjectByUuid(uuid: string): Project | undefined {
    const projects = this.getProjects();
    return projects.find(p => p.uuid === uuid);
  }

  // ==========================================================================
  // 工作项查询
  // ==========================================================================

  getWorkItems(): WorkItem[] {
    // 先获取项目以建立映射
    this.getProjects();

    const pmWorkItems = this.db.prepare(`
      SELECT wi.*, pg.title
      FROM work_items wi
      JOIN pages pg ON wi.page_id = pg.id
      ORDER BY wi.updated_at DESC
    `).all() as PMBrainWorkItem[];

    return pmWorkItems.map((w, index) => ({
      id: index + 1,
      uuid: w.id,
      project_id: this.projectIdMap.get(w.project_id) || 0,
      parent_id: null,                       // 暂不支持层级映射
      type: this.mapWorkItemType(w.item_type),
      title: w.title,
      status: this.mapWorkItemStatus(w.status),
      start_date: null,
      end_date: w.due_date,
      level: 1 as const,
      notes: w.description,
      owner: w.owner,
      priority: this.mapWorkItemPriority(w.priority),
      created_at: w.created_at,
      updated_at: w.updated_at,
    }));
  }

  getWorkItemsByProjectUuid(projectUuid: string): WorkItem[] {
    this.getProjects();

    const pmWorkItems = this.db.prepare(`
      SELECT wi.*, pg.title
      FROM work_items wi
      JOIN pages pg ON wi.page_id = pg.id
      WHERE wi.project_id = ?
      ORDER BY wi.updated_at DESC
    `).all(projectUuid) as PMBrainWorkItem[];

    return pmWorkItems.map((w, index) => ({
      id: index + 1,
      uuid: w.id,
      project_id: this.projectIdMap.get(w.project_id) || 0,
      parent_id: null,
      type: this.mapWorkItemType(w.item_type),
      title: w.title,
      status: this.mapWorkItemStatus(w.status),
      start_date: null,
      end_date: w.due_date,
      level: 1 as const,
      notes: w.description,
      owner: w.owner,
      priority: this.mapWorkItemPriority(w.priority),
      created_at: w.created_at,
      updated_at: w.updated_at,
    }));
  }

  // ==========================================================================
  // 全文搜索（复用 PMBrain 已有的 FTS5 索引）
  // ==========================================================================

  search(query: string): SearchResult[] {
    try {
      return this.db.prepare(`
        SELECT 
          entity_id,
          entity_type,
          title,
          snippet(pmbrain_fts, 3, '【', '】', '...', 32) as highlight
        FROM pmbrain_fts
        WHERE pmbrain_fts MATCH ?
        ORDER BY rank
        LIMIT 20
      `).all(query) as SearchResult[];
    } catch (error) {
      console.error('[PMBrain Adapter] Search failed:', error);
      return [];
    }
  }

  // ==========================================================================
  // 工具方法
  // ==========================================================================

  getStats(): { projects: number; workItems: number; stakeholders: number } {
    const projects = this.db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
    const workItems = this.db.prepare('SELECT COUNT(*) as count FROM work_items').get() as { count: number };
    const stakeholders = this.db.prepare('SELECT COUNT(*) as count FROM stakeholders').get() as { count: number };

    return {
      projects: projects.count,
      workItems: workItems.count,
      stakeholders: stakeholders.count,
    };
  }

  close(): void {
    this.db.close();
  }
}

// ============================================================================
// 单例管理
// ============================================================================

let pmbrainAdapter: PMBrainAdapter | null = null;

export function getPMBrainAdapter(): PMBrainAdapter {
  if (!pmbrainAdapter) {
    pmbrainAdapter = new PMBrainAdapter();
  }
  return pmbrainAdapter;
}

// 检测 PMBrain 数据库是否存在
export function hasPMBrainDB(): boolean {
  try {
    const fs = require('fs');
    // 先尝试 monorepo 结构
    const monorepoPath = path.join(process.cwd(), 'packages/pmbrain/.pmbrain/pmbrain.db');
    if (fs.existsSync(monorepoPath)) {
      const db = new Database(monorepoPath, { fileMustExist: true, readonly: true });
      db.close();
      return true;
    }
    // 回退到当前工作目录
    const dbPath = path.join(process.cwd(), '.pmbrain/pmbrain.db');
    const db = new Database(dbPath, { fileMustExist: true, readonly: true });
    db.close();
    return true;
  } catch (error) {
    console.log('[PMBrain Adapter] PMBrain database not found:', (error as Error).message);
    return false;
  }
}

// 重置适配器（用于测试或配置变更）
export function resetPMBrainAdapter(): void {
  if (pmbrainAdapter) {
    pmbrainAdapter.close();
    pmbrainAdapter = null;
  }
}
