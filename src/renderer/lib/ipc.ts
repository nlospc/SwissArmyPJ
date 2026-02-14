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

const invoke =

  typeof window !== 'undefined' && window.electron?.invoke

    ? window.electron.invoke.bind(window.electron)

    : (<T = any>(channel: string, ..._args: any[]): Promise<IPCResponse<T>> =>

        Promise.resolve({

          success: false,

          error: `IPC bridge unavailable for ${channel}`,

        }));



// Type-safe IPC wrapper

export const ipc = {

  // ============================================================================
  // Workspace
  // ============================================================================
  workspace: {
    get: () => invoke<Workspace>('workspace:get'),
    update: (name: string) => invoke<Workspace>('workspace:update', name),
  },

  // ============================================================================
  // Portfolios
  // ============================================================================
  portfolios: {
    getAll: () => invoke<Portfolio[]>('portfolios:getAll'),
    getById: (id: number) => invoke<Portfolio>('portfolios:getById', id),
    create: (data: CreatePortfolioDTO) => invoke<Portfolio>('portfolios:create', data),
    update: (id: number, data: UpdatePortfolioDTO) => invoke<Portfolio>('portfolios:update', id, data),
    delete: (id: number) => invoke<void>('portfolios:delete', id),
    addProject: (portfolioId: number, projectId: number) => invoke<void>('portfolios:addProject', portfolioId, projectId),
    removeProject: (portfolioId: number, projectId: number) => invoke<void>('portfolios:removeProject', portfolioId, projectId),
  },

  // ============================================================================
  // Projects
  // ============================================================================
  projects: {
    getAll: () => invoke<Project[]>('projects:getAll'),
    getById: (id: number) => invoke<Project>('projects:getById', id),
    getByPortfolio: (portfolioId: number) => invoke<Project[]>('projects:getByPortfolio', portfolioId),
    create: (data: CreateProjectDTO) => invoke<Project>('projects:create', data),
    update: (id: number, data: UpdateProjectDTO) => invoke<Project>('projects:update', id, data),
    delete: (id: number) => invoke<void>('projects:delete', id),
  },

  // ============================================================================
  // Work Items
  // ============================================================================
  workItems: {
    getAll: () => invoke<WorkItem[]>('workItems:getAll'),
    getByProject: (projectId: number) => invoke<WorkItem[]>('workItems:getByProject', projectId),
    getByParent: (parentId: number) => invoke<WorkItem[]>('workItems:getByParent', parentId),
    create: (data: CreateWorkItemDTO) => invoke<WorkItem>('workItems:create', data),
    update: (id: number, data: UpdateWorkItemDTO) => invoke<WorkItem>('workItems:update', id, data),
    delete: (id: number) => invoke<void>('workItems:delete', id),
  },

  // ============================================================================
  // Inbox
  // ============================================================================
  inbox: {
    getAll: () => invoke<InboxItem[]>('inbox:getAll'),
    create: (data: CreateInboxItemDTO) => invoke<InboxItem>('inbox:create', data),
    markProcessed: (id: number) => invoke<InboxItem>('inbox:markProcessed', id),
    delete: (id: number) => invoke<void>('inbox:delete', id),
  },

  // ============================================================================
  // Todos
  // ============================================================================
  todos: {
    getAll: () => invoke<Todo[]>('todos:getAll'),
    getByDate: (date: string) => invoke<Todo[]>('todos:getByDate', date),
    create: (data: CreateTodoDTO) => invoke<Todo>('todos:create', data),
    update: (id: number, data: UpdateTodoDTO) => invoke<Todo>('todos:update', id, data),
    toggle: (id: number) => invoke<Todo>('todos:toggle', id),
    delete: (id: number) => invoke<void>('todos:delete', id),
  },

  // ============================================================================
  // Settings
  // ============================================================================
  settings: {
    get: (key: string) => invoke<string | null>('settings:get', key),
    set: (key: string, value: string) => invoke<void>('settings:set', key, value),
    export: () => invoke<any>('settings:export'),
    import: (data: any) => invoke<void>('settings:import', data),
  },

  // ============================================================================
  // Dashboard
  // ============================================================================
  dashboard: {
    getPortfolioSummary: () => invoke<PortfolioSummary>('dashboard:getPortfolioSummary'),
  },

  // ============================================================================
  // Search
  // ============================================================================
  search: {
    global: (query: string) => invoke<SearchResult[]>('search:global', query),
  },

  // ============================================================================
  // My Work
  // ============================================================================
  myWork: {
    // Todo List
    getTodos: (userId: string, includeArchived = false) =>
      invoke<any[]>('mywork:getTodos', { userId, includeArchived }),
    markDone: (itemId: number, userId: string) =>
      invoke<void>('mywork:markDone', { itemId, userId }),
    addQuickTask: (projectId: number, title: string, userId: string) =>
      invoke<{ id: number; uuid: string }>('mywork:addQuickTask', { projectId, title, userId }),
    getStats: (userId: string) =>
      invoke<any>('mywork:getStats', { userId }),
  },

  // ============================================================================
  // Time Logging
  // ============================================================================
  timeLog: {
    start: (workItemId: number, userId: string, logType: 'manual' | 'timer' | 'pomodoro') =>
      invoke<{ logId: number; uuid: string }>('timelog:start', { workItemId, userId, logType }),
    stop: (logId: number, notes?: string) =>
      invoke<{ duration: number }>('timelog:stop', { logId, notes }),
    logManual: (entry: any) =>
      invoke<{ logId: number; uuid: string }>('timelog:logManual', entry),
    edit: (logId: number, updates: any, userId: string) =>
      invoke<void>('timelog:edit', { logId, updates, userId }),
    getToday: (userId: string) =>
      invoke<any[]>('timelog:getToday', { userId }),
    getWeeklySummary: (userId: string) =>
      invoke<any[]>('timelog:getWeeklySummary', { userId }),
    getActive: (userId: string) =>
      invoke<any>('timelog:getActive', { userId }),
  },

  // ============================================================================
  // Pomodoro
  // ============================================================================
  pomodoro: {
    start: (timeLogId: number, sessionType: 'work' | 'short_break' | 'long_break', durationMinutes: number) =>
      invoke<{ sessionId: number; uuid: string; sessionNumber: number }>('pomodoro:start', { timeLogId, sessionType, durationMinutes }),
    complete: (sessionId: number, interrupted: boolean) =>
      invoke<{ sessionType: string; sessionNumber: number }>('pomodoro:complete', { sessionId, interrupted }),
    getSessionCount: (timeLogId: number) =>
      invoke<{ count: number }>('pomodoro:getSessionCount', { timeLogId }),
  },

  // ============================================================================
  // Preferences
  // ============================================================================
  preferences: {
    get: (userId: string) =>
      invoke<any>('preferences:get', { userId }),
    update: (userId: string, updates: any) =>
      invoke<void>('preferences:update', { userId, updates }),
  },
};
