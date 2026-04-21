import type {
  PortfolioMetrics,
  ProjectHealth,
  ChangeEvent,
  MilestoneInfo,
  RiskSummary,
  FeedFilter,
} from '@/stores/useDashboardStore';
import type { ElectronAPI } from '@/types/preload';

// Use the preload-exposed electron API
const electronAPI = window.electron as ElectronAPI;

export const DashboardAPI = {
  async getPortfolioMetrics(): Promise<PortfolioMetrics> {
    const result = await electronAPI.invoke('dashboard:get-metrics');
    return result as PortfolioMetrics;
  },

  async getProjectHealth(portfolioId: number | null): Promise<ProjectHealth[]> {
    const result = await electronAPI.invoke('dashboard:get-project-health', portfolioId);
    return result as ProjectHealth[];
  },

  async getChangeFeed(filters: FeedFilter): Promise<ChangeEvent[]> {
    const result = await electronAPI.invoke('dashboard:get-change-feed', filters);
    return result as ChangeEvent[];
  },

  async getUpcomingMilestones(): Promise<MilestoneInfo[]> {
    const result = await electronAPI.invoke('dashboard:get-upcoming-milestones');
    return result as MilestoneInfo[];
  },

  async getRiskSummary(): Promise<RiskSummary> {
    const result = await electronAPI.invoke('dashboard:get-risk-summary');
    return result as RiskSummary;
  },
};
