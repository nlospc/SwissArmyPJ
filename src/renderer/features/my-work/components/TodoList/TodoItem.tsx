/**
 * TodoItem - Individual task card with checkbox, timer button, and details
 */

import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Play,
  Timer,
  Calendar,
  Clock,
  AlertCircle,
  Square,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/components/ui/utils';
import { useMyWorkStore, type TodoItem as TodoItemType } from '@/stores/useMyWorkStore';
import { formatDuration } from '../../utils/timeFormatters';
import { formatDueDate } from '../../utils/dateHelpers';

interface TodoItemProps {
  todo: TodoItemType;
  isCompleted?: boolean;
}

export function TodoItem({ todo, isCompleted = false }: TodoItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.name);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const markDone = useMyWorkStore((state) => state.markDone);
  const startTimer = useMyWorkStore((state) => state.startTimer);
  const startPomodoro = useMyWorkStore((state) => state.startPomodoro);
  const stopTimer = useMyWorkStore((state) => state.stopTimer);
  const fetchTodos = useMyWorkStore((state) => state.fetchTodos);
  const activeLogsMap = useMyWorkStore((state) => state.activeLogs);

  // Memoize the check to avoid creating new arrays on every render
  const activeTimerLog = useMemo(() => {
    return Array.from(activeLogsMap.values()).find(
      (log) => log.workItemId === todo.id
    );
  }, [activeLogsMap, todo.id]);

  const hasActiveTimer = !!activeTimerLog;

  const dueDateInfo = formatDueDate(todo.dueDate);

  const handleComplete = () => {
    markDone(todo.id);
  };

  const handleStartTimer = () => {
    startTimer(todo.id, false);
  };

  const handleStartPomodoro = () => {
    startPomodoro(todo.id);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Call IPC to delete the task
      const { ipc } = await import('@/lib/ipc');
      const result = await ipc.workItems.delete(todo.id);

      if (result.success) {
        // Refresh the todo list
        await fetchTodos(true);
        setIsDeleteOpen(false);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;

    setIsSaving(true);
    try {
      // Call IPC to update the task
      const { ipc } = await import('@/lib/ipc');
      const result = await ipc.workItems.update(todo.id, {
        name: editTitle.trim(),
      });

      if (result.success) {
        // Refresh the todo list
        await fetchTodos(true);
        setIsEditOpen(false);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Priority badge colors
  const priorityStyles = {
    critical: 'bg-red-500/10 text-red-600 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    medium: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    low: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  };

  return (
    <Card
      className={cn(
        'transition-all',
        isCompleted && 'opacity-60',
        isHovered && 'shadow-md',
        dueDateInfo.isOverdue && !isCompleted && 'border-red-500/30'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={handleComplete}
            className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
            disabled={isCompleted}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h4
              className={cn(
                'font-medium mb-1',
                isCompleted && 'line-through text-muted-foreground'
              )}
            >
              {todo.name}
            </h4>
            {/* Title */}
            <h4
              className={cn(
                'font-medium mb-1',
                isCompleted && 'line-through text-muted-foreground'
              )}
            >
              {todo.name}
            </h4>

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {/* Project */}
              <span className="flex items-center gap-1">
                {todo.projectName}
              </span>

              {/* Due Date */}
              {todo.dueDate && (
                <span
                  className={cn(
                    'flex items-center gap-1',
                    dueDateInfo.isOverdue && 'text-red-600 font-medium',
                    dueDateInfo.isToday && 'text-amber-600 font-medium'
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {dueDateInfo.text}
                </span>
              )}

              {/* Estimated Time */}
              {todo.estimatedMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(todo.estimatedMinutes)} estimated
                </span>
              )}

              {/* Logged Time */}
              {todo.loggedMinutes > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(todo.loggedMinutes)} logged
                </span>
              )}

              {/* Priority Badge */}
              {todo.priority && todo.priority !== 'none' && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                    priorityStyles[todo.priority as keyof typeof priorityStyles]
                  )}
                >
                  {todo.priority.toUpperCase()}
                </span>
              )}

              {/* Overdue Indicator */}
              {dueDateInfo.isOverdue && !isCompleted && (
                <span className="flex items-center gap-1 text-red-600 font-medium">
                  <AlertCircle className="h-3 w-3" />
                  Overdue
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!isCompleted && (
              <>
                {hasActiveTimer ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-md text-sm">
                      <Clock className="h-4 w-4 animate-pulse" />
                      <span className="font-medium">Running</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => activeTimerLog && stopTimer(activeTimerLog.id)}
                      className="h-8"
                      title="Stop timer"
                    >
                      <Square className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleStartTimer}
                      className="h-8"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleStartPomodoro}
                      className="h-8"
                    >
                      <Timer className="h-3 w-3 mr-1" />
                      Pomodoro
                    </Button>
                  </>
                )}
              </>
            )}

            {/* More Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDeleteOpen(true)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{todo.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-name">Task Name</Label>
              <Input
                id="task-name"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter task name..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editTitle.trim() || isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
