import { create } from 'zustand';
import { ipc } from '@/lib/ipc';
export const useProjectStore = create((set, get) => ({
    projects: [],
    isLoading: false,
    error: null,
    getProjectById: (id) => {
        return get().projects.find((p) => p.id === id);
    },
    getProjectsByPortfolio: (portfolioId) => {
        return get().projects.filter((p) => p.portfolio_id === portfolioId);
    },
    loadProjects: async () => {
        set({ isLoading: true, error: null });
        try {
            const result = await ipc.projects.getAll();
            if (result.success && result.data) {
                set({ projects: result.data, isLoading: false });
            }
            else {
                set({ error: result.error || 'Failed to load projects', isLoading: false });
            }
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
    createProject: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const result = await ipc.projects.create(data);
            if (result.success && result.data) {
                set((state) => ({
                    projects: [result.data, ...state.projects],
                    isLoading: false,
                }));
            }
            else {
                set({ error: result.error || 'Failed to create project', isLoading: false });
            }
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
    updateProject: async (id, data) => {
        // Optimistic update
        const current = get().projects.find((p) => p.id === id);
        if (current) {
            set((state) => ({
                projects: state.projects.map((p) => p.id === id ? { ...p, ...data } : p),
            }));
        }
        try {
            const result = await ipc.projects.update(id, data);
            if (result.success && result.data) {
                set((state) => ({
                    projects: state.projects.map((p) => (p.id === id ? result.data : p)),
                }));
            }
            else {
                // Rollback on error
                if (current) {
                    set((state) => ({
                        projects: state.projects.map((p) => (p.id === id ? current : p)),
                        error: result.error || 'Failed to update project',
                    }));
                }
            }
        }
        catch (error) {
            // Rollback on error
            if (current) {
                set((state) => ({
                    projects: state.projects.map((p) => (p.id === id ? current : p)),
                    error: error.message,
                }));
            }
        }
    },
    deleteProject: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const result = await ipc.projects.delete(id);
            if (result.success) {
                set((state) => ({
                    projects: state.projects.filter((p) => p.id !== id),
                    isLoading: false,
                }));
            }
            else {
                set({ error: result.error || 'Failed to delete project', isLoading: false });
            }
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
}));
