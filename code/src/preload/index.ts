import { contextBridge, ipcRenderer } from 'electron';
import type {
  Project,
  ProjectInput,
  WorkPackage,
  WorkPackageInput,
  Dependency,
  DependencyInput,
  GanttState,
  GanttView,
  GanttViewInput,
  ApiResponse,
  SchedulingMode,
  ViewScope,
} from '@shared/types';

// Type-safe IPC handler wrapper
const invokeIPC = async <T = unknown>(channel: string, ...args: unknown[]): Promise<ApiResponse<T>> => {
  return await ipcRenderer.invoke(channel, ...args) as ApiResponse<T>;
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Projects
  project: {
    getAll: () => invokeIPC<Project[]>('project:getAll'),
    getById: (id: number) => invokeIPC<Project>('project:getById', id),
    create: (input: ProjectInput) => invokeIPC<Project>('project:create', input),
    update: (id: number, input: Partial<ProjectInput>) => invokeIPC<Project>('project:update', id, input),
    delete: (id: number) => invokeIPC<void>('project:delete', id),
  },

  // Work Packages
  workPackage: {
    getAll: () => invokeIPC<WorkPackage[]>('workPackage:getAll'),
    getByProject: (projectId: number) => invokeIPC<WorkPackage[]>('workPackage:getByProject', projectId),
    create: (input: WorkPackageInput) => invokeIPC<WorkPackage>('workPackage:create', input),
    update: (id: number, input: Partial<WorkPackageInput>) => invokeIPC<WorkPackage>('workPackage:update', id, input),
    delete: (id: number) => invokeIPC<void>('workPackage:delete', id),
  },

  // Dependencies
  dependency: {
    getAll: () => invokeIPC<Dependency[]>('dependency:getAll'),
    create: (input: DependencyInput) => invokeIPC<Dependency>('dependency:create', input),
    delete: (id: number) => invokeIPC<void>('dependency:delete', id),
  },

  // Gantt
  gantt: {
    getState: (projectId: number) => invokeIPC<GanttState>('gantt:getState', projectId),
    updateTaskDates: (id: number, startDate: string, endDate: string) =>
      invokeIPC<WorkPackage>('gantt:updateTaskDates', id, startDate, endDate),
    createDependency: (input: DependencyInput) => invokeIPC<Dependency>('gantt:createDependency', input),
    updateSchedulingMode: (id: number, mode: SchedulingMode) =>
      invokeIPC<WorkPackage>('gantt:updateSchedulingMode', id, mode),
    getViews: (projectId: number | null) => invokeIPC<GanttView[]>('gantt:getViews', projectId),
    createView: (input: GanttViewInput) => invokeIPC<GanttView>('gantt:createView', input),
    updateView: (id: number, input: Partial<GanttViewInput>) => invokeIPC<GanttView>('gantt:updateView', id, input),
    deleteView: (id: number) => invokeIPC<void>('gantt:deleteView', id),
    setFavoriteView: (id: number, isFavorite: boolean) => invokeIPC<GanttView>('gantt:setFavoriteView', id, isFavorite),
  },
});

// Type declarations for the exposed API
declare global {
  interface Window {
    electronAPI: {
      project: {
        getAll: () => Promise<ApiResponse<Project[]>>;
        getById: (id: number) => Promise<ApiResponse<Project>>;
        create: (input: ProjectInput) => Promise<ApiResponse<Project>>;
        update: (id: number, input: Partial<ProjectInput>) => Promise<ApiResponse<Project>>;
        delete: (id: number) => Promise<ApiResponse<void>>;
      };
      workPackage: {
        getAll: () => Promise<ApiResponse<WorkPackage[]>>;
        getByProject: (projectId: number) => Promise<ApiResponse<WorkPackage[]>>;
        create: (input: WorkPackageInput) => Promise<ApiResponse<WorkPackage>>;
        update: (id: number, input: Partial<WorkPackageInput>) => Promise<ApiResponse<WorkPackage>>;
        delete: (id: number) => Promise<ApiResponse<void>>;
      };
      dependency: {
        getAll: () => Promise<ApiResponse<Dependency[]>>;
        create: (input: DependencyInput) => Promise<ApiResponse<Dependency>>;
        delete: (id: number) => Promise<ApiResponse<void>>;
      };
      gantt: {
        getState: (projectId: number) => Promise<ApiResponse<GanttState>>;
        updateTaskDates: (id: number, startDate: string, endDate: string) => Promise<ApiResponse<WorkPackage>>;
        createDependency: (input: DependencyInput) => Promise<ApiResponse<Dependency>>;
        updateSchedulingMode: (id: number, mode: SchedulingMode) => Promise<ApiResponse<WorkPackage>>;
        getViews: (projectId: number | null) => Promise<ApiResponse<GanttView[]>>;
        createView: (input: GanttViewInput) => Promise<ApiResponse<GanttView>>;
        updateView: (id: number, input: Partial<GanttViewInput>) => Promise<ApiResponse<GanttView>>;
        deleteView: (id: number) => Promise<ApiResponse<void>>;
        setFavoriteView: (id: number, isFavorite: boolean) => Promise<ApiResponse<GanttView>>;
      };
    };
  }
}
