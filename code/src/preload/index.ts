import { contextBridge, ipcRenderer } from 'electron';
import type { IPCChannel } from '@shared/types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Projects
  project: {
    getAll: () => ipcRenderer.invoke('project:getAll'),
    getById: (id: number) => ipcRenderer.invoke('project:getById', id),
    create: (input: any) => ipcRenderer.invoke('project:create', input),
    update: (id: number, input: any) => ipcRenderer.invoke('project:update', id, input),
    delete: (id: number) => ipcRenderer.invoke('project:delete', id),
  },

  // Work Packages
  workPackage: {
    getAll: () => ipcRenderer.invoke('workPackage:getAll'),
    getByProject: (projectId: number) => ipcRenderer.invoke('workPackage:getByProject', projectId),
    create: (input: any) => ipcRenderer.invoke('workPackage:create', input),
    update: (id: number, input: any) => ipcRenderer.invoke('workPackage:update', id, input),
    delete: (id: number) => ipcRenderer.invoke('workPackage:delete', id),
  },

  // Dependencies
  dependency: {
    getAll: () => ipcRenderer.invoke('dependency:getAll'),
    create: (input: any) => ipcRenderer.invoke('dependency:create', input),
    delete: (id: number) => ipcRenderer.invoke('dependency:delete', id),
  },

  // Gantt
  gantt: {
    getState: (projectId: number) => ipcRenderer.invoke('gantt:getState', projectId),
    updateTaskDates: (id: number, startDate: string, endDate: string) =>
      ipcRenderer.invoke('gantt:updateTaskDates', id, startDate, endDate),
  },
});

// Type declarations for the exposed API
declare global {
  interface Window {
    electronAPI: {
      project: {
        getAll: () => Promise<any>;
        getById: (id: number) => Promise<any>;
        create: (input: any) => Promise<any>;
        update: (id: number, input: any) => Promise<any>;
        delete: (id: number) => Promise<any>;
      };
      workPackage: {
        getAll: () => Promise<any>;
        getByProject: (projectId: number) => Promise<any>;
        create: (input: any) => Promise<any>;
        update: (id: number, input: any) => Promise<any>;
        delete: (id: number) => Promise<any>;
      };
      dependency: {
        getAll: () => Promise<any>;
        create: (input: any) => Promise<any>;
        delete: (id: number) => Promise<any>;
      };
      gantt: {
        getState: (projectId: number) => Promise<any>;
        updateTaskDates: (id: number, startDate: string, endDate: string) => Promise<any>;
      };
    };
  }
}
