import { ipcMain } from 'electron';

export function registerIPCHandlers(): void {
  ipcMain.handle('projects:getAll', handleGetAllProjects);
  ipcMain.handle('projects:create', handleCreateProject);
  ipcMain.handle('workPackages:getByProject', handleGetWorkPackages);
}

function handleGetAllProjects() {
  return { success: true, data: [] };
}

function handleCreateProject(event: any, data: any) {
  return { success: true, data: { id: 1, ...data } };
}

function handleGetWorkPackages(event: any, projectId: number) {
  return { success: true, data: [] };
}
