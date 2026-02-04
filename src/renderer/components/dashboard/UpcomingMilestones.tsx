import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flag } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import type { MilestoneInfo } from '@/stores/useDashboardStore';

interface UpcomingMilestonesProps {
  milestones: MilestoneInfo[];
  loading: boolean;
}

export function UpcomingMilestones({ milestones, loading }: UpcomingMilestonesProps) {
  const getStatusBadge = (status: 'on_track' | 'at_risk' | 'overdue') => {
    switch (status) {
      case 'on_track':
        return <Badge className="bg-green-600">On Track</Badge>;
      case 'at_risk':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          At Risk
        </Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flag className="h-4 w-4" />
              Upcoming Milestones
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flag className="h-4 w-4" />
            Upcoming Milestones
          </CardTitle>
          <Badge variant="outline" className="text-xs">{milestones.length} total</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {milestones.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-sm">No upcoming milestones</p>
        ) : (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="flex items-center justify-between p-2 rounded border border-border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate text-sm leading-tight">{milestone.name}</h4>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{milestone.projectName}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {format(new Date(milestone.dueDate), 'MMM dd')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(milestone.dueDate), { addSuffix: true })}
                    </div>
                  </div>
                  {getStatusBadge(milestone.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
