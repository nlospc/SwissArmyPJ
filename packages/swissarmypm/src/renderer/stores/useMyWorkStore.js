/**

 * My Work Zustand Store

 *

 * Manages state for:

 * - Todo list (with grouping/sorting/filtering)

 * - Time logging (manual, timer, Pomodoro)

 * - Pomodoro timer countdown

 * - User preferences

 * - Quick stats

 *

 * Features:

 * - Optimistic updates (update UI immediately, rollback on error)

 * - Caching with staleness checks

 * - Desktop notification integration

 * - Pomodoro countdown with setInterval

 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { useEffect } from 'react';
import { ipc } from '@/lib/ipc';
// Enable Immer's MapSet plugin to support Map and Set objects in state
enableMapSet();
// =============================================================================
// POMODORO INTERVAL MANAGEMENT
// =============================================================================
let pomodoroIntervalId = null;
function startPomodoroInterval(store) {
    if (pomodoroIntervalId) {
        clearInterval(pomodoroIntervalId);
    }
    pomodoroIntervalId = window.setInterval(() => {
        store.getState()._tickPomodoro();
    }, 1000); // Tick every second
}
function stopPomodoroInterval() {
    if (pomodoroIntervalId) {
        clearInterval(pomodoroIntervalId);
        pomodoroIntervalId = null;
    }
}
// =============================================================================
// DESKTOP NOTIFICATIONS
// =============================================================================
function showNotification(title, body, actions) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body,
            icon: '/icon.png',
            tag: 'my-work',
            requireInteraction: false,
        });
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
        return notification;
    }
}
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}
// =============================================================================
// ZUSTAND STORE
// =============================================================================
export const useMyWorkStore = create()(immer((set, get) => ({
    // Initial State
    userId: 'default-user', // TODO: Get from auth system
    todos: new Map(),
    todosLastFetch: null,
    activeLogs: new Map(),
    todayLogs: [],
    weeklyLogs: null,
    activePomodoro: null,
    stats: null,
    preferences: null,
    groupBy: 'project',
    sortBy: 'due_date',
    filterStatus: 'all',
    loading: false,
    error: null,
    // =========================================================================
    // TODO LIST ACTIONS
    // =========================================================================
    setUserId: (userId) => {
        set({ userId });
    },
    fetchTodos: async (force = false) => {
        const { userId, todosLastFetch } = get();
        // Cache for 30 seconds
        const CACHE_TTL = 30 * 1000;
        if (!force && todosLastFetch && Date.now() - todosLastFetch < CACHE_TTL) {
            console.log('[MyWork] Using cached todos');
            return;
        }
        set({ loading: true, error: null });
        try {
            const result = await ipc.myWork.getTodos(userId, false);
            if (result.success) {
                set((state) => {
                    state.todos = new Map(result.data.map((t) => [t.uuid, t]));
                    state.todosLastFetch = Date.now();
                    state.loading = false;
                });
            }
            else {
                set({ error: result.error, loading: false });
            }
        }
        catch (error) {
            set({ error: error.message, loading: false });
        }
    },
    updateGrouping: (groupBy) => {
        set({ groupBy });
    },
    updateSorting: (sortBy) => {
        set({ sortBy });
    },
    updateFilter: (filterStatus) => {
        set({ filterStatus });
    },
    markDone: async (todoId) => {
        const { userId, todos } = get();
        // Find todo by id (not uuid)
        const todo = Array.from(todos.values()).find((t) => t.id === todoId);
        if (!todo) {
            set({ error: 'Todo not found' });
            return;
        }
        // Optimistic update
        const previousTodo = { ...todo };
        set((state) => {
            const updated = { ...todo, status: 'done', completedAt: new Date().toISOString() };
            state.todos.set(todo.uuid, updated);
        });
        try {
            const result = await ipc.myWork.markDone(todoId, userId);
            if (!result.success) {
                // Rollback on error
                set((state) => {
                    state.todos.set(todo.uuid, previousTodo);
                    state.error = result.error;
                });
            }
            else {
                // Refresh stats after successful update
                get().fetchStats();
            }
        }
        catch (error) {
            // Rollback on error
            set((state) => {
                state.todos.set(todo.uuid, previousTodo);
                state.error = error.message;
            });
        }
    },
    addQuickTask: async (projectId, title) => {
        const { userId } = get();
        try {
            const result = await ipc.myWork.addQuickTask(projectId, title, userId);
            if (result.success) {
                // Refresh todos to include new task
                await get().fetchTodos(true);
            }
            else {
                set({ error: result.error });
            }
        }
        catch (error) {
            set({ error: error.message });
        }
    },
    // =========================================================================
    // TIME LOGGING ACTIONS
    // =========================================================================
    startTimer: async (workItemId, usePomodoro) => {
        const { userId } = get();
        try {
            // Check if there's already an active timer
            const activeResult = await ipc.timeLog.getActive(userId);
            if (activeResult.success && activeResult.data) {
                set({ error: 'You already have an active timer. Please stop it first.' });
                return;
            }
            if (usePomodoro) {
                await get().startPomodoro(workItemId);
            }
            else {
                const result = await ipc.timeLog.start(workItemId, userId, 'timer');
                if (result.success) {
                    set((state) => {
                        const todo = Array.from(state.todos.values()).find((t) => t.id === workItemId);
                        state.activeLogs.set(result.data.logId, {
                            id: result.data.logId,
                            uuid: result.data.uuid,
                            workItemId,
                            itemName: todo?.name || 'Unknown',
                            projectName: todo?.projectName || '',
                            userId,
                            startTime: new Date().toISOString(),
                            endTime: null,
                            durationMinutes: null,
                            logType: 'timer',
                            pomodoroCount: 0,
                            notes: null,
                            editCount: 0,
                            editedAt: null,
                        });
                    });
                }
                else {
                    set({ error: result.error });
                }
            }
        }
        catch (error) {
            set({ error: error.message });
        }
    },
    stopTimer: async (timeLogId, notes) => {
        try {
            const result = await ipc.timeLog.stop(timeLogId, notes);
            if (result.success) {
                set((state) => {
                    state.activeLogs.delete(timeLogId);
                });
                // Refresh today's logs and stats
                await get().fetchTodayLogs();
                await get().fetchStats();
            }
            else {
                set({ error: result.error });
            }
        }
        catch (error) {
            set({ error: error.message });
        }
    },
    logManualTime: async (entry) => {
        try {
            const result = await ipc.timeLog.logManual(entry);
            if (result.success) {
                // Refresh today's logs and stats
                await get().fetchTodayLogs();
                await get().fetchStats();
            }
            else {
                set({ error: result.error });
            }
        }
        catch (error) {
            set({ error: error.message });
        }
    },
    editTimeLog: async (logId, updates) => {
        const { userId } = get();
        try {
            const result = await ipc.timeLog.edit(logId, {
                startTime: updates.startTime,
                endTime: updates.endTime,
                notes: updates.notes,
            }, userId);
            if (result.success) {
                // Refresh today's logs
                await get().fetchTodayLogs();
            }
            else {
                set({ error: result.error });
            }
        }
        catch (error) {
            set({ error: error.message });
        }
    },
    fetchTodayLogs: async () => {
        const { userId } = get();
        try {
            const result = await ipc.timeLog.getToday(userId);
            if (result.success) {
                set({ todayLogs: result.data });
            }
            else {
                set({ error: result.error });
            }
        }
        catch (error) {
            set({ error: error.message });
        }
    },
    fetchWeeklySummary: async () => {
        const { userId, preferences } = get();
        try {
            const result = await ipc.timeLog.getWeeklySummary(userId);
            if (result.success) {
                const weeklyActual = result.data.reduce((sum, day) => sum + day.totalMinutes, 0);
                const weeklyTarget = (preferences?.dailyTimeTarget || 480) * 7;
                set({
                    weeklyLogs: {
                        days: result.data,
                        weeklyTarget,
                        weeklyActual,
                    },
                });
            }
            else {
                set({ error: result.error });
            }
        }
        catch (error) {
            set({ error: error.message });
        }
    },
    getActiveTimer: async () => {
        const { userId } = get();
        try {
            const result = await ipc.timeLog.getActive(userId);
            if (result.success && result.data) {
                set((state) => {
                    state.activeLogs.set(result.data.id, {
                        ...result.data,
                        editCount: 0,
                        editedAt: null,
                    });
                });
            }
        }
        catch (error) {
            console.error('Failed to get active timer:', error);
        }
    },
    // =========================================================================
    // POMODORO ACTIONS
    // =========================================================================
    startPomodoro: async (workItemId) => {
        const { userId, preferences } = get();
        try {
            // First create time log
            const logResult = await ipc.timeLog.start(workItemId, userId, 'pomodoro');
            if (!logResult.success) {
                set({ error: logResult.error });
                return;
            }
            const timeLogId = logResult.data.logId;
            // Then create pomodoro session
            const workDuration = preferences?.pomodoroWorkDuration || 25;
            const sessionResult = await ipc.pomodoro.start(timeLogId, 'work', workDuration);
            if (sessionResult.success) {
                const todo = Array.from(get().todos.values()).find((t) => t.id === workItemId);
                set({
                    activePomodoro: {
                        id: sessionResult.data.sessionId,
                        uuid: sessionResult.data.uuid,
                        timeLogId,
                        itemId: workItemId,
                        itemName: todo?.name || 'Unknown',
                        sessionNumber: sessionResult.data.sessionNumber,
                        sessionType: 'work',
                        durationMinutes: workDuration,
                        remainingSeconds: workDuration * 60,
                        startedAt: new Date(),
                        isPaused: false,
                    },
                });
                // Start countdown interval
                startPomodoroInterval(useMyWorkStore);
                // Request notification permission if needed
                requestNotificationPermission();
            }
            else {
                set({ error: sessionResult.error });
            }
        }
        catch (error) {
            set({ error: error.message });
        }
    },
    pausePomodoro: () => {
        set((state) => {
            if (state.activePomodoro) {
                state.activePomodoro.isPaused = true;
            }
        });
    },
    resumePomodoro: () => {
        set((state) => {
            if (state.activePomodoro) {
                state.activePomodoro.isPaused = false;
            }
        });
    },
    stopPomodoro: async () => {
        const { activePomodoro } = get();
        if (!activePomodoro)
            return;
        try {
            // Mark session as interrupted
            await ipc.pomodoro.complete(activePomodoro.id, true);
            // Stop time log
            await ipc.timeLog.stop(activePomodoro.timeLogId);
            set({ activePomodoro: null });
            stopPomodoroInterval();
            // Refresh logs
            await get().fetchTodayLogs();
            await get().fetchStats();
        }
        catch (error) {
            set({ error: error.message });
        }
    },
    skipBreak: async () => {
        const { activePomodoro, preferences } = get();
        if (!activePomodoro || activePomodoro.sessionType === 'work')
            return;
        try {
            // Mark break as interrupted
            await ipc.pomodoro.complete(activePomodoro.id, true);
            // Start new work session
            const workDuration = preferences?.pomodoroWorkDuration || 25;
            const sessionResult = await ipc.pomodoro.start(activePomodoro.timeLogId, 'work', workDuration);
            if (sessionResult.success) {
                set((state) => {
                    if (state.activePomodoro) {
                        state.activePomodoro.id = sessionResult.data.sessionId;
                        state.activePomodoro.uuid = sessionResult.data.uuid;
                        state.activePomodoro.sessionNumber = sessionResult.data.sessionNumber;
                        state.activePomodoro.sessionType = 'work';
                        state.activePomodoro.durationMinutes = workDuration;
                        state.activePomodoro.remainingSeconds = workDuration * 60;
                        state.activePomodoro.isPaused = false;
                    }
                });
            }
        }
        catch (error) {
            set({ error: error.message });
        }
    },
    _tickPomodoro: () => {
        set((state) => {
            if (state.activePomodoro && !state.activePomodoro.isPaused) {
                state.activePomodoro.remainingSeconds -= 1;
                // Timer expired
                if (state.activePomodoro.remainingSeconds <= 0) {
                    // Handle completion in next tick to avoid state mutation issues
                    setTimeout(() => {
                        handlePomodoroComplete(useMyWorkStore);
                    }, 0);
                }
            }
        });
    },
    // =========================================================================
    // PREFERENCES ACTIONS
    // =========================================================================
    fetchPreferences: async () => {
        const { userId } = get();
        try {
            const result = await ipc.preferences.get(userId);
            if (result.success) {
                set({ preferences: result.data });
                // Apply default grouping/sorting from preferences
                if (result.data.defaultGroupBy) {
                    set({ groupBy: result.data.defaultGroupBy });
                }
                if (result.data.defaultSortBy) {
                    set({ sortBy: result.data.defaultSortBy });
                }
            }
            else {
                set({ error: result.error });
            }
        }
        catch (error) {
            set({ error: error.message });
        }
    },
    updatePreferences: async (updates) => {
        const { userId, preferences } = get();
        // Optimistic update
        const previousPrefs = { ...preferences };
        set((state) => {
            if (state.preferences) {
                state.preferences = { ...state.preferences, ...updates };
            }
        });
        try {
            const result = await ipc.preferences.update(userId, updates);
            if (!result.success) {
                // Rollback on error
                set({ preferences: previousPrefs, error: result.error });
            }
        }
        catch (error) {
            // Rollback on error
            set({ preferences: previousPrefs, error: error.message });
        }
    },
    // =========================================================================
    // STATS ACTIONS
    // =========================================================================
    fetchStats: async () => {
        const { userId } = get();
        try {
            const result = await ipc.myWork.getStats(userId);
            if (result.success) {
                set({ stats: result.data });
            }
            else {
                set({ error: result.error });
            }
        }
        catch (error) {
            set({ error: error.message });
        }
    },
    // =========================================================================
    // UTILITY ACTIONS
    // =========================================================================
    clearError: () => {
        set({ error: null });
    },
    reset: () => {
        stopPomodoroInterval();
        set({
            todos: new Map(),
            todosLastFetch: null,
            activeLogs: new Map(),
            todayLogs: [],
            weeklyLogs: null,
            activePomodoro: null,
            stats: null,
            groupBy: 'project',
            sortBy: 'due_date',
            filterStatus: 'all',
            loading: false,
            error: null,
        });
    },
})));
// =============================================================================
// POMODORO COMPLETION HANDLER
// =============================================================================
async function handlePomodoroComplete(store) {
    const { activePomodoro, preferences } = store.getState();
    if (!activePomodoro)
        return;
    try {
        // Mark session complete
        await ipc.pomodoro.complete(activePomodoro.id, false);
        // Determine next session type
        const sessionsBeforeLong = preferences?.pomodoroSessionsBeforeLong || 4;
        const isLongBreak = activePomodoro.sessionNumber % sessionsBeforeLong === 0;
        if (activePomodoro.sessionType === 'work') {
            // Work session complete - show notification and transition to break
            showNotification('Pomodoro Complete! 🍅', 'Great work! Time for a break.');
            const breakType = isLongBreak ? 'long_break' : 'short_break';
            const breakDuration = isLongBreak
                ? (preferences?.pomodoroLongBreak || 15)
                : (preferences?.pomodoroShortBreak || 5);
            // Check if auto-start breaks is enabled
            const autoStartBreaks = preferences?.autoStartBreaks || false;
            if (autoStartBreaks) {
                // Auto-start break
                const sessionResult = await ipc.pomodoro.start(activePomodoro.timeLogId, breakType, breakDuration);
                if (sessionResult.success) {
                    store.setState((state) => {
                        if (state.activePomodoro) {
                            state.activePomodoro.id = sessionResult.data.sessionId;
                            state.activePomodoro.uuid = sessionResult.data.uuid;
                            state.activePomodoro.sessionNumber = sessionResult.data.sessionNumber;
                            state.activePomodoro.sessionType = breakType;
                            state.activePomodoro.durationMinutes = breakDuration;
                            state.activePomodoro.remainingSeconds = breakDuration * 60;
                            state.activePomodoro.isPaused = false;
                        }
                    });
                }
            }
            else {
                // Stop timer and clear active Pomodoro
                await ipc.timeLog.stop(activePomodoro.timeLogId);
                store.setState({ activePomodoro: null });
                stopPomodoroInterval();
            }
        }
        else {
            // Break complete - show notification
            showNotification('Break Over!', 'Ready to start your next work session?');
            // Stop timer and clear active Pomodoro
            await ipc.timeLog.stop(activePomodoro.timeLogId);
            store.setState({ activePomodoro: null });
            stopPomodoroInterval();
        }
        // Refresh logs and stats
        await store.getState().fetchTodayLogs();
        await store.getState().fetchStats();
    }
    catch (error) {
        console.error('Failed to handle Pomodoro completion:', error);
        store.setState({ error: error.message });
    }
}
// =============================================================================
// INITIALIZATION HOOK
// =============================================================================
/**
 * Initialize My Work store on mount
 * Fetches todos, preferences, stats, and today's logs
 */
export function useMyWorkInit() {
    const fetchTodos = useMyWorkStore((state) => state.fetchTodos);
    const fetchPreferences = useMyWorkStore((state) => state.fetchPreferences);
    const fetchStats = useMyWorkStore((state) => state.fetchStats);
    const fetchTodayLogs = useMyWorkStore((state) => state.fetchTodayLogs);
    const fetchWeeklySummary = useMyWorkStore((state) => state.fetchWeeklySummary);
    const getActiveTimer = useMyWorkStore((state) => state.getActiveTimer);
    // Initialize on mount
    useEffect(() => {
        const init = async () => {
            await fetchPreferences();
            await Promise.all([
                fetchTodos(),
                fetchStats(),
                fetchTodayLogs(),
                fetchWeeklySummary(),
                getActiveTimer(),
            ]);
        };
        init();
        // Request notification permission
        requestNotificationPermission();
        // Cleanup on unmount
        return () => {
            stopPomodoroInterval();
        };
    }, []);
}
