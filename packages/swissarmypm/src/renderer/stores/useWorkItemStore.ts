import { create } from 'zustand';
import { ipc } from '@/lib/ipc';
import type { WorkItem, CreateWorkItemDTO, UpdateWorkItemDTO } from '@/shared/types';

interface WorkItemState {
  workItems: WorkItem[];
  workItemsByProject: Map<number, WorkItem[]>;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastOperation: { type: string; success: boolean; message?: string } | null;

  // Selectors
  getWorkItemById: (id: number) => WorkItem | undefined;
  getWorkItemsByProject: (projectId: number) => WorkItem[];

  // Actions
  loadAllWorkItems: () => Promise<void>;
  loadWorkItemsByProject: (projectId: number) => Promise<void>;
  createWorkItem: (data: CreateWorkItemDTO) => Promise<{ success: boolean; error?: string }>;
  updateWorkItem: (id: number, data: UpdateWorkItemDTO) => Promise<{ success: boolean; error?: string }>;
  deleteWorkItem: (id: number) => Promise<{ success: boolean; error?: string }>;
  clearLastOperation: () => void;
}

export const useWorkItemStore = create<WorkItemState>((set, get) => ({
  workItems: [],
  workItemsByProject: new Map(),
  isLoading: false,
  isSaving: false,
  error: null,
  lastOperation: null,

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
    // Generate optimistic ID (negative temp ID)
    const tempId = -(Date.now());
    const optimisticItem: WorkItem = {
      id: tempId,
      uuid: `temp-${Math.abs(tempId)}`,
      project_id: data.project_id,
      parent_id: data.parent_id || null,
      title: data.title,
      type: data.type || 'task',
      status: data.status || 'not_started',
      actual_start_date: data.actual_start_date || null,
      actual_end_date: data.actual_end_date || null,
      level: data.parent_id ? 2 : 1,
      priority: data.priority || 'medium',
      owner: data.owner || null,
      notes: data.notes || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic update
    set((state) => {
      const newMap = new Map(state.workItemsByProject);
      const current = newMap.get(data.project_id) || [];
      newMap.set(data.project_id, [...current, optimisticItem]);
      return {
        workItemsByProject: newMap,
        workItems: [...state.workItems, optimisticItem],
        isSaving: true,
      };
    });

    try {
      const result = await ipc.workItems.create(data);
      if (result.success && result.data) {
        // Replace optimistic item with real one
        set((state) => {
          const newMap = new Map(state.workItemsByProject);
          const current = newMap.get(data.project_id) || [];
          const filtered = current.filter(w => w.id !== tempId);
          newMap.set(data.project_id, [...filtered, result.data!]);
          return {
            workItemsByProject: newMap,
            workItems: state.workItems.map(w => w.id === tempId ? result.data! : w),
            isSaving: false,
            lastOperation: { type: 'create', success: true, message: 'Work item created' },
          };
        });
        return { success: true };
      } else {
        // Rollback on error
        set((state) => {
          const newMap = new Map(state.workItemsByProject);
          const current = newMap.get(data.project_id) || [];
          newMap.set(data.project_id, current.filter(w => w.id !== tempId));
          return {
            workItemsByProject: newMap,
            workItems: state.workItems.filter(w => w.id !== tempId),
            isSaving: false,
            error: result.error || 'Failed to create work item',
            lastOperation: { type: 'create', success: false, message: result.error || 'Failed to create work item' },
          };
        });
        return { success: false, error: result.error || 'Failed to create work item' };
      }
    } catch (error: any) {
      // Rollback on error
      set((state) => {
        const newMap = new Map(state.workItemsByProject);
        const current = newMap.get(data.project_id) || [];
        newMap.set(data.project_id, current.filter(w => w.id !== tempId));
        return {
          workItemsByProject: newMap,
          workItems: state.workItems.filter(w => w.id !== tempId),
          isSaving: false,
          error: error.message,
          lastOperation: { type: 'create', success: false, message: error.message },
        };
      });
      return { success: false, error: error.message };
    }
  },

  updateWorkItem: async (id: number, data: UpdateWorkItemDTO) => {
    // Store original state for rollback
    const originalItem = get().workItems.find((w) => w.id === id);
    if (!originalItem) {
      return { success: false, error: 'Work item not found' };
    }

    // Optimistic update
    const updatedItem: WorkItem = { ...originalItem, ...data, updated_at: new Date().toISOString() };

    set((state) => {
      const newMap = new Map(state.workItemsByProject);
      const projectId = originalItem.project_id;
      const current = newMap.get(projectId) || [];
      newMap.set(projectId, current.map(w => w.id === id ? updatedItem : w));
      return {
        workItemsByProject: newMap,
        workItems: state.workItems.map(w => w.id === id ? updatedItem : w),
        isSaving: true,
      };
    });

    try {
      const result = await ipc.workItems.update(id, data);
      if (result.success && result.data) {
        // Update with server response
        set((state) => {
          const newMap = new Map(state.workItemsByProject);
          const projectId = result.data!.project_id;
          const current = newMap.get(projectId) || [];
          newMap.set(projectId, current.map(w => w.id === id ? result.data! : w));
          return {
            workItemsByProject: newMap,
            workItems: state.workItems.map(w => w.id === id ? result.data! : w),
            isSaving: false,
            lastOperation: { type: 'update', success: true, message: 'Work item updated' },
          };
        });
        return { success: true };
      } else {
        // Rollback on error
        set((state) => {
          const newMap = new Map(state.workItemsByProject);
          const projectId = originalItem.project_id;
          const current = newMap.get(projectId) || [];
          newMap.set(projectId, current.map(w => w.id === id ? originalItem : w));
          return {
            workItemsByProject: newMap,
            workItems: state.workItems.map(w => w.id === id ? originalItem : w),
            isSaving: false,
            error: result.error || 'Failed to update work item',
            lastOperation: { type: 'update', success: false, message: result.error || 'Failed to update work item' },
          };
        });
        return { success: false, error: result.error || 'Failed to update work item' };
      }
    } catch (error: any) {
      // Rollback on error
      set((state) => {
        const newMap = new Map(state.workItemsByProject);
        const projectId = originalItem.project_id;
        const current = newMap.get(projectId) || [];
        newMap.set(projectId, current.map(w => w.id === id ? originalItem : w));
        return {
          workItemsByProject: newMap,
          workItems: state.workItems.map(w => w.id === id ? originalItem : w),
          isSaving: false,
          error: error.message,
          lastOperation: { type: 'update', success: false, message: error.message },
        };
      });
      return { success: false, error: error.message };
    }
  },

  deleteWorkItem: async (id: number) => {
    const item = get().workItems.find((w) => w.id === id);
    if (!item) {
      return { success: false, error: 'Work item not found' };
    }

    const projectId = item.project_id;

    // Optimistic update (remove from view)
    set((state) => {
      const newMap = new Map(state.workItemsByProject);
      const current = newMap.get(projectId) || [];
      newMap.set(projectId, current.filter(w => w.id !== id));
      return {
        workItemsByProject: newMap,
        workItems: state.workItems.filter(w => w.id !== id),
        isSaving: true,
      };
    });

    try {
      const result = await ipc.workItems.delete(id);
      if (result.success) {
        set({
          isSaving: false,
          lastOperation: { type: 'delete', success: true, message: 'Work item deleted' },
        });
        return { success: true };
      } else {
        // Rollback on error
        set((state) => {
          const newMap = new Map(state.workItemsByProject);
          const current = newMap.get(projectId) || [];
          newMap.set(projectId, [...current, item]);
          return {
            workItemsByProject: newMap,
            workItems: [...state.workItems, item],
            isSaving: false,
            error: result.error || 'Failed to delete work item',
            lastOperation: { type: 'delete', success: false, message: result.error || 'Failed to delete work item' },
          };
        });
        return { success: false, error: result.error || 'Failed to delete work item' };
      }
    } catch (error: any) {
      // Rollback on error
      set((state) => {
        const newMap = new Map(state.workItemsByProject);
        const current = newMap.get(projectId) || [];
        newMap.set(projectId, [...current, item]);
        return {
          workItemsByProject: newMap,
          workItems: [...state.workItems, item],
          isSaving: false,
          error: error.message,
          lastOperation: { type: 'delete', success: false, message: error.message },
        };
      });
      return { success: false, error: error.message };
    }
  },

  clearLastOperation: () => set({ lastOperation: null }),
}));
