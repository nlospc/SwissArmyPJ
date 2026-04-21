/**
 * LogEntry - Single time log entry with edit button
 */

import { useState } from 'react';
import { Clock, Edit, Timer, Hand } from 'lucide-react';
import { Button } from 'antd';
import type { TimeLog } from '@/stores/useMyWorkStore';
import { formatTimeRange, formatDuration } from '../../../utils/timeFormatters';
import { EditTimeLogDialog } from './EditTimeLogDialog';

interface LogEntryProps {
  log: TimeLog;
}

export function LogEntry({ log }: LogEntryProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const logTypeIcons = {
    manual: Hand,
    timer: Clock,
    pomodoro: Timer,
  };

  const LogIcon = logTypeIcons[log.logType] || Clock;

  const wasEdited = log.editCount > 0;

  return (
    <>
      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-theme-container transition-colors group">
        {/* Icon */}
        <div className="p-2 rounded-md bg-theme-container">
          <LogIcon className="h-4 w-4 text-theme-secondary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Task Name */}
          <div className="font-medium text-sm truncate" title={log.itemName}>
            {log.itemName}
          </div>

          {/* Project Name */}
          <div className="text-xs text-theme-secondary truncate" title={log.projectName}>
            {log.projectName}
          </div>

          {/* Time Range */}
          <div className="text-xs text-theme-secondary mt-1">
            {formatTimeRange(log.startTime, log.endTime)}
          </div>

          {/* Duration */}
          <div className="text-xs font-medium mt-1">
            {log.durationMinutes ? formatDuration(log.durationMinutes) : 'In progress...'}
          </div>

          {/* Notes */}
          {log.notes && (
            <div className="text-xs text-theme-secondary mt-1 italic line-clamp-2">
              "{log.notes}"
            </div>
          )}

          {/* Pomodoro Count */}
          {log.pomodoroCount > 0 && (
            <div className="text-xs text-theme-secondary mt-1">
              🍅 {log.pomodoroCount} pomodoro{log.pomodoroCount > 1 ? 's' : ''}
            </div>
          )}

          {/* Edit Indicator */}
          {wasEdited && (
            <div className="text-[10px] text-amber-600 mt-1">
              Edited {log.editCount} time{log.editCount > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Edit Button */}
        <Button
          size="small"
          type="text"
          onClick={() => setIsEditDialogOpen(true)}
          className={`opacity-0 group-hover:opacity-100 transition-opacity${wasEdited ? ' text-amber-600' : ''}`}
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>

      {/* Edit Dialog */}
      <EditTimeLogDialog
        log={log}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  );
}
