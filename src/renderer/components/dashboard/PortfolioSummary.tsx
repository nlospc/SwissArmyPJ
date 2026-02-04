import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Ban } from 'lucide-react';
import type { PortfolioMetrics } from '@/stores/useDashboardStore';

interface PortfolioSummaryProps {
  metrics: PortfolioMetrics | null;
  loading: boolean;
}

export function PortfolioSummary({ metrics, loading }: PortfolioSummaryProps) {
  if (loading && !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics Row */}
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Active Projects: </span>
            <span className="font-semibold">{metrics.activeProjects}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Tasks: </span>
            <span className="font-semibold">{metrics.totalTasks}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Open Issues: </span>
            <span className="font-semibold">{metrics.openIssues}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Upcoming Milestones: </span>
            <span className="font-semibold">{metrics.upcomingMilestones}</span>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-3">
          {metrics.atRiskCount > 0 && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {metrics.atRiskCount} At Risk
            </Badge>
          )}
          {metrics.blockedCount > 0 && (
            <Badge variant="destructive">
              <Ban className="h-3 w-3 mr-1" />
              {metrics.blockedCount} Blocked
            </Badge>
          )}
          {metrics.atRiskCount === 0 && metrics.blockedCount === 0 && (
            <Badge className="bg-green-600">All Projects On Track</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
