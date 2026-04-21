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

export const isIpcBridgeAvailable =
  typeof window !== 'undefined' && typeof window.electron?.invoke === 'function';

const nowIso = () => new Date().toISOString();
const makeUuid = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `uuid-${Math.random().toString(36).slice(2)}-${Date.now()}`;

const mockDb = {
  workspace: {
    id: 1,
    uuid: makeUuid(),
    name: 'SwissArmyPM Workspace',
    created_at: nowIso(),
    updated_at: nowIso(),
  } as Workspace,
  portfolios: [] as Portfolio[],
  projects: [] as Project[],
  workItems: [] as WorkItem[],
  inboxItems: [] as InboxItem[],
  todos: [] as Todo[],
  settings: new Map<string, string>(),
  ids: {
    portfolio: 1,
    project: 1,
    workItem: 1,
    inbox: 1,
    todo: 1,
  },
};

function ok<T>(data?: T): IPCResponse<T> {
  return { success: true, data };
}

function fail<T>(error: string): IPCResponse<T> {
  return { success: false, error };
}

async function mockInvoke<T = any>(channel: string, ...args: any[]): Promise<IPCResponse<T>> {
  try {
    switch (channel) {
      case 'workspace:get':
        return ok(mockDb.workspace as T);
      case 'workspace:update': {
        const [name] = args as [string];
        mockDb.workspace = { ...mockDb.workspace, name, updated_at: nowIso() };
        return ok(mockDb.workspace as T);
      }
      case 'portfolios:getAll':
        return ok([...mockDb.portfolios] as T);
      case 'portfolios:getById': {
        const [id] = args as [number];
        const portfolio = mockDb.portfolios.find((item) => item.id === id);
        return portfolio ? ok(portfolio as T) : fail(`Portfolio ${id} not found`);
      }
      case 'portfolios:create': {
        const [data] = args as [CreatePortfolioDTO];
        const item: Portfolio = {
          id: mockDb.ids.portfolio++,
          uuid: makeUuid(),
          name: data.name,
          description: data.description ?? null,
          created_at: nowIso(),
          updated_at: nowIso(),
          projectIds: [],
        };
        mockDb.portfolios.push(item);
        return ok(item as T);
      }
      case 'portfolios:update': {
        const [id, data] = args as [number, UpdatePortfolioDTO];
        const index = mockDb.portfolios.findIndex((item) => item.id === id);
        if (index < 0) return fail(`Portfolio ${id} not found`);
        const updated: Portfolio = {
          ...mockDb.portfolios[index],
          ...data,
          updated_at: nowIso(),
        };
        mockDb.portfolios[index] = updated;
        return ok(updated as T);
      }
      case 'portfolios:delete': {
        const [id] = args as [number];
        mockDb.portfolios = mockDb.portfolios.filter((item) => item.id !== id);
        return ok(undefined as T);
      }
      case 'projects:getAll':
        return ok([...mockDb.projects] as T);
      case 'projects:getById': {
        const [id] = args as [number];
        const project = mockDb.projects.find((item) => item.id === id);
        return project ? ok(project as T) : fail(`Project ${id} not found`);
      }
      case 'projects:getByPortfolio': {
        const [portfolioId] = args as [number];
        return ok(mockDb.projects.filter((item) => item.portfolio_id === portfolioId) as T);
      }
      case 'projects:create': {
        const [data] = args as [CreateProjectDTO];
        const item: Project = {
          id: mockDb.ids.project++,
          uuid: makeUuid(),
          name: data.name,
          owner: data.owner ?? null,
          status: data.status ?? 'not_started',
          start_date: data.start_date ?? null,
          end_date: data.end_date ?? null,
          portfolio_id: data.portfolio_id ?? null,
          tags_json: data.tags ? JSON.stringify(data.tags) : null,
          description: data.description ?? null,
          created_at: nowIso(),
          updated_at: nowIso(),
          tags: data.tags ?? [],
        };
        mockDb.projects.push(item);
        return ok(item as T);
      }
      case 'projects:update': {
        const [id, data] = args as [number, UpdateProjectDTO];
        const index = mockDb.projects.findIndex((item) => item.id === id);
        if (index < 0) return fail(`Project ${id} not found`);
        const updated: Project = {
          ...mockDb.projects[index],
          ...data,
          tags_json: data.tags ? JSON.stringify(data.tags) : mockDb.projects[index].tags_json,
          updated_at: nowIso(),
        };
        mockDb.projects[index] = updated;
        return ok(updated as T);
      }
      case 'projects:delete': {
        const [id] = args as [number];
        mockDb.projects = mockDb.projects.filter((item) => item.id !== id);
        mockDb.workItems = mockDb.workItems.filter((item) => item.project_id !== id);
        return ok(undefined as T);
      }
      case 'workItems:getAll':
        return ok([...mockDb.workItems] as T);
      case 'workItems:getByProject': {
        const [projectId] = args as [number];
        return ok(mockDb.workItems.filter((item) => item.project_id === projectId) as T);
      }
      case 'workItems:getByParent': {
        const [parentId] = args as [number];
        return ok(mockDb.workItems.filter((item) => item.parent_id === parentId) as T);
      }
      case 'workItems:create': {
        const [data] = args as [CreateWorkItemDTO];
        const item: WorkItem = {
          id: mockDb.ids.workItem++,
          uuid: makeUuid(),
          project_id: data.project_id,
          parent_id: data.parent_id ?? null,
          type: data.type,
          title: data.title,
          status: data.status ?? 'not_started',
          start_date: data.start_date ?? null,
          end_date: data.end_date ?? null,
          level: data.parent_id ? 2 : 1,
          notes: data.notes ?? null,
          owner: data.owner ?? null,
          priority: data.priority ?? 'medium',
          created_at: nowIso(),
          updated_at: nowIso(),
        };
        mockDb.workItems.push(item);
        return ok(item as T);
      }
      case 'workItems:update': {
        const [id, data] = args as [number, UpdateWorkItemDTO];
        const index = mockDb.workItems.findIndex((item) => item.id === id);
        if (index < 0) return fail(`Work item ${id} not found`);
        const updated: WorkItem = {
          ...mockDb.workItems[index],
          ...data,
          updated_at: nowIso(),
        };
        mockDb.workItems[index] = updated;
        return ok(updated as T);
      }
      case 'workItems:delete': {
        const [id] = args as [number];
        mockDb.workItems = mockDb.workItems.filter((item) => item.id !== id && item.parent_id !== id);
        return ok(undefined as T);
      }
      case 'inbox:getAll':
        return ok([...mockDb.inboxItems] as T);
      case 'inbox:create': {
        const [data] = args as [CreateInboxItemDTO];
        const item: InboxItem = {
          id: mockDb.ids.inbox++,
          uuid: makeUuid(),
          source_type: data.source_type,
          raw_text: data.raw_text,
          processed: 0,
          created_at: nowIso(),
          updated_at: nowIso(),
        };
        mockDb.inboxItems.push(item);
        return ok(item as T);
      }
      case 'inbox:markProcessed': {
        const [id] = args as [number];
        const index = mockDb.inboxItems.findIndex((item) => item.id === id);
        if (index < 0) return fail(`Inbox item ${id} not found`);
        mockDb.inboxItems[index] = { ...mockDb.inboxItems[index], processed: 1, updated_at: nowIso() };
        return ok(mockDb.inboxItems[index] as T);
      }
      case 'inbox:delete': {
        const [id] = args as [number];
        mockDb.inboxItems = mockDb.inboxItems.filter((item) => item.id !== id);
        return ok(undefined as T);
      }
      case 'todos:getAll':
        return ok([...mockDb.todos] as T);
      case 'todos:getByDate': {
        const [date] = args as [string];
        return ok(mockDb.todos.filter((item) => item.due_date === date) as T);
      }
      case 'todos:create': {
        const [data] = args as [CreateTodoDTO];
        const item: Todo = {
          id: mockDb.ids.todo++,
          uuid: makeUuid(),
          text: data.text,
          done: 0,
          due_date: data.due_date ?? null,
          priority: data.priority ?? 'medium',
          created_at: nowIso(),
        };
        mockDb.todos.push(item);
        return ok(item as T);
      }
      case 'todos:update': {
        const [id, data] = args as [number, UpdateTodoDTO];
        const index = mockDb.todos.findIndex((item) => item.id === id);
        if (index < 0) return fail(`Todo ${id} not found`);
        const updated: Todo = {
          ...mockDb.todos[index],
          ...data,
          done:
            typeof data.done === 'boolean'
              ? (data.done ? 1 : 0)
              : mockDb.todos[index].done,
        };
        mockDb.todos[index] = updated;
        return ok(updated as T);
      }
      case 'todos:toggle': {
        const [id] = args as [number];
        const index = mockDb.todos.findIndex((item) => item.id === id);
        if (index < 0) return fail(`Todo ${id} not found`);
        mockDb.todos[index] = {
          ...mockDb.todos[index],
          done: mockDb.todos[index].done ? 0 : 1,
        };
        return ok(mockDb.todos[index] as T);
      }
      case 'todos:delete': {
        const [id] = args as [number];
        mockDb.todos = mockDb.todos.filter((item) => item.id !== id);
        return ok(undefined as T);
      }
      case 'settings:get': {
        const [key] = args as [string];
        return ok((mockDb.settings.get(key) ?? null) as T);
      }
      case 'settings:set': {
        const [key, value] = args as [string, string];
        mockDb.settings.set(key, value);
        return ok(undefined as T);
      }
      case 'settings:export':
        return ok(Object.fromEntries(mockDb.settings.entries()) as T);
      case 'settings:import': {
        const [data] = args as [Record<string, string>];
        Object.entries(data || {}).forEach(([key, value]) => mockDb.settings.set(key, value));
        return ok(undefined as T);
      }
      default:
        return fail(`IPC bridge unavailable for ${channel}`);
    }
  } catch (error) {
    return fail((error as Error).message);
  }
}

const invoke =
  isIpcBridgeAvailable
    ? window.electron.invoke.bind(window.electron)
    : mockInvoke;



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
