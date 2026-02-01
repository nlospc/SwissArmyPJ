import { create } from 'zustand';
import { ipc } from '@/lib/ipc';
import type { Workspace } from '@/shared/types';

interface WorkspaceState {
  workspace: Workspace | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadWorkspace: () => Promise<void>;
  updateWorkspaceName: (name: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspace: null,
  isLoading: false,
  error: null,

  loadWorkspace: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await ipc.workspace.get();
      if (result.success && result.data) {
        set({ workspace: result.data, isLoading: false });
      } else {
        set({ error: result.error || 'Failed to load workspace', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateWorkspaceName: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await ipc.workspace.update(name);
      if (result.success && result.data) {
        set({ workspace: result.data, isLoading: false });
      } else {
        set({ error: result.error || 'Failed to update workspace', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
