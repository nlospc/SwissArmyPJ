import React, { useState } from 'react';
import { Button } from 'antd';
import { ChevronDown } from 'lucide-react';
import { ChangeFeed } from '@/components/dashboard/ChangeFeed';
import { UpcomingMilestones } from '@/components/dashboard/UpcomingMilestones';
import { RiskSummary } from '@/components/dashboard/RiskSummary';
import type { ChangeEvent, MilestoneInfo, RiskSummary as RiskSummaryType } from '@/stores/useDashboardStore';

interface TopWidgetDrawerProps {
  changeFeed: ChangeEvent[];
  upcomingMilestones: MilestoneInfo[];
  riskSummary: RiskSummaryType | null;
  loading: boolean;
}

export function TopWidgetDrawer({
  changeFeed,
  upcomingMilestones,
  riskSummary,
  loading,
}: TopWidgetDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b bg-theme-container theme-transition">
      {/* Header/Trigger */}
      <div className="flex items-center justify-between px-8 py-3">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-theme-secondary theme-transition">
            Quick Overview
          </h2>
          <div className="flex items-center gap-2 text-xs text-theme-secondary theme-transition">
            {upcomingMilestones.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="font-medium">{upcomingMilestones.length}</span> milestones
              </span>
            )}
            {changeFeed.length > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">{changeFeed.length}</span> recent changes
                </span>
              </>
            )}
          </div>
        </div>
        <Button type="text" size="small" onClick={() => setIsOpen(!isOpen)}>
          <span className="text-xs">
            {isOpen ? 'Hide Details' : 'Show Details'}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ marginLeft: 8 }} />
        </Button>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="px-8 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Change Feed */}
            <ChangeFeed events={changeFeed} loading={loading} />

            {/* Upcoming Milestones */}
            <UpcomingMilestones milestones={upcomingMilestones} loading={loading} />

            {/* Risk Summary */}
            <RiskSummary summary={riskSummary} loading={loading} />
          </div>
        </div>
      )}
    </div>
  );
}
