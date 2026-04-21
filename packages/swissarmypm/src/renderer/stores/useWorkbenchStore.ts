import { create } from 'zustand';

import type { WorkbenchModuleKey } from '@/shared/types/workbench';

interface WorkbenchState {
  activeModule: WorkbenchModuleKey;
  setActiveModule: (module: WorkbenchModuleKey) => void;
  reset: () => void;
}

export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  activeModule: 'canvas',
  setActiveModule: (module) => set({ activeModule: module }),
  reset: () => set({ activeModule: 'canvas' }),
}));
