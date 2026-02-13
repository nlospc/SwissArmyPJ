import { create } from 'zustand';
export const useUIStore = create((set) => ({
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
