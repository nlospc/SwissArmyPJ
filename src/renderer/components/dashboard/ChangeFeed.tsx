import React from 'react';
import { Card, Tag } from 'antd';
import { formatDistanceToNow } from 'date-fns';
import type { ChangeEvent } from '@/stores/useDashboardStore';

interface ChangeFeedProps {
  events: ChangeEvent[];
  loading: boolean;
}

const eventIcons = {
  created: '🟢',
  updated: '🟡',
  deleted: '🔴',
  completed: '✅',
  conflict: '⚠️',
  sync: '📁',
};

const eventLabels = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  completed: 'Completed',
  conflict: 'Conflict',
  sync: 'Sync',
};

export function ChangeFeed({ events, loading }: ChangeFeedProps) {
  if (loading) {
    return (
      <Card title="Change Feed">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse bg-gray-100 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card title="Change Feed">
      {events.length === 0 ? (
        <p className="text-center text-gray-500 py-4 text-sm">No recent changes</p>
      ) : (
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {events.map((event) => {
            // Handle both 'action' and 'type' fields for compatibility
            const eventType = (event.type || event.action) as keyof typeof eventIcons;
            return (
              <div
                key={event.id}
                className="flex items-start gap-2 p-2 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg flex-shrink-0">{eventIcons[eventType]}</span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate leading-tight">{event.details}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {event.projectName && (
                      <span className="text-xs text-gray-500 truncate">
                        {event.projectName}
                      </span>
                    )}
                    {event.projectName && <span className="text-xs text-gray-500">•</span>}
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <Tag className="flex-shrink-0 text-xs">
                  {eventLabels[eventType]}
                </Tag>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
