import React from 'react';
import { Card, Tag } from 'antd';
import { Flag } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import type { MilestoneInfo } from '@/stores/useDashboardStore';

interface UpcomingMilestonesProps {
  milestones: MilestoneInfo[];
  loading: boolean;
}

export function UpcomingMilestones({ milestones, loading }: UpcomingMilestonesProps) {
  const getStatusTag = (status: 'on_track' | 'at_risk' | 'overdue') => {
    switch (status) {
      case 'on_track':
        return <Tag color="green">On Track</Tag>;
      case 'at_risk':
        return <Tag color="orange">At Risk</Tag>;
      case 'overdue':
        return <Tag color="red">Overdue</Tag>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card title={<span className="flex items-center gap-2 text-base"><Flag className="h-4 w-4" /> Upcoming Milestones</span>}>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse bg-gray-100 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={<span className="flex items-center gap-2 text-base"><Flag className="h-4 w-4" /> Upcoming Milestones</span>}
      extra={<Tag>{milestones.length} total</Tag>}
    >
      {milestones.length === 0 ? (
        <p className="text-center text-gray-500 py-4 text-sm">No upcoming milestones</p>
      ) : (
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="flex items-center justify-between p-2 rounded border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate text-sm leading-tight">{milestone.name}</h4>
                <p className="text-xs text-gray-500 truncate mt-0.5">{milestone.projectName}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {format(new Date(milestone.dueDate), 'MMM dd')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(milestone.dueDate), { addSuffix: true })}
                  </div>
                </div>
                {getStatusTag(milestone.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
