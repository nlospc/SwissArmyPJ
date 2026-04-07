export const isIpcBridgeAvailable = typeof window !== 'undefined' && typeof window.electron?.invoke === 'function';
const nowIso = () => new Date().toISOString();
const makeUuid = () => (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `uuid-${Math.random().toString(36).slice(2)}-${Date.now()}`);
const mockDb = {
    workspace: {
        id: 1,
        uuid: makeUuid(),
        name: 'SwissArmyPM Workspace',
        created_at: nowIso(),
        updated_at: nowIso(),
    },
    portfolios: [],
    projects: [],
    workItems: [],
    inboxItems: [],
    todos: [],
    settings: new Map(),
    ids: { portfolio: 1, project: 1, workItem: 1, inbox: 1, todo: 1 },
};
const ok = (data) => ({ success: true, data });
const fail = (error) => ({ success: false, error });
const mockInvoke = async (channel, ...args) => {
    try {
        switch (channel) {
            case 'workspace:get':
                return ok(mockDb.workspace);
            case 'workspace:update': {
                const [name] = args;
                mockDb.workspace = { ...mockDb.workspace, name, updated_at: nowIso() };
                return ok(mockDb.workspace);
            }
            case 'portfolios:getAll':
                return ok([...mockDb.portfolios]);
            case 'portfolios:getById': {
                const [id] = args;
                const item = mockDb.portfolios.find((row) => row.id === id);
                return item ? ok(item) : fail(`Portfolio ${id} not found`);
            }
            case 'portfolios:create': {
                const [data] = args;
                const item = {
                    id: mockDb.ids.portfolio++,
                    uuid: makeUuid(),
                    name: data.name,
                    description: data.description ?? null,
                    created_at: nowIso(),
                    updated_at: nowIso(),
                    projectIds: [],
                };
                mockDb.portfolios.push(item);
                return ok(item);
            }
            case 'portfolios:update': {
                const [id, data] = args;
                const index = mockDb.portfolios.findIndex((row) => row.id === id);
                if (index < 0)
                    return fail(`Portfolio ${id} not found`);
                mockDb.portfolios[index] = { ...mockDb.portfolios[index], ...data, updated_at: nowIso() };
                return ok(mockDb.portfolios[index]);
            }
            case 'portfolios:delete': {
                const [id] = args;
                mockDb.portfolios = mockDb.portfolios.filter((row) => row.id !== id);
                return ok();
            }
            case 'projects:getAll':
                return ok([...mockDb.projects]);
            case 'projects:getById': {
                const [id] = args;
                const item = mockDb.projects.find((row) => row.id === id);
                return item ? ok(item) : fail(`Project ${id} not found`);
            }
            case 'projects:getByPortfolio': {
                const [portfolioId] = args;
                return ok(mockDb.projects.filter((row) => row.portfolio_id === portfolioId));
            }
            case 'projects:create': {
                const [data] = args;
                const item = {
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
                return ok(item);
            }
            case 'projects:update': {
                const [id, data] = args;
                const index = mockDb.projects.findIndex((row) => row.id === id);
                if (index < 0)
                    return fail(`Project ${id} not found`);
                mockDb.projects[index] = {
                    ...mockDb.projects[index],
                    ...data,
                    tags_json: data.tags ? JSON.stringify(data.tags) : mockDb.projects[index].tags_json,
                    updated_at: nowIso(),
                };
                return ok(mockDb.projects[index]);
            }
            case 'projects:delete': {
                const [id] = args;
                mockDb.projects = mockDb.projects.filter((row) => row.id !== id);
                mockDb.workItems = mockDb.workItems.filter((row) => row.project_id !== id);
                return ok();
            }
            case 'workItems:getAll':
                return ok([...mockDb.workItems]);
            case 'workItems:getByProject': {
                const [projectId] = args;
                return ok(mockDb.workItems.filter((row) => row.project_id === projectId));
            }
            case 'workItems:getByParent': {
                const [parentId] = args;
                return ok(mockDb.workItems.filter((row) => row.parent_id === parentId));
            }
            case 'workItems:create': {
                const [data] = args;
                const item = {
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
                return ok(item);
            }
            case 'workItems:update': {
                const [id, data] = args;
                const index = mockDb.workItems.findIndex((row) => row.id === id);
                if (index < 0)
                    return fail(`Work item ${id} not found`);
                mockDb.workItems[index] = { ...mockDb.workItems[index], ...data, updated_at: nowIso() };
                return ok(mockDb.workItems[index]);
            }
            case 'workItems:delete': {
                const [id] = args;
                mockDb.workItems = mockDb.workItems.filter((row) => row.id !== id && row.parent_id !== id);
                return ok();
            }
            case 'inbox:getAll':
                return ok([...mockDb.inboxItems]);
            case 'inbox:create': {
                const [data] = args;
                const item = {
                    id: mockDb.ids.inbox++,
                    uuid: makeUuid(),
                    source_type: data.source_type,
                    raw_text: data.raw_text,
                    processed: 0,
                    created_at: nowIso(),
                    updated_at: nowIso(),
                };
                mockDb.inboxItems.push(item);
                return ok(item);
            }
            case 'inbox:markProcessed': {
                const [id] = args;
                const index = mockDb.inboxItems.findIndex((row) => row.id === id);
                if (index < 0)
                    return fail(`Inbox item ${id} not found`);
                mockDb.inboxItems[index] = { ...mockDb.inboxItems[index], processed: 1, updated_at: nowIso() };
                return ok(mockDb.inboxItems[index]);
            }
            case 'inbox:delete': {
                const [id] = args;
                mockDb.inboxItems = mockDb.inboxItems.filter((row) => row.id !== id);
                return ok();
            }
            case 'todos:getAll':
                return ok([...mockDb.todos]);
            case 'todos:getByDate': {
                const [date] = args;
                return ok(mockDb.todos.filter((row) => row.due_date === date));
            }
            case 'todos:create': {
                const [data] = args;
                const item = {
                    id: mockDb.ids.todo++,
                    uuid: makeUuid(),
                    text: data.text,
                    done: 0,
                    due_date: data.due_date ?? null,
                    priority: data.priority ?? 'medium',
                    created_at: nowIso(),
                };
                mockDb.todos.push(item);
                return ok(item);
            }
            case 'todos:update': {
                const [id, data] = args;
                const index = mockDb.todos.findIndex((row) => row.id === id);
                if (index < 0)
                    return fail(`Todo ${id} not found`);
                mockDb.todos[index] = {
                    ...mockDb.todos[index],
                    ...data,
                    done: typeof data.done === 'boolean' ? (data.done ? 1 : 0) : mockDb.todos[index].done,
                };
                return ok(mockDb.todos[index]);
            }
            case 'todos:toggle': {
                const [id] = args;
                const index = mockDb.todos.findIndex((row) => row.id === id);
                if (index < 0)
                    return fail(`Todo ${id} not found`);
                mockDb.todos[index] = { ...mockDb.todos[index], done: mockDb.todos[index].done ? 0 : 1 };
                return ok(mockDb.todos[index]);
            }
            case 'todos:delete': {
                const [id] = args;
                mockDb.todos = mockDb.todos.filter((row) => row.id !== id);
                return ok();
            }
            case 'settings:get': {
                const [key] = args;
                return ok(mockDb.settings.get(key) ?? null);
            }
            case 'settings:set': {
                const [key, value] = args;
                mockDb.settings.set(key, value);
                return ok();
            }
            case 'settings:export':
                return ok(Object.fromEntries(mockDb.settings.entries()));
            case 'settings:import': {
                const [data] = args;
                Object.entries(data || {}).forEach(([key, value]) => mockDb.settings.set(key, value));
                return ok();
            }
            default:
                return fail(`IPC bridge unavailable for ${channel}`);
        }
    }
    catch (error) {
        return fail(error instanceof Error ? error.message : String(error));
    }
};
const invoke = isIpcBridgeAvailable
    ? window.electron.invoke.bind(window.electron)
    : mockInvoke;
// Type-safe IPC wrapper
export const ipc = {
    // ============================================================================
    // Workspace
    // ============================================================================
    workspace: {
        get: () => invoke('workspace:get'),
        update: (name) => invoke('workspace:update', name),
    },
    // ============================================================================
    // Portfolios
    // ============================================================================
    portfolios: {
        getAll: () => invoke('portfolios:getAll'),
        getById: (id) => invoke('portfolios:getById', id),
        create: (data) => invoke('portfolios:create', data),
        update: (id, data) => invoke('portfolios:update', id, data),
        delete: (id) => invoke('portfolios:delete', id),
        addProject: (portfolioId, projectId) => invoke('portfolios:addProject', portfolioId, projectId),
        removeProject: (portfolioId, projectId) => invoke('portfolios:removeProject', portfolioId, projectId),
    },
    // ============================================================================
    // Projects
    // ============================================================================
    projects: {
        getAll: () => invoke('projects:getAll'),
        getById: (id) => invoke('projects:getById', id),
        getByPortfolio: (portfolioId) => invoke('projects:getByPortfolio', portfolioId),
        create: (data) => invoke('projects:create', data),
        update: (id, data) => invoke('projects:update', id, data),
        delete: (id) => invoke('projects:delete', id),
    },
    // ============================================================================
    // Work Items
    // ============================================================================
    workItems: {
        getAll: () => invoke('workItems:getAll'),
        getByProject: (projectId) => invoke('workItems:getByProject', projectId),
        getByParent: (parentId) => invoke('workItems:getByParent', parentId),
        create: (data) => invoke('workItems:create', data),
        update: (id, data) => invoke('workItems:update', id, data),
        delete: (id) => invoke('workItems:delete', id),
    },
    // ============================================================================
    // Inbox
    // ============================================================================
    inbox: {
        getAll: () => invoke('inbox:getAll'),
        create: (data) => invoke('inbox:create', data),
        markProcessed: (id) => invoke('inbox:markProcessed', id),
        delete: (id) => invoke('inbox:delete', id),
    },
    // ============================================================================
    // Todos
    // ============================================================================
    todos: {
        getAll: () => invoke('todos:getAll'),
        getByDate: (date) => invoke('todos:getByDate', date),
        create: (data) => invoke('todos:create', data),
        update: (id, data) => invoke('todos:update', id, data),
        toggle: (id) => invoke('todos:toggle', id),
        delete: (id) => invoke('todos:delete', id),
    },
    // ============================================================================
    // Settings
    // ============================================================================
    settings: {
        get: (key) => invoke('settings:get', key),
        set: (key, value) => invoke('settings:set', key, value),
        export: () => invoke('settings:export'),
        import: (data) => invoke('settings:import', data),
    },
    // ============================================================================
    // Dashboard
    // ============================================================================
    dashboard: {
        getPortfolioSummary: () => invoke('dashboard:getPortfolioSummary'),
    },
    // ============================================================================
    // Search
    // ============================================================================
    search: {
        global: (query) => invoke('search:global', query),
    },
    // ============================================================================
    // My Work
    // ============================================================================
    myWork: {
        // Todo List
        getTodos: (userId, includeArchived = false) => invoke('mywork:getTodos', { userId, includeArchived }),
        markDone: (itemId, userId) => invoke('mywork:markDone', { itemId, userId }),
        addQuickTask: (projectId, title, userId) => invoke('mywork:addQuickTask', { projectId, title, userId }),
        getStats: (userId) => invoke('mywork:getStats', { userId }),
    },
    // ============================================================================
    // Time Logging
    // ============================================================================
    timeLog: {
        start: (workItemId, userId, logType) => invoke('timelog:start', { workItemId, userId, logType }),
        stop: (logId, notes) => invoke('timelog:stop', { logId, notes }),
        logManual: (entry) => invoke('timelog:logManual', entry),
        edit: (logId, updates, userId) => invoke('timelog:edit', { logId, updates, userId }),
        getToday: (userId) => invoke('timelog:getToday', { userId }),
        getWeeklySummary: (userId) => invoke('timelog:getWeeklySummary', { userId }),
        getActive: (userId) => invoke('timelog:getActive', { userId }),
    },
    // ============================================================================
    // Pomodoro
    // ============================================================================
    pomodoro: {
        start: (timeLogId, sessionType, durationMinutes) => invoke('pomodoro:start', { timeLogId, sessionType, durationMinutes }),
        complete: (sessionId, interrupted) => invoke('pomodoro:complete', { sessionId, interrupted }),
        getSessionCount: (timeLogId) => invoke('pomodoro:getSessionCount', { timeLogId }),
    },
    // ============================================================================
    // Preferences
    // ============================================================================
    preferences: {
        get: (userId) => invoke('preferences:get', { userId }),
        update: (userId, updates) => invoke('preferences:update', { userId, updates }),
    },
};
