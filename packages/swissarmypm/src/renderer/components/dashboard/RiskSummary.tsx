import React from 'react';
import { Card, Tag } from 'antd';
import { AlertTriangle } from 'lucide-react';
import type { RiskSummary } from '@/stores/useDashboardStore';

interface RiskSummaryProps {
  summary: RiskSummary | null;
  loading: boolean;
}

export function RiskSummary({ summary, loading }: RiskSummaryProps) {
  if (loading) {
    return (
      <Card title={<span className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4" /> Risk Summary</span>}>
        <div className="h-16 animate-pulse bg-gray-100 dark:bg-gray-700 rounded" />
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const totalRisks = summary.critical + summary.high + summary.medium + summary.low;

  if (totalRisks === 0) {
    return (
      <Card title={<span className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4" /> Risk Summary</span>}>
        <div className="text-center py-4">
          <div className="text-green-600 dark:text-green-400 font-semibold text-sm mb-1">No Active Risks</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">All issues are under control</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title={<span className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4" /> Risk Summary</span>}>
      <div className="space-y-3">
        {/* Visual bar */}
        <div className="flex h-5 w-full overflow-hidden rounded-md">
          {summary.critical > 0 && (
            <div
              className="bg-red-600 flex items-center justify-center text-xs text-white font-medium"
              style={{ width: `${(summary.critical / totalRisks) * 100}%` }}
            >
              {summary.critical}
            </div>
          )}
          {summary.high > 0 && (
            <div
              className="bg-orange-500 flex items-center justify-center text-xs text-white font-medium"
              style={{ width: `${(summary.high / totalRisks) * 100}%` }}
            >
              {summary.high}
            </div>
          )}
          {summary.medium > 0 && (
            <div
              className="bg-yellow-500 flex items-center justify-center text-xs text-white font-medium"
              style={{ width: `${(summary.medium / totalRisks) * 100}%` }}
            >
              {summary.medium}
            </div>
          )}
          {summary.low > 0 && (
            <div
              className="bg-green-500 flex items-center justify-center text-xs text-white font-medium"
              style={{ width: `${(summary.low / totalRisks) * 100}%` }}
            >
              {summary.low}
            </div>
          )}
        </div>

        {/* Risk tags */}
        <div className="grid grid-cols-2 gap-2">
          {summary.critical > 0 && (
            <div className="flex items-center justify-between p-2 rounded bg-red-50 border border-red-200">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-red-600 rounded-full" />
                <span className="text-xs font-medium">Critical</span>
              </div>
              <Tag color="red" className="text-xs">{summary.critical}</Tag>
            </div>
          )}

          {summary.high > 0 && (
            <div className="flex items-center justify-between p-2 rounded bg-orange-50 border border-orange-200">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span className="text-xs font-medium">High</span>
              </div>
              <Tag color="orange" className="text-xs">{summary.high}</Tag>
            </div>
          )}

          {summary.medium > 0 && (
            <div className="flex items-center justify-between p-2 rounded bg-yellow-50 border border-yellow-200">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-xs font-medium">Medium</span>
              </div>
              <Tag color="warning" className="text-xs">{summary.medium}</Tag>
            </div>
          )}

          {summary.low > 0 && (
            <div className="flex items-center justify-between p-2 rounded bg-green-50 border border-green-200">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs font-medium">Low</span>
              </div>
              <Tag color="green" className="text-xs">{summary.low}</Tag>
            </div>
          )}
        </div>

        {totalRisks > 0 && (
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            {totalRisks} open {totalRisks === 1 ? 'issue' : 'issues'} requiring attention
          </p>
        )}
      </div>
    </Card>
  );
}
