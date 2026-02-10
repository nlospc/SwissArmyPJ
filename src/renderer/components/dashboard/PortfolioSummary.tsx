import React from 'react';
import { Card, Tag } from 'antd';
import { AlertTriangle, Ban } from 'lucide-react';
import type { PortfolioMetrics } from '@/stores/useDashboardStore';

interface PortfolioSummaryProps {
  metrics: PortfolioMetrics | null;
  loading: boolean;
}

export function PortfolioSummary({ metrics, loading }: PortfolioSummaryProps) {
  if (loading && !metrics) {
    return (
      <Card title="Portfolio Summary">
        <div className="h-20 animate-pulse bg-theme-layout rounded" />
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <Card title="Portfolio Summary">
      <div className="space-y-4">
        {/* Metrics Row */}
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-theme-secondary">Active Projects: </span>
            <span className="font-semibold">{metrics.activeProjects}</span>
          </div>
          <div>
            <span className="text-theme-secondary">Total Tasks: </span>
            <span className="font-semibold">{metrics.totalTasks}</span>
          </div>
          <div>
            <span className="text-theme-secondary">Open Issues: </span>
            <span className="font-semibold">{metrics.openIssues}</span>
          </div>
          <div>
            <span className="text-theme-secondary">Upcoming Milestones: </span>
            <span className="font-semibold">{metrics.upcomingMilestones}</span>
          </div>
        </div>

        {/* Status Tags */}
        <div className="flex items-center gap-3">
          {metrics.atRiskCount > 0 && (
            <Tag color="orange">
              <AlertTriangle className="h-3 w-3" style={{ marginRight: 4, display: 'inline' }} />
              {metrics.atRiskCount} At Risk
            </Tag>
          )}
          {metrics.blockedCount > 0 && (
            <Tag color="red">
              <Ban className="h-3 w-3" style={{ marginRight: 4, display: 'inline' }} />
              {metrics.blockedCount} Blocked
            </Tag>
          )}
          {metrics.atRiskCount === 0 && metrics.blockedCount === 0 && (
            <Tag color="green">All Projects On Track</Tag>
          )}
        </div>
      </div>
    </Card>
  );
}
