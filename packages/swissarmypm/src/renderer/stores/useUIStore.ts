import { create } from 'zustand';
import type { Language } from '@/i18n';

export type ViewType = 'projects' | 'workbench' | 'inbox' | 'search' | 'settings';

interface UIState {
  currentView: ViewType;
  selectedProjectId: number | null;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  language: Language;
  setCurrentView: (view: ViewType) => void;
  setSelectedProjectId: (id: number | null) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: Language) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'projects',
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
