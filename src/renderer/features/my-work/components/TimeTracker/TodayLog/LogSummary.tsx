/**
 * LogSummary - Today's time entries list
 */

import { useState } from 'react';
import { Plus, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMyWorkStore } from '@/stores/useMyWorkStore';
import { LogEntry } from './LogEntry';
import { ManualLogDialog } from './ManualLogDialog';
import { formatDuration } from '../../../utils/timeFormatters';

export function LogSummary() {
  const [isManualLogOpen, setIsManualLogOpen] = useState(false);
  const todayLogs = useMyWorkStore((state) => state.todayLogs);

  // Calculate total time today
  const totalMinutes = todayLogs.reduce((sum, log) => {
    return sum + (log.durationMinutes || 0);
  }, 0);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Today's Time Log
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsManualLogOpen(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Manual Entry
          </Button>
        </CardHeader>
        <CardContent>
          {/* Total Time */}
          {totalMinutes > 0 && (
            <div className="mb-4 p-3 bg-primary/5 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Total Today</div>
              <div className="text-2xl font-bold">{formatDuration(totalMinutes)}</div>
            </div>
          )}

          {/* Log Entries */}
          {todayLogs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-sm text-muted-foreground">
                No time logged today. Start a timer or add a manual entry.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {todayLogs.map((log) => (
                <LogEntry key={log.uuid} log={log} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Log Dialog */}
      <ManualLogDialog
        open={isManualLogOpen}
        onOpenChange={setIsManualLogOpen}
      />
    </>
  );
}
