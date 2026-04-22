import { registerDashboardHandlers } from './dashboardHandlers';
import { registerInboxHandlers } from './inboxHandlers';
import { registerMyWorkHandlers } from './myWorkHandlers';
import { registerPortfolioHandlers } from './portfolioHandlers';
import { registerProjectHandlers } from './projectHandlers';
import { registerSearchHandlers } from './searchHandlers';
import { registerSettingsHandlers } from './settingsHandlers';
import { registerTodoHandlers } from './todoHandlers';
import { registerWorkItemHandlers } from './workItemHandlers';
import { registerWorkspaceHandlers } from './workspaceHandlers';

export function registerIPCHandlers(): void {
  // Legacy domains remain isolated at the entry level during Phase 1.
  registerMyWorkHandlers();
  registerDashboardHandlers();

  // Phase 2a: clear PM workspace domains move into dedicated retrieval units.
  registerWorkspaceHandlers();
  registerProjectHandlers();
  registerWorkItemHandlers();
  registerInboxHandlers();
  registerSettingsHandlers();
  registerTodoHandlers();
  registerSearchHandlers();

  // Legacy portfolio surface stays isolated as its own retrieval unit.
  registerPortfolioHandlers();
}