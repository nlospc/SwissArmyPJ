import { registerDashboardHandlers } from './dashboardHandlers';
import { registerCoreIPCHandlers } from './handlers';
import { registerMyWorkHandlers } from './myWorkHandlers';
import { registerProjectHandlers } from './projectHandlers';
import { registerWorkspaceHandlers } from './workspaceHandlers';

export function registerIPCHandlers(): void {
  // Legacy domains remain isolated at the entry level during Phase 1.
  registerMyWorkHandlers();
  registerDashboardHandlers();

  // Phase 2a: clear PM workspace domains move into dedicated retrieval units.
  registerWorkspaceHandlers();
  registerProjectHandlers();

  // Core/general IPC surface still lives in handlers.ts and will be split by domain in later phases.
  registerCoreIPCHandlers();
}