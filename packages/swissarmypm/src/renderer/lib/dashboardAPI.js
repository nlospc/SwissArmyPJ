// Use the preload-exposed electron API
const electronAPI = window.electron;
export const DashboardAPI = {
    async getPortfolioMetrics() {
        const result = await electronAPI.invoke('dashboard:get-metrics');
        return result;
    },
    async getProjectHealth(portfolioId) {
        const result = await electronAPI.invoke('dashboard:get-project-health', portfolioId);
        return result;
    },
    async getChangeFeed(filters) {
        const result = await electronAPI.invoke('dashboard:get-change-feed', filters);
        return result;
    },
    async getUpcomingMilestones() {
        const result = await electronAPI.invoke('dashboard:get-upcoming-milestones');
        return result;
    },
    async getRiskSummary() {
        const result = await electronAPI.invoke('dashboard:get-risk-summary');
        return result;
    },
};
