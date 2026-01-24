import { create } from 'zustand';
import type { Project } from '@shared/types';

interface AppState {
  // View state
  view: string;
  setView: (view: string) => void;

  // Project state
  projects: Project[];
  selectedProjectId: number | null;
  currentProject: Project | null;

  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setSelectedProjectId: (id: number | null) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial view state
  view: 'projects',
  setView: (view) => set({ view }),

  // Initial project state
  projects: [],
  selectedProjectId: null,
  currentProject: null,

  // Actions
  setProjects: (projects) => set({ projects }),
  
  setCurrentProject: (project) => set({ 
    currentProject: project,
    selectedProjectId: project?.id ?? null
  }),
  
  setSelectedProjectId: (id) => set((state) => {
    const currentProject = state.projects.find(p => p.id === id) ?? null;
    return { 
      selectedProjectId: id,
      currentProject
    };
  }),
}));
