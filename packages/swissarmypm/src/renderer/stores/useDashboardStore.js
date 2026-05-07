import { create } from 'zustand';
import { DashboardAPI } from '@/lib/dashboardAPI';
import { sampleProjectHealth, sampleChangeFeed, sampleMilestones, sampleRiskSummary, } from '@/lib/sampleDashboardData';
// Flag to use sample data for development
const USE_SAMPLE_DATA = true;
export const useDashboardStore = create((set, get) => ({
    // Initial state
    portfolioMetrics: null,
    projectHealthList: [],
    changeFeed: [],
    upcomingMilestones: [],
    riskSummary: null,
    loading: false,
    error: null,
    lastRefreshed: null,
    selectedPortfolioId: null,
    feedFilters: {
        dateRange: 'week',
        eventTypes: ['created', 'updated', 'completed', 'conflict', 'sync', 'deleted'],
    },
    // Actions
    loadPortfolioMetrics: async () => {
        try {
            set({ loading: true, error: null });
            if (USE_SAMPLE_DATA) {
                // Simulate API delay
                await new Promise((resolve) => setTimeout(resolve, 500));
                const metrics = {
                    activeProjects: sampleProjectHealth.length,
                    totalTasks: sampleProjectHealth.reduce((sum, p) => sum + p.totalTasks, 0),
                    openIssues: 23,
                    upcomingMilestones: sampleMilestones.length,
                    onTrackPercentage: 68,
                    atRiskCount: 2,
                    blockedCount: 1,
                };
                set({ portfolioMetrics: metrics, loading: false });
            }
            else {
                const metrics = await DashboardAPI.getPortfolioMetrics();
                set({ portfolioMetrics: metrics, loading: false });
            }
        }
        catch (error) {
            set({ error: error.message, loading: false });
        }
    },
    loadProjectHealth: async () => {
        try {
            set({ loading: true, error: null });
            const { selectedPortfolioId } = get();
            if (USE_SAMPLE_DATA) {
                // Simulate API delay
                await new Promise((resolve) => setTimeout(resolve, 500));
                set({ projectHealthList: sampleProjectHealth, loading: false });
            }
            else {
                const healthList = await DashboardAPI.getProjectHealth(selectedPortfolioId);
                set({ projectHealthList: healthList, loading: false });
            }
        }
        catch (error) {
            set({ error: error.message, loading: false });
        }
    },
    loadChangeFeed: async () => {
        try {
            set({ loading: true, error: null });
            const { feedFilters } = get();
            if (USE_SAMPLE_DATA) {
                // Simulate API delay
                await new Promise((resolve) => setTimeout(resolve, 500));
                set({ changeFeed: sampleChangeFeed, loading: false });
            }
            else {
                const feed = await DashboardAPI.getChangeFeed(feedFilters);
                set({ changeFeed: feed, loading: false });
            }
        }
        catch (error) {
            set({ error: error.message, loading: false });
        }
    },
    loadUpcomingMilestones: async () => {
        try {
            set({ loading: true, error: null });
            if (USE_SAMPLE_DATA) {
                // Simulate API delay
                await new Promise((resolve) => setTimeout(resolve, 500));
                set({ upcomingMilestones: sampleMilestones, loading: false });
            }
            else {
                const milestones = await DashboardAPI.getUpcomingMilestones();
                set({ upcomingMilestones: milestones, loading: false });
            }
        }
        catch (error) {
            set({ error: error.message, loading: false });
        }
    },
    loadRiskSummary: async () => {
        try {
            set({ loading: true, error: null });
            if (USE_SAMPLE_DATA) {
                // Simulate API delay
                await new Promise((resolve) => setTimeout(resolve, 500));
                set({ riskSummary: sampleRiskSummary, loading: false });
            }
            else {
                const summary = await DashboardAPI.getRiskSummary();
                set({ riskSummary: summary, loading: false });
            }
        }
        catch (error) {
            set({ error: error.message, loading: false });
        }
    },
    refreshAll: async () => {
        await Promise.all([
            get().loadPortfolioMetrics(),
            get().loadProjectHealth(),
            get().loadChangeFeed(),
            get().loadUpcomingMilestones(),
            get().loadRiskSummary(),
        ]);
        set({ lastRefreshed: new Date() });
    },
    setSelectedPortfolio: (portfolioId) => {
        set({ selectedPortfolioId: portfolioId });
        get().loadProjectHealth(); // Reload health for selected portfolio
    },
    setFeedFilters: (filters) => {
        set({ feedFilters: { ...get().feedFilters, ...filters } });
        get().loadChangeFeed(); // Reload feed with new filters
    },
}));
