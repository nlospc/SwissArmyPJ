import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Change Feed</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Change Feed</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {events.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-sm">No recent changes</p>
        ) : (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {events.map((event) => {
              // Handle both 'action' and 'type' fields for compatibility
              const eventType = (event.type || event.action) as keyof typeof eventIcons;
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-2 p-2 rounded border border-border hover:bg-muted/50 transition-colors"
                >
                  <span className="text-lg flex-shrink-0">{eventIcons[eventType]}</span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate leading-tight">{event.details}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {event.projectName && (
                        <span className="text-xs text-muted-foreground truncate">
                          {event.projectName}
                        </span>
                      )}
                      {event.projectName && <span className="text-xs text-muted-foreground">•</span>}
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  <Badge variant="outline" className="flex-shrink-0 text-xs px-1.5 py-0">
                    {eventLabels[eventType]}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
