import { create } from 'zustand';
import type { Project, WorkPackage, Dependency, GanttTask, GanttView } from '@shared/types';

interface GanttStoreState {
  // Data
  projects: Project[];
  workPackages: WorkPackage[];
  dependencies: Dependency[];
  ganttTasks: GanttTask[];
  ganttViews: GanttView[];
  selectedViewId: number | null;

  // UI State
  selectedProjectId: number | null;
  selectedTaskId: number | null;
  timelineWindow: { from: Date; to: Date };
  selectedStatus: string | null;
  zenMode: boolean;
  expandedTaskIds: number[];

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions - Projects
  loadProjects: () => Promise<void>;
  selectProject: (projectId: number | null) => void;

  // Actions - Work Packages
  loadWorkPackages: (projectId: number) => Promise<void>;
  updateWorkPackage: (id: number, updates: Partial<WorkPackage>) => Promise<void>;
  updateTaskDates: (id: number, startDate: string, endDate: string) => Promise<void>;
  updateSchedulingMode: (id: number, mode: 'manual' | 'automatic') => Promise<void>;
  createWorkPackage: (input: any) => Promise<void>;
  deleteWorkPackage: (id: number) => Promise<void>;

  // Actions - Dependencies
  loadDependencies: () => Promise<void>;
  createDependency: (input: any) => Promise<void>;
  deleteDependency: (id: number) => Promise<void>;

  // Actions - Gantt
  loadGanttState: (projectId: number) => Promise<void>;

  // Actions - Views
  loadGanttViews: (projectId: number | null) => Promise<void>;
  createGanttView: (input: any) => Promise<void>;
  updateGanttView: (id: number, input: any) => Promise<void>;
  deleteGanttView: (id: number) => Promise<void>;
  setFavoriteView: (id: number, isFavorite: boolean) => Promise<void>;
  selectView: (viewId: number | null) => void;

  // Actions - UI
  setSelectedTaskId: (taskId: number | null) => void;
  setSelectedStatus: (status: string | null) => void;
  setTimelineWindow: (from: Date, to: Date) => void;
  panTimelineByDays: (deltaDays: number) => void;
  zoomTimeline: (factor: number, anchor?: Date) => void;
  toggleZenMode: () => void;
  toggleTaskExpanded: (taskId: number) => void;
  setTaskExpanded: (taskId: number, expanded: boolean) => void;

  // Actions - Utility
  clearError: () => void;
}

const generateGanttTasks = (
  workPackages: WorkPackage[],
  dependencies: Dependency[]
): GanttTask[] => {
  const taskMap = new Map<number, GanttTask>();

  // First pass: create all tasks
  workPackages.forEach((wp) => {
    taskMap.set(wp.id, {
      id: wp.id,
      uuid: wp.uuid,
      name: wp.name,
      start_date: wp.start_date,
      end_date: wp.end_date,
      progress: wp.progress,
      status: wp.status,
      priority: wp.priority,
      type: wp.type || 'task',
      scheduling_mode: wp.scheduling_mode || 'manual',
      parent_id: wp.parent_id,
      children: [],
      dependencies: [],
      isCritical: false,
      slack: 0,
      expanded: true,
    });
  });

  // Second pass: build hierarchy and add dependencies
  workPackages.forEach((wp) => {
    const task = taskMap.get(wp.id);
    if (!task) return;

    // Add children
    if (wp.parent_id) {
      const parent = taskMap.get(wp.parent_id);
      if (parent) {
        parent.children.push(task);
      }
    }

    // Add dependencies
    const taskDeps = dependencies.filter((d) => d.predecessor_id === wp.id || d.successor_id === wp.id);
    task.dependencies = taskDeps;
  });

  // Return only root tasks (no parent)
  return Array.from(taskMap.values()).filter((task) => task.parent_id === null);
};

