export interface Project {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived' | 'on_hold';
  created_at: string;
  updated_at: string;
}

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
