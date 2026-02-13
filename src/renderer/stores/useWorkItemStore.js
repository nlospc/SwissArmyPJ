import { create } from 'zustand';
import { ipc } from '@/lib/ipc';
export const useWorkItemStore = create((set, get) => ({
    workItems: [],
    workItemsByProject: new Map(),
    isLoading: false,
    error: null,
    getWorkItemById: (id) => {
        return get().workItems.find((w) => w.id === id);
    },
    getWorkItemsByProject: (projectId) => {
        return get().workItemsByProject.get(projectId) || [];
    },
    loadAllWorkItems: async () => {
        set({ isLoading: true, error: null });
        try {
            const result = await ipc.workItems.getAll();
            if (result.success && result.data) {
                set({ workItems: result.data, isLoading: false });
            }
            else {
                set({ error: result.error || 'Failed to load work items', isLoading: false });
            }
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
    loadWorkItemsByProject: async (projectId) => {
        set({ isLoading: true, error: null });
        try {
            const result = await ipc.workItems.getByProject(projectId);
            if (result.success && result.data) {
                set((state) => {
                    const newMap = new Map(state.workItemsByProject);
                    newMap.set(projectId, result.data);
                    return {
                        workItemsByProject: newMap,
                        isLoading: false,
                    };
                });
            }
            else {
                set({ error: result.error || 'Failed to load work items', isLoading: false });
            }
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
    createWorkItem: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const result = await ipc.workItems.create(data);
            if (result.success && result.data) {
                // Reload work items for this project to get updated hierarchy
                await get().loadWorkItemsByProject(data.project_id);
                set({ isLoading: false });
            }
            else {
                set({ error: result.error || 'Failed to create work item', isLoading: false });
            }
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
    updateWorkItem: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const result = await ipc.workItems.update(id, data);
            if (result.success && result.data) {
                const projectId = result.data.project_id;
                // Reload work items for this project to get updated hierarchy
                await get().loadWorkItemsByProject(projectId);
                set({ isLoading: false });
            }
            else {
                set({ error: result.error || 'Failed to update work item', isLoading: false });
            }
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
    deleteWorkItem: async (id) => {
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
            }
            else {
                set({ error: result.error || 'Failed to delete work item', isLoading: false });
            }
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
}));
