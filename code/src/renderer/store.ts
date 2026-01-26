import { create } from 'zustand';
import type { Project, WorkPackage, ProjectInput, WorkPackageInput, ApiResponse } from '@shared/types';

interface AppState {
  // View state
  view: string;
  setView: (view: string) => void;

  // Project state
  projects: Project[];
  selectedProjectId: number | null;
  currentProject: Project | null;
  workPackages: WorkPackage[];

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Actions - View
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setSelectedProjectId: (id: number | null) => void;
  setWorkPackages: (workPackages: WorkPackage[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Projects (Backend)
  fetchProjects: () => Promise<void>;
  createProject: (input: ProjectInput) => Promise<ApiResponse<Project>>;
  updateProject: (id: number, input: Partial<ProjectInput>) => Promise<ApiResponse<Project>>;
  deleteProject: (id: number) => Promise<ApiResponse<void>>;

  // Actions - Work Packages (Backend)
  fetchWorkPackages: (projectId: number) => Promise<void>;
  createWorkPackage: (input: WorkPackageInput) => Promise<ApiResponse<WorkPackage>>;
  updateWorkPackage: (id: number, input: Partial<WorkPackageInput>) => Promise<ApiResponse<WorkPackage>>;
  deleteWorkPackage: (id: number) => Promise<ApiResponse<void>>;

  // Local state actions
  addProject: (project: Project) => void;
  updateProjectLocal: (id: number, updates: Partial<Project>) => void;
  removeProject: (id: number) => void;
  addWorkPackage: (workPackage: WorkPackage) => void;
  updateWorkPackageLocal: (id: number, updates: Partial<WorkPackage>) => void;
  removeWorkPackage: (id: number) => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial view state
  view: 'projects',
  setView: (view) => set({ view }),

  // Initial project state
  projects: [],
  selectedProjectId: null,
  currentProject: null,
  workPackages: [],

  // Initial loading/error state
  isLoading: false,
  error: null,

  // Actions - View
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({
    currentProject: project,
    selectedProjectId: project?.id ?? null,
    workPackages: [],
  }),
  setSelectedProjectId: (id) => set((state) => {
    const currentProject = state.projects.find(p => p.id === id) ?? null;
    return {
      selectedProjectId: id,
      currentProject,
      workPackages: [],
    };
  }),
  setWorkPackages: (workPackages) => set({ workPackages }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Actions - Projects (Backend)
  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.project.getAll();
      if (response.success && response.data) {
        set({ projects: response.data });
      } else {
        set({ error: response.error || 'Failed to fetch projects' });
      }
    } catch (err) {
      set({ error: String(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.project.create(input);
      if (response.success && response.data) {
        set((state) => ({ projects: [...state.projects, response.data!] }));
      } else {
        set({ error: response.error || 'Failed to create project' });
      }
      return response;
    } catch (err) {
      const error = String(err);
      set({ error });
      return { success: false, error };
    } finally {
      set({ isLoading: false });
    }
  },

  updateProject: async (id, input) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.project.update(id, input);
      if (response.success && response.data) {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? response.data! : p)),
          currentProject: state.currentProject?.id === id ? response.data! : state.currentProject,
        }));
      } else {
        set({ error: response.error || 'Failed to update project' });
      }
      return response;
    } catch (err) {
      const error = String(err);
      set({ error });
      return { success: false, error };
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.project.delete(id);
      if (response.success) {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
          selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
          workPackages: state.currentProject?.id === id ? [] : state.workPackages,
        }));
      } else {
        set({ error: response.error || 'Failed to delete project' });
      }
      return response;
    } catch (err) {
      const error = String(err);
      set({ error });
      return { success: false, error };
    } finally {
      set({ isLoading: false });
    }
  },

  // Actions - Work Packages (Backend)
  fetchWorkPackages: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.workPackage.getByProject(projectId);
      if (response.success && response.data) {
        set({ workPackages: response.data });
      } else {
        set({ error: response.error || 'Failed to fetch work packages' });
      }
    } catch (err) {
      set({ error: String(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  createWorkPackage: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.workPackage.create(input);
      if (response.success && response.data) {
        set((state) => ({ workPackages: [...state.workPackages, response.data!] }));
      } else {
        set({ error: response.error || 'Failed to create work package' });
      }
      return response;
    } catch (err) {
      const error = String(err);
      set({ error });
      return { success: false, error };
    } finally {
      set({ isLoading: false });
    }
  },

  updateWorkPackage: async (id, input) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.workPackage.update(id, input);
      if (response.success && response.data) {
        set((state) => ({
          workPackages: state.workPackages.map((wp) => (wp.id === id ? response.data! : wp)),
        }));
      } else {
        set({ error: response.error || 'Failed to update work package' });
      }
      return response;
    } catch (err) {
      const error = String(err);
      set({ error });
      return { success: false, error };
    } finally {
      set({ isLoading: false });
    }
  },

  deleteWorkPackage: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.workPackage.delete(id);
      if (response.success) {
        set((state) => ({
          workPackages: state.workPackages.filter((wp) => wp.id !== id),
        }));
      } else {
        set({ error: response.error || 'Failed to delete work package' });
      }
      return response;
    } catch (err) {
      const error = String(err);
      set({ error });
      return { success: false, error };
    } finally {
      set({ isLoading: false });
    }
  },

  // Local state actions
  addProject: (project) => set((state) => ({
    projects: [...state.projects, project],
  })),

  updateProjectLocal: (id, updates) => set((state) => ({
    projects: state.projects.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    ),
    currentProject: state.currentProject?.id === id
      ? { ...state.currentProject, ...updates }
      : state.currentProject,
  })),

  removeProject: (id) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== id),
    selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
    currentProject: state.currentProject?.id === id ? null : state.currentProject,
  })),

  addWorkPackage: (workPackage) => set((state) => ({
    workPackages: [...state.workPackages, workPackage],
  })),

  updateWorkPackageLocal: (id, updates) => set((state) => ({
    workPackages: state.workPackages.map((wp) =>
      wp.id === id ? { ...wp, ...updates } : wp
    ),
  })),

  removeWorkPackage: (id) => set((state) => ({
    workPackages: state.workPackages.filter((wp) => wp.id !== id),
  })),
}));
