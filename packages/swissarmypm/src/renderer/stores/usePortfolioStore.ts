import { create } from 'zustand';
import { ipc } from '@/lib/ipc';
import type { Portfolio, CreatePortfolioDTO, UpdatePortfolioDTO } from '@/shared/types';

interface PortfolioState {
  portfolios: Portfolio[];
  selectedPortfolioId: number | null;
  isLoading: boolean;
  error: string | null;

  // Selectors
  getPortfolioById: (id: number) => Portfolio | undefined;

  // Actions
  loadPortfolios: () => Promise<void>;
  createPortfolio: (data: CreatePortfolioDTO) => Promise<void>;
  updatePortfolio: (id: number, data: UpdatePortfolioDTO) => Promise<void>;
  deletePortfolio: (id: number) => Promise<void>;
  setSelectedPortfolio: (id: number | null) => void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolios: [],
  selectedPortfolioId: null,
  isLoading: false,
  error: null,

  getPortfolioById: (id: number) => {
    return get().portfolios.find((p) => p.id === id);
  },

  loadPortfolios: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await ipc.portfolios.getAll();
      if (result.success && result.data) {
        set({ portfolios: result.data, isLoading: false });
      } else {
        set({ error: result.error || 'Failed to load portfolios', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createPortfolio: async (data: CreatePortfolioDTO) => {
    set({ isLoading: true, error: null });
    try {
      const result = await ipc.portfolios.create(data);
      if (result.success && result.data) {
        set((state) => ({
          portfolios: [result.data!, ...state.portfolios],
          isLoading: false,
        }));
      } else {
        set({ error: result.error || 'Failed to create portfolio', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updatePortfolio: async (id: number, data: UpdatePortfolioDTO) => {
    set({ isLoading: true, error: null });
    try {
      const result = await ipc.portfolios.update(id, data);
      if (result.success && result.data) {
        set((state) => ({
          portfolios: state.portfolios.map((p) => (p.id === id ? result.data! : p)),
          isLoading: false,
        }));
      } else {
        set({ error: result.error || 'Failed to update portfolio', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deletePortfolio: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = await ipc.portfolios.delete(id);
      if (result.success) {
        set((state) => ({
          portfolios: state.portfolios.filter((p) => p.id !== id),
          selectedPortfolioId: state.selectedPortfolioId === id ? null : state.selectedPortfolioId,
          isLoading: false,
        }));
      } else {
        set({ error: result.error || 'Failed to delete portfolio', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  setSelectedPortfolio: (id: number | null) => {
    set({ selectedPortfolioId: id });
  },
}));
