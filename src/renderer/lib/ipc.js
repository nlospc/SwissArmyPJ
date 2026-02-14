const hasInvoke = typeof window !== 'undefined'
    && window.electron
    && typeof window.electron.invoke === 'function';
const invoke = hasInvoke
    ? window.electron.invoke.bind(window.electron)
    : (channel, ..._args) => Promise.resolve({
        success: false,
        error: `IPC bridge unavailable for ${channel}`,
    });

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
