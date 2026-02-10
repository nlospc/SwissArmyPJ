import { create } from 'zustand';
import type { Language } from '@/i18n';

export type ViewType = 'dashboard' | 'inbox' | 'portfolio' | 'projects' | 'my-work' | 'search' | 'settings';

interface UIState {
  currentView: ViewType;
  selectedProjectId: number | null;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  language: Language;

  // Actions
  setCurrentView: (view: ViewType) => void;
  setSelectedProjectId: (id: number | null) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: Language) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'dashboard',
  selectedProjectId: null,
  sidebarCollapsed: false,
  theme: 'light',
  language: 'zh',

  setCurrentView: (view) => set({ currentView: view }),
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
}));
