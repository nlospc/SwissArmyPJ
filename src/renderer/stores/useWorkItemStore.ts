import { create } from 'zustand';
import { ipc } from '@/lib/ipc';
import type { WorkItem, CreateWorkItemDTO, UpdateWorkItemDTO } from '@/shared/types';

interface WorkItemState {
  workItems: WorkItem[];
  workItemsByProject: Map<number, WorkItem[]>;
  isLoading: boolean;
  error: string | null;

  // Selectors
  getWorkItemById: (id: number) => WorkItem | undefined;
  getWorkItemsByProject: (projectId: number) => WorkItem[];

  // Actions
  loadAllWorkItems: () => Promise<void>;
  loadWorkItemsByProject: (projectId: number) => Promise<void>;
  createWorkItem: (data: CreateWorkItemDTO) => Promise<void>;
  updateWorkItem: (id: number, data: UpdateWorkItemDTO) => Promise<void>;
  deleteWorkItem: (id: number) => Promise<void>;
}

export const useWorkItemStore = create<WorkItemState>((set, get) => ({
  workItems: [],
  workItemsByProject: new Map(),
  isLoading: false,
  error: null,

  getWorkItemById: (id: number) => {
    return get().workItems.find((w) => w.id === id);
  },

  getWorkItemsByProject: (projectId: number) => {
    return get().workItemsByProject.get(projectId) || [];
  },

  loadAllWorkItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await ipc.workItems.getAll();
      if (result.success && result.data) {
        set({ workItems: result.data, isLoading: false });
      } else {
        set({ error: result.error || 'Failed to load work items', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  loadWorkItemsByProject: async (projectId: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = await ipc.workItems.getByProject(projectId);
      if (result.success && result.data) {
        set((state) => {
          const newMap = new Map(state.workItemsByProject);
          newMap.set(projectId, result.data!);
          return {
            workItemsByProject: newMap,
            isLoading: false,
          };
        });
      } else {
        set({ error: result.error || 'Failed to load work items', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createWorkItem: async (data: CreateWorkItemDTO) => {
    set({ isLoading: true, error: null });
    try {
      const result = await ipc.workItems.create(data);
      if (result.success && result.data) {
        // Reload work items for this project to get updated hierarchy
        await get().loadWorkItemsByProject(data.project_id);
        set({ isLoading: false });
      } else {
        set({ error: result.error || 'Failed to create work item', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateWorkItem: async (id: number, data: UpdateWorkItemDTO) => {
    set({ isLoading: true, error: null });
    try {
      const result = await ipc.workItems.update(id, data);
      if (result.success && result.data) {
        const projectId = result.data.project_id;
        // Reload work items for this project to get updated hierarchy
        await get().loadWorkItemsByProject(projectId);
        set({ isLoading: false });
      } else {
        set({ error: result.error || 'Failed to update work item', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteWorkItem: async (id: number) => {
    const item = get().workItems.find((w) => w.id === id);
    set({ isLoading: true, error: null });
    try {
      const result = await ipc.workItems.delete(id);
      if (result.success) {
        if (item) {
          // Reload work items for this project
          await get().loadWorkItemsByProject(item.project_id);
        }
        set({ isLoading: false });
      } else {
        set({ error: result.error || 'Failed to delete work item', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
