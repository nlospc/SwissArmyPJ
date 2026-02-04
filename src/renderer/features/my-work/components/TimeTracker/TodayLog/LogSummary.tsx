/**
 * LogSummary - Today's time entries list
 */

import { useState } from 'react';
import { Plus, Clock } from 'lucide-react';
import { Card, Button } from 'antd';
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
      <Card
        title={
          <span className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Today's Time Log
          </span>
        }
        extra={
          <Button size="small" onClick={() => setIsManualLogOpen(true)}>
            <Plus className="h-3 w-3" style={{ marginRight: 4 }} />
            Manual Entry
          </Button>
        }
      >
        {/* Total Time */}
        {totalMinutes > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Total Today</div>
            <div className="text-2xl font-bold">{formatDuration(totalMinutes)}</div>
          </div>
        )}

        {/* Log Entries */}
        {todayLogs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-sm text-gray-500">
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
      </Card>

      {/* Manual Log Dialog */}
      <ManualLogDialog
        open={isManualLogOpen}
        onOpenChange={setIsManualLogOpen}
      />
    </>
  );
}
