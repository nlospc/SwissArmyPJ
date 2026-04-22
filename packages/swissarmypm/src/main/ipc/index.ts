import { registerDashboardHandlers } from './dashboardHandlers';
import { registerCoreIPCHandlers } from './handlers';
import { registerMyWorkHandlers } from './myWorkHandlers';

export function registerIPCHandlers(): void {
  // Legacy domains remain isolated at the entry level during Phase 1.
  registerMyWorkHandlers();
  registerDashboardHandlers();

  // Core/general IPC surface still lives in handlers.ts and will be split by domain in later phases.
  registerCoreIPCHandlers();
}