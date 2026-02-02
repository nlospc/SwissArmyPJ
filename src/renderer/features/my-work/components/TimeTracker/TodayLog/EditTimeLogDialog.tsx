/**
 * EditTimeLogDialog - Edit existing time log entry
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useMyWorkStore, type TimeLog } from '@/stores/useMyWorkStore';

interface EditTimeLogDialogProps {
  log: TimeLog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTimeLogDialog({ log, open, onOpenChange }: EditTimeLogDialogProps) {
  const editTimeLog = useMyWorkStore((state) => state.editTimeLog);

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when log changes or dialog opens
  useEffect(() => {
    if (open && log) {
      setStartTime(formatDateTimeLocal(new Date(log.startTime)));
      setEndTime(log.endTime ? formatDateTimeLocal(new Date(log.endTime)) : '');
      setNotes(log.notes || '');
    }
  }, [open, log]);

  // Calculate new duration
  const newDurationMinutes = useMemo(() => {
    if (!startTime || !endTime) return null;

    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();

    return Math.max(0, Math.floor(diffMs / 1000 / 60));
  }, [startTime, endTime]);

  const handleSubmit = async () => {
    if (!startTime) return;

    setIsSubmitting(true);

    try {
      await editTimeLog(log.id, {
        startTime: new Date(startTime).toISOString(),
        endTime: endTime ? new Date(endTime).toISOString() : log.endTime,
        notes: notes.trim() || undefined,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to edit time log:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const originalDuration = log.durationMinutes || 0;
  const hasDurationChange = newDurationMinutes !== null && newDurationMinutes !== originalDuration;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Time Log</DialogTitle>
          <DialogDescription>
            Modify the time entry. All changes are tracked in the audit log.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Task Info (read-only) */}
          <div className="grid gap-2">
            <Label>Task</Label>
            <div className="text-sm font-medium">{log.itemName}</div>
            <div className="text-xs text-muted-foreground">{log.projectName}</div>
          </div>

          {/* Log Type */}
          <div className="grid gap-2">
            <Label>Log Type</Label>
            <div className="text-sm capitalize">{log.logType}</div>
          </div>

          {/* Start Time */}
          <div className="grid gap-2">
            <Label htmlFor="edit-start-time">Start Time *</Label>
            <input
              id="edit-start-time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* End Time */}
          {log.endTime && (
            <div className="grid gap-2">
              <Label htmlFor="edit-end-time">End Time *</Label>
              <input
                id="edit-end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          )}

          {/* Duration Change Indicator */}
          {hasDurationChange && (
            <div className="text-sm">
              <span className="text-muted-foreground">Duration: </span>
              <span className="line-through text-muted-foreground">
                {Math.floor(originalDuration / 60)}h {originalDuration % 60}m
              </span>
              {' → '}
              <span className="font-medium text-amber-600">
                {Math.floor(newDurationMinutes! / 60)}h {newDurationMinutes! % 60}m
              </span>
            </div>
          )}

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about what you worked on..."
              rows={3}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Edit History */}
          {log.editCount > 0 && (
            <div className="text-xs text-amber-600 bg-amber-500/10 p-2 rounded">
              This entry has been edited {log.editCount} time{log.editCount > 1 ? 's' : ''}.
              Last edited: {log.editedAt ? new Date(log.editedAt).toLocaleString() : 'Unknown'}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!startTime || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper to format Date to datetime-local input format
function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
