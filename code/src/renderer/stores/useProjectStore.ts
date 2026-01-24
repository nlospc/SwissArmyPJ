import { create } from 'zustand';
import type { Project, WorkPackage, GanttTask } from '@shared/types';

interface ProjectState {
  projects: Project[];
  selectedProjectId: number | null;
  workPackages: WorkPackage[];
  ganttTasks: GanttTask[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setProjects: (projects: Project[]) => void;
  setSelectedProjectId: (id: number | null) => void;
  setWorkPackages: (workPackages: WorkPackage[]) => void;
  setGanttTasks: (tasks: GanttTask[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: number, updates: Partial<Project>) => void;
  removeProject: (id: number) => void;
  addWorkPackage: (workPackage: WorkPackage) => void;
  updateWorkPackage: (id: number, updates: Partial<WorkPackage>) => void;
  removeWorkPackage: (id: number) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  selectedProjectId: null,
  workPackages: [],
  ganttTasks: [],
  isLoading: false,
  error: null,

  setProjects: (projects) => set({ projects }),
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setWorkPackages: (workPackages) => set({ workPackages }),
  setGanttTasks: (tasks) => set({ ganttTasks: tasks }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addProject: (project) => set((state) => ({
    projects: [...state.projects, project],
  })),

  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    ),
  })),

  removeProject: (id) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== id),
    selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
  })),

  addWorkPackage: (workPackage) => set((state) => ({
    workPackages: [...state.workPackages, workPackage],
  })),

  updateWorkPackage: (id, updates) => set((state) => ({
    workPackages: state.workPackages.map((wp) =>
      wp.id === id ? { ...wp, ...updates } : wp
    ),
  })),

  removeWorkPackage: (id) => set((state) => ({
    workPackages: state.workPackages.filter((wp) => wp.id !== id),
  })),
}));
