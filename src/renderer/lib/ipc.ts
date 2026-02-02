import type {
  IPCResponse,
  Workspace,
  Portfolio,
  Project,
  WorkItem,
  InboxItem,
  Todo,
  CreatePortfolioDTO,
  UpdatePortfolioDTO,
  CreateProjectDTO,
  UpdateProjectDTO,
  CreateWorkItemDTO,
  UpdateWorkItemDTO,
  CreateInboxItemDTO,
  CreateTodoDTO,
  UpdateTodoDTO,
  PortfolioSummary,
  SearchResult,
} from '@/shared/types';

declare global {
  interface Window {
    electron: {
      invoke<T = any>(channel: string, ...args: any[]): Promise<IPCResponse<T>>;
    };
  }
}

// Type-safe IPC wrapper
export const ipc = {
  // ============================================================================
  // Workspace
  // ============================================================================
  workspace: {
    get: () => window.electron.invoke<Workspace>('workspace:get'),
    update: (name: string) => window.electron.invoke<Workspace>('workspace:update', name),
  },

  // ============================================================================
  // Portfolios
  // ============================================================================
  portfolios: {
    getAll: () => window.electron.invoke<Portfolio[]>('portfolios:getAll'),
    getById: (id: number) => window.electron.invoke<Portfolio>('portfolios:getById', id),
    create: (data: CreatePortfolioDTO) => window.electron.invoke<Portfolio>('portfolios:create', data),
    update: (id: number, data: UpdatePortfolioDTO) => window.electron.invoke<Portfolio>('portfolios:update', id, data),
    delete: (id: number) => window.electron.invoke<void>('portfolios:delete', id),
    addProject: (portfolioId: number, projectId: number) => window.electron.invoke<void>('portfolios:addProject', portfolioId, projectId),
    removeProject: (portfolioId: number, projectId: number) => window.electron.invoke<void>('portfolios:removeProject', portfolioId, projectId),
  },

  // ============================================================================
  // Projects
  // ============================================================================
  projects: {
    getAll: () => window.electron.invoke<Project[]>('projects:getAll'),
    getById: (id: number) => window.electron.invoke<Project>('projects:getById', id),
    getByPortfolio: (portfolioId: number) => window.electron.invoke<Project[]>('projects:getByPortfolio', portfolioId),
    create: (data: CreateProjectDTO) => window.electron.invoke<Project>('projects:create', data),
    update: (id: number, data: UpdateProjectDTO) => window.electron.invoke<Project>('projects:update', id, data),
    delete: (id: number) => window.electron.invoke<void>('projects:delete', id),
  },

  // ============================================================================
  // Work Items
  // ============================================================================
  workItems: {
    getAll: () => window.electron.invoke<WorkItem[]>('workItems:getAll'),
    getByProject: (projectId: number) => window.electron.invoke<WorkItem[]>('workItems:getByProject', projectId),
    getByParent: (parentId: number) => window.electron.invoke<WorkItem[]>('workItems:getByParent', parentId),
    create: (data: CreateWorkItemDTO) => window.electron.invoke<WorkItem>('workItems:create', data),
    update: (id: number, data: UpdateWorkItemDTO) => window.electron.invoke<WorkItem>('workItems:update', id, data),
    delete: (id: number) => window.electron.invoke<void>('workItems:delete', id),
  },

  // ============================================================================
  // Inbox
  // ============================================================================
  inbox: {
    getAll: () => window.electron.invoke<InboxItem[]>('inbox:getAll'),
    create: (data: CreateInboxItemDTO) => window.electron.invoke<InboxItem>('inbox:create', data),
    markProcessed: (id: number) => window.electron.invoke<InboxItem>('inbox:markProcessed', id),
    delete: (id: number) => window.electron.invoke<void>('inbox:delete', id),
  },

  // ============================================================================
  // Todos
  // ============================================================================
  todos: {
    getAll: () => window.electron.invoke<Todo[]>('todos:getAll'),
    getByDate: (date: string) => window.electron.invoke<Todo[]>('todos:getByDate', date),
    create: (data: CreateTodoDTO) => window.electron.invoke<Todo>('todos:create', data),
    update: (id: number, data: UpdateTodoDTO) => window.electron.invoke<Todo>('todos:update', id, data),
    toggle: (id: number) => window.electron.invoke<Todo>('todos:toggle', id),
    delete: (id: number) => window.electron.invoke<void>('todos:delete', id),
  },

  // ============================================================================
  // Settings
  // ============================================================================
  settings: {
    get: (key: string) => window.electron.invoke<string | null>('settings:get', key),
    set: (key: string, value: string) => window.electron.invoke<void>('settings:set', key, value),
    export: () => window.electron.invoke<any>('settings:export'),
    import: (data: any) => window.electron.invoke<void>('settings:import', data),
  },

  // ============================================================================
  // Dashboard
  // ============================================================================
  dashboard: {
    getPortfolioSummary: () => window.electron.invoke<PortfolioSummary>('dashboard:getPortfolioSummary'),
  },

  // ============================================================================
  // Search
  // ============================================================================
  search: {
    global: (query: string) => window.electron.invoke<SearchResult[]>('search:global', query),
  },

  // ============================================================================
  // My Work
  // ============================================================================
  myWork: {
    // Todo List
    getTodos: (userId: string, includeArchived = false) =>
      window.electron.invoke<any[]>('mywork:getTodos', { userId, includeArchived }),
    markDone: (itemId: number, userId: string) =>
      window.electron.invoke<void>('mywork:markDone', { itemId, userId }),
    addQuickTask: (projectId: number, title: string, userId: string) =>
      window.electron.invoke<{ id: number; uuid: string }>('mywork:addQuickTask', { projectId, title, userId }),
    getStats: (userId: string) =>
      window.electron.invoke<any>('mywork:getStats', { userId }),
  },

  // ============================================================================
  // Time Logging
  // ============================================================================
  timeLog: {
    start: (workItemId: number, userId: string, logType: 'manual' | 'timer' | 'pomodoro') =>
      window.electron.invoke<{ logId: number; uuid: string }>('timelog:start', { workItemId, userId, logType }),
    stop: (logId: number, notes?: string) =>
      window.electron.invoke<{ duration: number }>('timelog:stop', { logId, notes }),
    logManual: (entry: any) =>
      window.electron.invoke<{ logId: number; uuid: string }>('timelog:logManual', entry),
    edit: (logId: number, updates: any, userId: string) =>
      window.electron.invoke<void>('timelog:edit', { logId, updates, userId }),
    getToday: (userId: string) =>
      window.electron.invoke<any[]>('timelog:getToday', { userId }),
    getWeeklySummary: (userId: string) =>
      window.electron.invoke<any[]>('timelog:getWeeklySummary', { userId }),
    getActive: (userId: string) =>
      window.electron.invoke<any>('timelog:getActive', { userId }),
  },

  // ============================================================================
  // Pomodoro
  // ============================================================================
  pomodoro: {
    start: (timeLogId: number, sessionType: 'work' | 'short_break' | 'long_break', durationMinutes: number) =>
      window.electron.invoke<{ sessionId: number; uuid: string; sessionNumber: number }>('pomodoro:start', { timeLogId, sessionType, durationMinutes }),
    complete: (sessionId: number, interrupted: boolean) =>
      window.electron.invoke<{ sessionType: string; sessionNumber: number }>('pomodoro:complete', { sessionId, interrupted }),
    getSessionCount: (timeLogId: number) =>
      window.electron.invoke<{ count: number }>('pomodoro:getSessionCount', { timeLogId }),
  },

  // ============================================================================
  // Preferences
  // ============================================================================
  preferences: {
    get: (userId: string) =>
      window.electron.invoke<any>('preferences:get', { userId }),
    update: (userId: string, updates: any) =>
      window.electron.invoke<void>('preferences:update', { userId, updates }),
  },
};
