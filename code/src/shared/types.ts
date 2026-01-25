// Shared types between main and renderer processes

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'cancelled';
export type WorkPackageStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type WorkPackagePriority = 'low' | 'medium' | 'high' | 'critical';
export type WorkPackageType = 'task' | 'phase' | 'milestone' | 'bug';
export type SchedulingMode = 'manual' | 'automatic';
export type DependencyType = 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
export type FileType = 'md' | 'csv' | 'txt';
export type InboxFileStatus = 'pending' | 'processed' | 'failed';
export type ProposalStatus = 'pending' | 'approved' | 'rejected';
export type ViewScope = 'private' | 'public' | 'favorite';

// Project
export interface Project {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  start_date: string | null; // ISO date string
  end_date: string | null; // ISO date string
  status: ProjectStatus;
  budget_planned: number;
  budget_actual: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface ProjectInput {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: ProjectStatus;
  budget_planned?: number;
}

export interface ProjectUpdate extends Partial<ProjectInput> {}

// Work Package
export interface WorkPackage {
  id: number;
  uuid: string;
  project_id: number;
  parent_id: number | null;
  name: string;
  description: string | null;
  start_date: string | null; // ISO date string
  end_date: string | null; // ISO date string
  duration_days: number | null;
  progress: number; // 0-100
  status: WorkPackageStatus;
  priority: WorkPackagePriority;
  type: WorkPackageType;
  scheduling_mode: SchedulingMode;
  budget_planned: number;
  budget_actual: number;
  created_at: string;
  updated_at: string;
  hasConflict?: boolean; // UI-only: True if task violates dependency constraints
}

export interface WorkPackageInput {
  project_id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  duration_days?: number;
  progress?: number;
  status?: WorkPackageStatus;
  priority?: WorkPackagePriority;
  type?: WorkPackageType;
  scheduling_mode?: SchedulingMode;
  parent_id?: number;
  budget_planned?: number;
}

export interface WorkPackageUpdate extends Partial<Omit<WorkPackageInput, 'project_id'>> {}

// Dependency
export interface Dependency {
  id: number;
  predecessor_id: number;
  successor_id: number;
  type: DependencyType;
  lag_days: number;
}

export interface DependencyInput {
  predecessor_id: number;
  successor_id: number;
  type?: DependencyType;
  lag_days?: number;
}

// Member (Phase 2)
export interface Member {
  id: number;
  uuid: string;
  name: string;
  email: string | null;
  role: string | null;
  hourly_rate: number;
  weekly_capacity_hours: number;
  created_at: string;
  updated_at: string;
}

export interface MemberInput {
  name: string;
  email?: string;
  role?: string;
  hourly_rate?: number;
  weekly_capacity_hours?: number;
}

// Assignment (Phase 2)
export interface Assignment {
  id: number;
  work_package_id: number;
  member_id: number;
  planned_hours: number;
  actual_hours: number;
  created_at: string;
  updated_at: string;
}

// Inbox File
export interface InboxFile {
  id: number;
  file_path: string;
  file_type: FileType;
  processed_at: string | null;
  status: InboxFileStatus;
  error_message: string | null;
  created_at: string;
}

// AI Proposal (Phase 3)
export interface AIProposal {
  id: number;
  inbox_file_id: number | null;
  proposal_type: string;
  proposed_changes: string; // JSON string
  status: ProposalStatus;
  reviewed_at: string | null;
  created_at: string;
}

// AI Provider (Phase 3)
export interface AIProvider {
  id: number;
  name: string;
  provider_type: string;
  api_endpoint: string | null;
  api_key_encrypted: string | null;
  model_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Gantt-specific types
export interface GanttTask {
  id: number;
  uuid: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  status: WorkPackageStatus;
  priority: WorkPackagePriority;
  type: WorkPackageType;
  scheduling_mode: SchedulingMode;
  parent_id: number | null;
  children: GanttTask[];
  dependencies: GanttDependency[];
  isCritical: boolean;
  slack: number; // Float/slack in days
  expanded: boolean; // For hierarchy expand/collapse
  hasConflict?: boolean; // True if task violates dependency constraints
}

export interface GanttView {
  id: number;
  uuid: string;
  project_id: number | null; // null for global views
  name: string;
  scope: ViewScope;
  filters: GanttViewFilters;
  grouping: GanttViewGrouping;
  sorting: GanttViewSorting;
  columns: string[];
  zoomLevel: 'day' | 'week' | 'month' | 'quarter';
  created_at: string;
  updated_at: string;
}

export interface GanttViewFilters {
  status?: WorkPackageStatus[];
  type?: WorkPackageType[];
  priority?: WorkPackagePriority[];
  assignee?: number[];
  dateRange?: { start: string; end: string };
}

export interface GanttViewGrouping {
  field: 'none' | 'status' | 'type' | 'priority' | 'assignee' | 'project';
  direction: 'asc' | 'desc';
}

export interface GanttViewSorting {
  field: 'name' | 'start_date' | 'end_date' | 'priority' | 'status';
  direction: 'asc' | 'desc';
}

export interface GanttViewInput {
  project_id?: number;
  name: string;
  scope: ViewScope;
  filters?: GanttViewFilters;
  grouping?: GanttViewGrouping;
  sorting?: GanttViewSorting;
  columns?: string[];
  zoomLevel?: 'day' | 'week' | 'month' | 'quarter';
}

export interface GanttDependency {
  id: number;
  predecessor_id: number;
  successor_id: number;
  type: DependencyType;
  lag_days: number;
}

export interface GanttState {
  tasks: GanttTask[];
  viewStart: string; // ISO date
  viewEnd: string; // ISO date
  zoomLevel: 'day' | 'week' | 'month' | 'quarter';
  selectedTaskId: number | null;
  zenMode: boolean;
  expandedTaskIds: number[];
}

// IPC Channel Types
export type IPCChannel =
  | 'project:getAll'
  | 'project:getById'
  | 'project:create'
  | 'project:update'
  | 'project:delete'
  | 'workPackage:getAll'
  | 'workPackage:getByProject'
  | 'workPackage:create'
  | 'workPackage:update'
  | 'workPackage:delete'
  | 'dependency:getAll'
  | 'dependency:create'
  | 'dependency:delete'
  | 'gantt:getState'
  | 'gantt:updateTaskDates'
  | 'gantt:createDependency'
  | 'gantt:updateSchedulingMode'
  | 'gantt:getViews'
  | 'gantt:createView'
  | 'gantt:updateView'
  | 'gantt:deleteView'
  | 'gantt:setFavoriteView'
  | 'inbox:getAll'
  | 'inbox:processFile'
  | 'workspace:select'
  | 'workspace:getPath';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// CSV Import Types
export interface CSVWorkPackageRow {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  duration_days?: string;
  status?: string;
  priority?: string;
  parent_name?: string;
}
