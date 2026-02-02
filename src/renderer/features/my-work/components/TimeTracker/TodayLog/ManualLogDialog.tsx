/**
 * ManualLogDialog - Manual time entry form
 */

import { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMyWorkStore } from '@/stores/useMyWorkStore';

interface ManualLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualLogDialog({ open, onOpenChange }: ManualLogDialogProps) {
  const userId = useMyWorkStore((state) => state.userId);
  
  // Fix: Use shallow comparison to prevent infinite loop caused by creating new array references
  const todos = useMyWorkStore(
    useShallow((state) => Array.from(state.todos.values()))
  );
  
  const logManualTime = useMyWorkStore((state) => state.logManualTime);

  const [workItemId, setWorkItemId] = useState<number>(0);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default times when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Set default end time to now
      const now = new Date();
      setEndTime(formatDateTimeLocal(now));

      // Set default start time to 30 minutes ago
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      setStartTime(formatDateTimeLocal(thirtyMinutesAgo));

      // Reset other fields
      setWorkItemId(0);
      setNotes('');
    }

    onOpenChange(newOpen);
  };

  // Calculate duration
  const durationMinutes = useMemo(() => {
    if (!startTime || !endTime) return 0;

    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();

    return Math.max(0, Math.floor(diffMs / 1000 / 60));
  }, [startTime, endTime]);

  const handleSubmit = async () => {
    if (!workItemId || !startTime || !endTime || durationMinutes <= 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await logManualTime({
        workItemId,
        userId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        durationMinutes,
        notes: notes.trim() || undefined,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to log manual time:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Log Manual Time</DialogTitle>
          <DialogDescription>
            Record time spent on a task manually.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Task Selection */}
          <div className="grid gap-2">
            <Label htmlFor="task">Task *</Label>
            <Select
              value={workItemId.toString()}
              onValueChange={(value) => setWorkItemId(parseInt(value, 10))}
            >
              <SelectTrigger id="task">
                <SelectValue placeholder="Select a task..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {todos.map((todo) => (
                    <SelectItem key={todo.id} value={todo.id.toString()}>
                      {todo.name} ({todo.projectName})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Start Time */}
          <div className="grid gap-2">
            <Label htmlFor="start-time">Start Time *</Label>
            <input
              id="start-time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* End Time */}
          <div className="grid gap-2">
            <Label htmlFor="end-time">End Time *</Label>
            <input
              id="end-time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Duration Display */}
          {durationMinutes > 0 && (
            <div className="text-sm text-muted-foreground">
              Duration: {Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m
            </div>
          )}

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about what you worked on..."
              rows={3}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!workItemId || !startTime || !endTime || durationMinutes <= 0 || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Log Time'}
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
