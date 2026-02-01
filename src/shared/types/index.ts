// ============================================================================
// Core Entity Types
// ============================================================================

export interface Workspace {
  id: number;
  uuid: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  projectIds?: number[]; // Populated from junction table
}

export interface Project {
  id: number;
  uuid: string;
  name: string;
  owner: string | null;
  status: 'not_started' | 'in_progress' | 'done' | 'blocked';
  start_date: string | null;
  end_date: string | null;
  portfolio_id: number | null;
  tags_json: string | null; // JSON array of strings
  description: string | null;
  created_at: string;
  updated_at: string;
  tags?: string[]; // Parsed from tags_json
}

export interface WorkItem {
  id: number;
  uuid: string;
  project_id: number;
  parent_id: number | null;
  type: 'task' | 'issue' | 'milestone' | 'phase' | 'remark' | 'clash';
  title: string;
  status: 'not_started' | 'in_progress' | 'done' | 'blocked';
  start_date: string | null;
  end_date: string | null;
  level: 1 | 2;
  notes: string | null;
  created_at: string;
  updated_at: string;
  children?: WorkItem[]; // Populated for hierarchical display
}

export interface InboxItem {
  id: number;
  uuid: string;
  source_type: 'text' | 'file' | 'link';
  raw_text: string;
  processed: number; // 0 or 1 (SQLite boolean)
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: number;
  uuid: string;
  text: string;
  done: number; // 0 or 1 (SQLite boolean)
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | null;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
}

// ============================================================================
// Data Transfer Objects (DTOs)
// ============================================================================

export interface CreateWorkspaceDTO {
  name: string;
}

export interface UpdateWorkspaceDTO {
  name: string;
}

export interface CreatePortfolioDTO {
  name: string;
  description?: string;
}

export interface UpdatePortfolioDTO {
  name?: string;
  description?: string;
}

export interface CreateProjectDTO {
  name: string;
  owner?: string;
  status?: 'not_started' | 'in_progress' | 'done' | 'blocked';
  start_date?: string;
  end_date?: string;
  portfolio_id?: number;
  tags?: string[];
  description?: string;
}

export interface UpdateProjectDTO {
  name?: string;
  owner?: string;
  status?: 'not_started' | 'in_progress' | 'done' | 'blocked';
  start_date?: string;
  end_date?: string;
  portfolio_id?: number;
  tags?: string[];
  description?: string;
}

export interface CreateWorkItemDTO {
  project_id: number;
  parent_id?: number;
  type: 'task' | 'issue' | 'milestone' | 'phase' | 'remark' | 'clash';
  title: string;
  status?: 'not_started' | 'in_progress' | 'done' | 'blocked';
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface UpdateWorkItemDTO {
  title?: string;
  status?: 'not_started' | 'in_progress' | 'done' | 'blocked';
  start_date?: string;
  end_date?: string;
  notes?: string;
  type?: 'task' | 'issue' | 'milestone' | 'phase' | 'remark' | 'clash';
}

export interface CreateInboxItemDTO {
  source_type: 'text' | 'file' | 'link';
  raw_text: string;
}

export interface CreateTodoDTO {
  text: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateTodoDTO {
  text?: string;
  done?: boolean;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
}

// ============================================================================
// IPC Response Types
// ============================================================================

export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Search Results
// ============================================================================

export interface SearchResult {
  type: 'portfolio' | 'project' | 'work_item' | 'inbox';
  id: number;
  uuid: string;
  title: string;
  subtitle?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Dashboard/Analytics Types
// ============================================================================

export interface PortfolioSummary {
  totalProjects: number;
  totalWorkItems: number;
  atRisk: number;
  blocked: number;
  statusDistribution: {
    not_started: number;
    in_progress: number;
    done: number;
    blocked: number;
  };
}

export interface ChangeFeedItem {
  id: number;
  type: 'project' | 'work_item';
  action: 'created' | 'updated';
  title: string;
  timestamp: string;
}

// ============================================================================
// Inbox Processing Types
// ============================================================================

export interface InboxExtraction {
  entityType: 'project' | 'work_item';
  mappedFields: Partial<CreateProjectDTO> | Partial<CreateWorkItemDTO>;
  suggestions: {
    field: string;
    value: any;
    confidence: 'high' | 'medium' | 'low';
  }[];
}

// ============================================================================
// Deprecated (for reference during migration)
// ============================================================================

export interface WorkPackage {
  id: number;
  uuid: string;
  project_id: number;
  parent_id: number | null;
  name: string;
  description: string | null;
  type: 'task' | 'phase' | 'milestone';
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  start_date: string | null;
  end_date: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
}