export const useGanttStore = create<GanttStoreState>((set, get) => ({
  // Helpers
  // (keep date math here to avoid pulling a date library for now)
  // Note: all dates are treated as local-midnight for UI purposes.
  // Zoom/pan operates on whole days to keep interactions predictable.

  // Initial state
  projects: [],
  workPackages: [],
  dependencies: [],
  ganttTasks: [],
  selectedProjectId: null,
  selectedTaskId: null,
  timelineWindow: {
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
  selectedStatus: null,
  zenMode: false,
  expandedTaskIds: [],
  ganttViews: [],
  selectedViewId: null,
  isLoading: false,
  error: null,

  // Project actions
  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.project.getAll();
      if (response.success && response.data) {
        set({ projects: response.data });
      } else {
        set({ error: response.error || 'Failed to load projects' });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load projects' });
    } finally {
      set({ isLoading: false });
    }
  },

  selectProject: (projectId: number | null) => {
    set({ selectedProjectId: projectId });
    if (projectId) {
      get().loadWorkPackages(projectId);
      get().loadGanttState(projectId);
    } else {
      set({
        workPackages: [],
        ganttTasks: [],
        selectedTaskId: null,
      });
    }
  },

  // Work Package actions
  loadWorkPackages: async (projectId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.workPackage.getByProject(projectId);
      if (response.success && response.data) {
        set({ workPackages: response.data });
        await get().loadDependencies();
        const { dependencies } = get();
        const ganttTasks = generateGanttTasks(response.data, dependencies);
        set({ ganttTasks });
      } else {
        set({ error: response.error || 'Failed to load work packages' });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load work packages' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateWorkPackage: async (id: number, updates: Partial<WorkPackage>) => {
    set({ isLoading: true, error: null });
    try {
      // Convert null values to undefined for API
      const updateInput: Partial<import('@shared/types').WorkPackageInput> = {};
      if (updates.name !== undefined) updateInput.name = updates.name;
      if (updates.description !== undefined) updateInput.description = updates.description || undefined;
      if (updates.start_date !== undefined) updateInput.start_date = updates.start_date || undefined;
      if (updates.end_date !== undefined) updateInput.end_date = updates.end_date || undefined;
      if (updates.duration_days !== undefined) updateInput.duration_days = updates.duration_days || undefined;
      if (updates.progress !== undefined) updateInput.progress = updates.progress;
      if (updates.status !== undefined) updateInput.status = updates.status;
      if (updates.priority !== undefined) updateInput.priority = updates.priority;
      if (updates.parent_id !== undefined) updateInput.parent_id = updates.parent_id || undefined;
      if (updates.budget_planned !== undefined) updateInput.budget_planned = updates.budget_planned;

      const response = await window.electronAPI.workPackage.update(id, updateInput);
      if (response.success) {
        // Reload work packages to get updated data
        const { selectedProjectId } = get();
        if (selectedProjectId) {
          await get().loadWorkPackages(selectedProjectId);
        }
      } else {
        set({ error: response.error || 'Failed to update work package' });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update work package' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateTaskDates: async (id: number, startDate: string, endDate: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.gantt.updateTaskDates(id, startDate, endDate);
      if (response.success) {
        // Reload work packages to get updated data
        const { selectedProjectId } = get();
        if (selectedProjectId) {
          await get().loadWorkPackages(selectedProjectId);
        }
      } else {
        set({ error: response.error || 'Failed to update task dates' });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update task dates' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateSchedulingMode: async (id: number, mode: 'manual' | 'automatic') => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.gantt.updateSchedulingMode(id, mode);
      if (response.success) {
        const { selectedProjectId } = get();
        if (selectedProjectId) {
          await get().loadWorkPackages(selectedProjectId);
        }
      } else {
        set({ error: response.error || 'Failed to update scheduling mode' });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update scheduling mode' });
    } finally {
      set({ isLoading: false });
    }
  },

  createWorkPackage: async (input: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.workPackage.create(input);
      if (response.success) {
        // Reload work packages to get updated data
        const { selectedProjectId } = get();
        if (selectedProjectId) {
          await get().loadWorkPackages(selectedProjectId);
        }
      } else {
        set({ error: response.error || 'Failed to create work package' });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create work package' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteWorkPackage: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.workPackage.delete(id);
      if (response.success) {
        // Reload work packages to get updated data
        const { selectedProjectId } = get();
        if (selectedProjectId) {
          await get().loadWorkPackages(selectedProjectId);
        }
      } else {
        set({ error: response.error || 'Failed to delete work package' });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete work package' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Dependency actions
  loadDependencies: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.dependency.getAll();
      if (response.success && response.data) {
        set({ dependencies: response.data });
      } else {
        set({ error: response.error || 'Failed to load dependencies' });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load dependencies' });
    } finally {
      set({ isLoading: false });
    }
  },

  createDependency: async (input: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.dependency.create(input);
      if (response.success) {
        await get().loadDependencies();
        const { selectedProjectId } = get();
        if (selectedProjectId) {
          await get().loadWorkPackages(selectedProjectId);
        }
      } else {
        set({ error: response.error || 'Failed to create dependency' });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create dependency' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteDependency: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.dependency.delete(id);
      if (response.success) {
        await get().loadDependencies();
        const { selectedProjectId } = get();
        if (selectedProjectId) {
          await get().loadWorkPackages(selectedProjectId);
        }
      } else {
        set({ error: response.error || 'Failed to delete dependency' });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete dependency' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Gantt actions
  loadGanttState: async (projectId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.gantt.getState(projectId);
      if (response.success && response.data) {
        // Backend returns computed Gantt tasks (e.g., critical path/slack, conflicts)
        // Sync hasConflict status to workPackages for UI display
        const { workPackages } = get();
        const conflictMap = new Map<number, boolean | undefined>(
          response.data.map((gt: GanttTask) => [gt.id, gt.hasConflict])
        );

        const updatedWorkPackages = workPackages.map((wp) => ({
          ...wp,
          hasConflict: conflictMap.get(wp.id),
        }));

        set({ ganttTasks: response.data, workPackages: updatedWorkPackages });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load Gantt state' });
    } finally {
      set({ isLoading: false });
    }
  },

  // View actions
  loadGanttViews: async (projectId: number | null) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.gantt.getViews(projectId);
      if (response.success && response.data) {
        set({ ganttViews: response.data });
      } else {
        set({ error: response.error || 'Failed to load Gantt views' });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load Gantt views' });
    } finally {
      set({ isLoading: false });
    }
  },

  createGanttView: async (input: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.gantt.createView(input);
      if (response.success) {
        const { selectedProjectId } = get();
        await get().loadGanttViews(selectedProjectId);
      } else {
        set({ error: response.error || 'Failed to create Gantt view' });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create Gantt view' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateGanttView: async (id: number, input: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.gantt.updateView(id, input);
      if (response.success) {
        const { selectedProjectId } = get();
        await get().loadGanttViews(selectedProjectId);
      } else {
        set({ error: response.error || 'Failed to update Gantt view' });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update Gantt view' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteGanttView: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.gantt.deleteView(id);
      if (response.success) {
        const { selectedProjectId } = get();
        await get().loadGanttViews(selectedProjectId);
      } else {
        set({ error: response.error || 'Failed to delete Gantt view' });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete Gantt view' });
    } finally {
      set({ isLoading: false });
    }
  },

  setFavoriteView: async (id: number, isFavorite: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.gantt.setFavoriteView(id, isFavorite);
      if (response.success) {
        const { selectedProjectId } = get();
        await get().loadGanttViews(selectedProjectId);
      } else {
        set({ error: response.error || 'Failed to set favorite view' });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to set favorite view' });
    } finally {
      set({ isLoading: false });
    }
  },

  selectView: (viewId: number | null) => {
    set({ selectedViewId: viewId });
  },

  // UI actions
  setSelectedTaskId: (taskId: number | null) => {
    set({ selectedTaskId: taskId });
  },

  setSelectedStatus: (status: string | null) => {
    set({ selectedStatus: status });
  },

  setTimelineWindow: (from: Date, to: Date) => {
    // Normalize ordering and strip time component for stable math.
    const a = new Date(from);
    const b = new Date(to);
    a.setHours(0, 0, 0, 0);
    b.setHours(0, 0, 0, 0);

    const fromDate = a.getTime() <= b.getTime() ? a : b;
    const toDate = a.getTime() <= b.getTime() ? b : a;
    set({ timelineWindow: { from: fromDate, to: toDate } });
  },

  panTimelineByDays: (deltaDays: number) => {
    if (!Number.isFinite(deltaDays) || deltaDays === 0) return;
    const dayMs = 24 * 60 * 60 * 1000;
    const { from, to } = get().timelineWindow;
    const newFrom = new Date(from.getTime() + deltaDays * dayMs);
    const newTo = new Date(to.getTime() + deltaDays * dayMs);
    newFrom.setHours(0, 0, 0, 0);
    newTo.setHours(0, 0, 0, 0);
    set({ timelineWindow: { from: newFrom, to: newTo } });
  },

  zoomTimeline: (factor: number, anchor?: Date) => {
    if (!Number.isFinite(factor) || factor <= 0) return;

    const dayMs = 24 * 60 * 60 * 1000;
    const minSpanDays = 7;
    const maxSpanDays = 365 * 50; // Extended to 50 years

    const { from, to } = get().timelineWindow;
    const fromMs = from.getTime();
    const toMs = to.getTime();
    const spanMs = Math.max(dayMs, toMs - fromMs);

    const anchorMs = (anchor ? new Date(anchor) : new Date(fromMs + spanMs / 2)).getTime();
    const anchorRatio = spanMs > 0 ? (anchorMs - fromMs) / spanMs : 0.5;

    const nextSpanDays = Math.min(
      maxSpanDays,
      Math.max(minSpanDays, Math.round((spanMs / dayMs) * factor))
    );
    const nextSpanMs = nextSpanDays * dayMs;

    const nextFromMs = Math.round(anchorMs - anchorRatio * nextSpanMs);
    const nextToMs = nextFromMs + nextSpanMs;

    const nextFrom = new Date(nextFromMs);
    const nextTo = new Date(nextToMs);
    nextFrom.setHours(0, 0, 0, 0);
    nextTo.setHours(0, 0, 0, 0);

    set({ timelineWindow: { from: nextFrom, to: nextTo } });
  },

  toggleZenMode: () => {
    set((state) => ({ zenMode: !state.zenMode }));
  },

  toggleTaskExpanded: (taskId: number) => {
    set((state) => ({
      expandedTaskIds: state.expandedTaskIds.includes(taskId)
        ? state.expandedTaskIds.filter(id => id !== taskId)
        : [...state.expandedTaskIds, taskId],
    }));
  },

  setTaskExpanded: (taskId: number, expanded: boolean) => {
    set((state) => ({
      expandedTaskIds: expanded
        ? [...state.expandedTaskIds, taskId]
        : state.expandedTaskIds.filter(id => id !== taskId),
    }));
  },

  // Utility actions
  clearError: () => {
    set({ error: null });
  },
}));
