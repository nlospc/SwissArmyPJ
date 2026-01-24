import * as electron from 'electron';
import { projectService } from '../services/project.service';
import { workPackageService } from '../services/workpackage.service';
import { dependencyService } from '../services/dependency.service';
import { ganttService } from '../services/gantt.service';

export function registerIPCHandlers(): void {
  // Project handlers
  electron.ipcMain.handle('project:getAll', async () => {
    return projectService.getAll();
  });

  electron.ipcMain.handle('project:getById', async (_event, id: number) => {
    return projectService.getById(id);
  });

  electron.ipcMain.handle('project:create', async (_event, input: any) => {
    return projectService.create(input);
  });

  electron.ipcMain.handle('project:update', async (_event, id: number, input: any) => {
    return projectService.update(id, input);
  });

  electron.ipcMain.handle('project:delete', async (_event, id: number) => {
    return projectService.delete(id);
  });

  // Work Package handlers
  electron.ipcMain.handle('workPackage:getAll', async () => {
    return workPackageService.getAll();
  });

  electron.ipcMain.handle('workPackage:getByProject', async (_event, projectId: number) => {
    return workPackageService.getByProject(projectId);
  });

  electron.ipcMain.handle('workPackage:create', async (_event, input: any) => {
    return workPackageService.create(input);
  });

  electron.ipcMain.handle('workPackage:update', async (_event, id: number, input: any) => {
    return workPackageService.update(id, input);
  });

  electron.ipcMain.handle('workPackage:delete', async (_event, id: number) => {
    return workPackageService.delete(id);
  });

  // Dependency handlers
  electron.ipcMain.handle('dependency:getAll', async () => {
    return dependencyService.getAll();
  });

  electron.ipcMain.handle('dependency:create', async (_event, input: any) => {
    return dependencyService.create(input);
  });

  electron.ipcMain.handle('dependency:delete', async (_event, id: number) => {
    return dependencyService.delete(id);
  });

  // Gantt handlers
  electron.ipcMain.handle('gantt:getState', async (_event, projectId: number) => {
    return ganttService.getGanttState(projectId);
  });

  electron.ipcMain.handle('gantt:updateTaskDates', async (_event, id: number, startDate: string, endDate: string) => {
    return workPackageService.updateDates(id, startDate, endDate);
  });

  electron.ipcMain.handle('gantt:createDependency', async (_event, input: any) => {
    return dependencyService.create(input);
  });

  electron.ipcMain.handle('gantt:updateSchedulingMode', async (_event, id: number, mode: 'manual' | 'automatic') => {
    return workPackageService.update(id, { scheduling_mode: mode });
  });

  electron.ipcMain.handle('gantt:getViews', async (_event, projectId: number | null) => {
    return ganttService.getViews(projectId);
  });

  electron.ipcMain.handle('gantt:createView', async (_event, input: any) => {
    return ganttService.createView(input);
  });

  electron.ipcMain.handle('gantt:updateView', async (_event, id: number, input: any) => {
    return ganttService.updateView(id, input);
  });

  electron.ipcMain.handle('gantt:deleteView', async (_event, id: number) => {
    return ganttService.deleteView(id);
  });

  electron.ipcMain.handle('gantt:setFavoriteView', async (_event, id: number, isFavorite: boolean) => {
    return ganttService.setFavoriteView(id, isFavorite);
  });
}
