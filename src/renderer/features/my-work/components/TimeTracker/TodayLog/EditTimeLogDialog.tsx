/**
 * EditTimeLogDialog - Edit existing time log entry
 */

import { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Input } from 'antd';
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
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="Edit Time Log"
      width={500}
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>,
        <Button key="save" type="primary" disabled={!startTime || isSubmitting} onClick={handleSubmit}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>,
      ]}
    >
      <div className="space-y-4">
        {/* Task Info (read-only) */}
        <div>
          <label className="block text-sm font-medium mb-1">Task</label>
          <div className="text-sm font-medium">{log.itemName}</div>
          <div className="text-xs text-theme-secondary">{log.projectName}</div>
        </div>

        {/* Log Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Log Type</label>
          <div className="text-sm capitalize">{log.logType}</div>
        </div>

        {/* Start Time */}
        <div>
          <label className="block text-sm font-medium mb-1">Start Time *</label>
          <Input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        {/* End Time */}
        {log.endTime && (
          <div>
            <label className="block text-sm font-medium mb-1">End Time *</label>
            <Input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        )}

        {/* Duration Change Indicator */}
        {hasDurationChange && (
          <div className="text-sm">
            <span className="text-theme-secondary">Duration: </span>
            <span className="line-through text-theme-secondary">
              {Math.floor(originalDuration / 60)}h {originalDuration % 60}m
            </span>
            {' → '}
            <span className="font-medium text-amber-600">
              {Math.floor(newDurationMinutes! / 60)}h {newDurationMinutes! % 60}m
            </span>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <Input.TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about what you worked on..."
            rows={3}
          />
        </div>

        {/* Edit History */}
        {log.editCount > 0 && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            This entry has been edited {log.editCount} time{log.editCount > 1 ? 's' : ''}.
            Last edited: {log.editedAt ? new Date(log.editedAt).toLocaleString() : 'Unknown'}
          </div>
        )}
      </div>
    </Modal>
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
