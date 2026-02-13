import { create } from 'zustand';
import { ipc } from '@/lib/ipc';
export const usePortfolioStore = create((set, get) => ({
    portfolios: [],
    selectedPortfolioId: null,
    isLoading: false,
    error: null,
    getPortfolioById: (id) => {
        return get().portfolios.find((p) => p.id === id);
    },
    loadPortfolios: async () => {
        set({ isLoading: true, error: null });
        try {
            const result = await ipc.portfolios.getAll();
            if (result.success && result.data) {
                set({ portfolios: result.data, isLoading: false });
            }
            else {
                set({ error: result.error || 'Failed to load portfolios', isLoading: false });
            }
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
    createPortfolio: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const result = await ipc.portfolios.create(data);
            if (result.success && result.data) {
                set((state) => ({
                    portfolios: [result.data, ...state.portfolios],
                    isLoading: false,
                }));
            }
            else {
                set({ error: result.error || 'Failed to create portfolio', isLoading: false });
            }
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
    updatePortfolio: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const result = await ipc.portfolios.update(id, data);
            if (result.success && result.data) {
                set((state) => ({
                    portfolios: state.portfolios.map((p) => (p.id === id ? result.data : p)),
                    isLoading: false,
                }));
            }
            else {
                set({ error: result.error || 'Failed to update portfolio', isLoading: false });
            }
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
    deletePortfolio: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const result = await ipc.portfolios.delete(id);
            if (result.success) {
                set((state) => ({
                    portfolios: state.portfolios.filter((p) => p.id !== id),
                    selectedPortfolioId: state.selectedPortfolioId === id ? null : state.selectedPortfolioId,
                    isLoading: false,
                }));
            }
            else {
                set({ error: result.error || 'Failed to delete portfolio', isLoading: false });
            }
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
    setSelectedPortfolio: (id) => {
        set({ selectedPortfolioId: id });
    },
}));
