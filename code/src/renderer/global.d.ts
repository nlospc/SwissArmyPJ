import type { Project, ProjectInput, WorkPackage, WorkPackageInput, Dependency, DependencyInput, ApiResponse } from '@shared/types';

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
        getState: (projectId: number) => Promise<any>;
        updateTaskDates: (id: number, startDate: string, endDate: string) => Promise<ApiResponse<WorkPackage[]>>;
        createDependency: (input: any) => Promise<any>;
        updateSchedulingMode: (id: number, mode: 'manual' | 'automatic') => Promise<any>;
        getViews: (projectId: number | null) => Promise<any>;
        createView: (input: any) => Promise<any>;
        updateView: (id: number, input: any) => Promise<any>;
        deleteView: (id: number) => Promise<any>;
        setFavoriteView: (id: number, isFavorite: boolean) => Promise<any>;
      };
    };
  }
}

export {};
