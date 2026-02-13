import { create } from 'zustand';
import { ipc } from '@/lib/ipc';
export const useWorkspaceStore = create((set) => ({
    workspace: null,
    isLoading: false,
    error: null,
    loadWorkspace: async () => {
        set({ isLoading: true, error: null });
        try {
            const result = await ipc.workspace.get();
            if (result.success && result.data) {
                set({ workspace: result.data, isLoading: false });
            }
            else {
                set({ error: result.error || 'Failed to load workspace', isLoading: false });
            }
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
    updateWorkspaceName: async (name) => {
        set({ isLoading: true, error: null });
        try {
            const result = await ipc.workspace.update(name);
            if (result.success && result.data) {
                set({ workspace: result.data, isLoading: false });
            }
            else {
                set({ error: result.error || 'Failed to update workspace', isLoading: false });
            }
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
}));
