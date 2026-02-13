// Type-safe IPC wrapper
export const ipc = {
    // ============================================================================
    // Workspace
    // ============================================================================
    workspace: {
        get: () => window.electron.invoke('workspace:get'),
        update: (name) => window.electron.invoke('workspace:update', name),
    },
    // ============================================================================
    // Portfolios
    // ============================================================================
    portfolios: {
        getAll: () => window.electron.invoke('portfolios:getAll'),
        getById: (id) => window.electron.invoke('portfolios:getById', id),
        create: (data) => window.electron.invoke('portfolios:create', data),
        update: (id, data) => window.electron.invoke('portfolios:update', id, data),
        delete: (id) => window.electron.invoke('portfolios:delete', id),
        addProject: (portfolioId, projectId) => window.electron.invoke('portfolios:addProject', portfolioId, projectId),
        removeProject: (portfolioId, projectId) => window.electron.invoke('portfolios:removeProject', portfolioId, projectId),
    },
    // ============================================================================
    // Projects
    // ============================================================================
    projects: {
        getAll: () => window.electron.invoke('projects:getAll'),
        getById: (id) => window.electron.invoke('projects:getById', id),
        getByPortfolio: (portfolioId) => window.electron.invoke('projects:getByPortfolio', portfolioId),
        create: (data) => window.electron.invoke('projects:create', data),
        update: (id, data) => window.electron.invoke('projects:update', id, data),
        delete: (id) => window.electron.invoke('projects:delete', id),
    },
    // ============================================================================
    // Work Items
    // ============================================================================
    workItems: {
        getAll: () => window.electron.invoke('workItems:getAll'),
        getByProject: (projectId) => window.electron.invoke('workItems:getByProject', projectId),
        getByParent: (parentId) => window.electron.invoke('workItems:getByParent', parentId),
        create: (data) => window.electron.invoke('workItems:create', data),
        update: (id, data) => window.electron.invoke('workItems:update', id, data),
        delete: (id) => window.electron.invoke('workItems:delete', id),
    },
    // ============================================================================
    // Inbox
    // ============================================================================
    inbox: {
        getAll: () => window.electron.invoke('inbox:getAll'),
        create: (data) => window.electron.invoke('inbox:create', data),
        markProcessed: (id) => window.electron.invoke('inbox:markProcessed', id),
        delete: (id) => window.electron.invoke('inbox:delete', id),
    },
    // ============================================================================
    // Todos
    // ============================================================================
    todos: {
        getAll: () => window.electron.invoke('todos:getAll'),
        getByDate: (date) => window.electron.invoke('todos:getByDate', date),
        create: (data) => window.electron.invoke('todos:create', data),
        update: (id, data) => window.electron.invoke('todos:update', id, data),
        toggle: (id) => window.electron.invoke('todos:toggle', id),
        delete: (id) => window.electron.invoke('todos:delete', id),
    },
    // ============================================================================
    // Settings
    // ============================================================================
    settings: {
        get: (key) => window.electron.invoke('settings:get', key),
        set: (key, value) => window.electron.invoke('settings:set', key, value),
        export: () => window.electron.invoke('settings:export'),
        import: (data) => window.electron.invoke('settings:import', data),
    },
    // ============================================================================
    // Dashboard
    // ============================================================================
    dashboard: {
        getPortfolioSummary: () => window.electron.invoke('dashboard:getPortfolioSummary'),
    },
    // ============================================================================
    // Search
    // ============================================================================
    search: {
        global: (query) => window.electron.invoke('search:global', query),
    },
    // ============================================================================
    // My Work
    // ============================================================================
    myWork: {
        // Todo List
        getTodos: (userId, includeArchived = false) => window.electron.invoke('mywork:getTodos', { userId, includeArchived }),
        markDone: (itemId, userId) => window.electron.invoke('mywork:markDone', { itemId, userId }),
        addQuickTask: (projectId, title, userId) => window.electron.invoke('mywork:addQuickTask', { projectId, title, userId }),
        getStats: (userId) => window.electron.invoke('mywork:getStats', { userId }),
    },
    // ============================================================================
    // Time Logging
    // ============================================================================
    timeLog: {
        start: (workItemId, userId, logType) => window.electron.invoke('timelog:start', { workItemId, userId, logType }),
        stop: (logId, notes) => window.electron.invoke('timelog:stop', { logId, notes }),
        logManual: (entry) => window.electron.invoke('timelog:logManual', entry),
        edit: (logId, updates, userId) => window.electron.invoke('timelog:edit', { logId, updates, userId }),
        getToday: (userId) => window.electron.invoke('timelog:getToday', { userId }),
        getWeeklySummary: (userId) => window.electron.invoke('timelog:getWeeklySummary', { userId }),
        getActive: (userId) => window.electron.invoke('timelog:getActive', { userId }),
    },
    // ============================================================================
    // Pomodoro
    // ============================================================================
    pomodoro: {
        start: (timeLogId, sessionType, durationMinutes) => window.electron.invoke('pomodoro:start', { timeLogId, sessionType, durationMinutes }),
        complete: (sessionId, interrupted) => window.electron.invoke('pomodoro:complete', { sessionId, interrupted }),
        getSessionCount: (timeLogId) => window.electron.invoke('pomodoro:getSessionCount', { timeLogId }),
    },
    // ============================================================================
    // Preferences
    // ============================================================================
    preferences: {
        get: (userId) => window.electron.invoke('preferences:get', { userId }),
        update: (userId, updates) => window.electron.invoke('preferences:update', { userId, updates }),
    },
};
