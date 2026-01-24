import { ipcMain } from 'electron';
import { projectService } from '../services/project.service';
import { workPackageService } from '../services/workpackage.service';
import { dependencyService } from '../services/dependency.service';
import { ganttService } from '../services/gantt.service';
import type { IPCChannel } from '@shared/types';

export function registerIPCHandlers(): void {
  // Project handlers
  ipcMain.handle('project:getAll', async () => {
    return projectService.getAll();
  });

  ipcMain.handle('project:getById', async (_event, id: number) => {
    return projectService.getById(id);
  });

  ipcMain.handle('project:create', async (_event, input: any) => {
    return projectService.create(input);
  });

  ipcMain.handle('project:update', async (_event, id: number, input: any) => {
    return projectService.update(id, input);
  });

  ipcMain.handle('project:delete', async (_event, id: number) => {
    return projectService.delete(id);
  });

  // Work Package handlers
  ipcMain.handle('workPackage:getAll', async () => {
    return workPackageService.getAll();
  });

  ipcMain.handle('workPackage:getByProject', async (_event, projectId: number) => {
    return workPackageService.getByProject(projectId);
  });

  ipcMain.handle('workPackage:create', async (_event, input: any) => {
    return workPackageService.create(input);
  });

  ipcMain.handle('workPackage:update', async (_event, id: number, input: any) => {
    return workPackageService.update(id, input);
  });

  ipcMain.handle('workPackage:delete', async (_event, id: number) => {
    return workPackageService.delete(id);
  });

  // Dependency handlers
  ipcMain.handle('dependency:getAll', async () => {
    return dependencyService.getAll();
  });

  ipcMain.handle('dependency:create', async (_event, input: any) => {
    return dependencyService.create(input);
  });

  ipcMain.handle('dependency:delete', async (_event, id: number) => {
    return dependencyService.delete(id);
  });

  // Gantt handlers
  ipcMain.handle('gantt:getState', async (_event, projectId: number) => {
    return ganttService.getGanttState(projectId);
  });

  ipcMain.handle('gantt:updateTaskDates', async (_event, id: number, startDate: string, endDate: string) => {
    return workPackageService.updateDates(id, startDate, endDate);
  });
}
