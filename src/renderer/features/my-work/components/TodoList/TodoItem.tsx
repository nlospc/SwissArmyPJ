/**
 * TodoItem - Individual task row in the todo table
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
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/components/ui/utils';
import { useMyWorkStore, type TodoItem as TodoItemType } from '@/stores/useMyWorkStore';
import { formatDuration } from '../../utils/timeFormatters';
import { formatDueDate } from '../../utils/dateHelpers';

interface TodoItemProps {
  todo: TodoItemType;
  isCompleted?: boolean;
}

const priorityStyles = {
  critical: 'bg-red-500/10 text-red-600 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  medium: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  low: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export function TodoItem({ todo, isCompleted = false }: TodoItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editData, setEditData] = useState({ title: todo.name, status: todo.status, end_date: todo.dueDate || '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const markDone = useMyWorkStore((state) => state.markDone);
  const startTimer = useMyWorkStore((state) => state.startTimer);
  const startPomodoro = useMyWorkStore((state) => state.startPomodoro);
  const stopTimer = useMyWorkStore((state) => state.stopTimer);
  const fetchTodos = useMyWorkStore((state) => state.fetchTodos);
  const activeLogsMap = useMyWorkStore((state) => state.activeLogs);

  const activeTimerLog = useMemo(() => {
    return Array.from(activeLogsMap.values()).find(
      (log) => log.workItemId === todo.id
    );
  }, [activeLogsMap, todo.id]);

  const hasActiveTimer = !!activeTimerLog;
  const dueDateInfo = formatDueDate(todo.dueDate);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { ipc } = await import('@/lib/ipc');
      const result = await ipc.workItems.delete(todo.id);
      if (result.success) {
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
    if (!editData.title.trim()) return;
    setIsSaving(true);
    try {
      const { ipc } = await import('@/lib/ipc');
      const result = await ipc.workItems.update(todo.id, {
        title: editData.title.trim(),
        status: editData.status as 'not_started' | 'in_progress' | 'done' | 'blocked',
        end_date: editData.end_date || null,
      });
      if (result.success) {
        await fetchTodos(true);
        setIsEditOpen(false);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <tr className={cn(
      'border-b last:border-0 transition-colors hover:bg-muted/40',
      isCompleted && 'opacity-60',
      dueDateInfo.isOverdue && !isCompleted && 'bg-red-50/50'
    )}>
      {/* Checkbox */}
      <td className="w-8 px-3 py-2.5">
        <button
          onClick={() => markDone(todo.id)}
          className="text-muted-foreground hover:text-primary transition-colors"
          disabled={isCompleted}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </button>
      </td>

      {/* Task */}
      <td className="px-3 py-2.5">
        <span className={cn('font-medium text-sm', isCompleted && 'line-through text-muted-foreground')}>
          {todo.name}
        </span>
      </td>

      {/* Project */}
      <td className="px-3 py-2.5 text-sm text-muted-foreground">
        {todo.projectName}
      </td>

      {/* Priority */}
      <td className="px-3 py-2.5">
        {todo.priority && todo.priority !== 'none' ? (
          <span className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-medium border',
            priorityStyles[todo.priority as keyof typeof priorityStyles]
          )}>
            {todo.priority.toUpperCase()}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Due */}
      <td className="px-3 py-2.5">
        {todo.dueDate ? (
          <span className={cn(
            'text-sm flex items-center gap-1',
            dueDateInfo.isOverdue && 'text-red-600 font-medium',
            dueDateInfo.isToday && 'text-amber-600 font-medium'
          )}>
            <Calendar className="h-3 w-3" />
            {dueDateInfo.text}
            {dueDateInfo.isOverdue && <AlertCircle className="h-3 w-3" />}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Time */}
      <td className="px-3 py-2.5 text-sm text-muted-foreground">
        {todo.estimatedMinutes || todo.loggedMinutes > 0 ? (
          <div className="flex flex-col gap-0.5">
            {todo.estimatedMinutes ? (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(todo.estimatedMinutes)} est
              </span>
            ) : null}
            {todo.loggedMinutes > 0 ? (
              <span className="flex items-center gap-1 text-green-600">
                <Clock className="h-3 w-3" />
                {formatDuration(todo.loggedMinutes)} logged
              </span>
            ) : null}
          </div>
        ) : (
          <span>—</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          {!isCompleted && (
            <>
              {hasActiveTimer ? (
                <>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-600 rounded text-xs font-medium">
                    <Clock className="h-3 w-3 animate-pulse" />
                    Running
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => activeTimerLog && stopTimer(activeTimerLog.id)}
                    className="h-7 w-7 p-0"
                    title="Stop timer"
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => startTimer(todo.id, false)} className="h-7 text-xs px-2">
                    <Play className="h-3 w-3 mr-1" />
                    Start
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => startPomodoro(todo.id)} className="h-7 text-xs px-2">
                    <Timer className="h-3 w-3 mr-1" />
                    Pomo
                  </Button>
                </>
              )}
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Dialogs render via portal — safe inside <td> */}
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

        <Dialog open={isEditOpen} onOpenChange={(open) => {
          if (open) {
            setEditData({ title: todo.name, status: todo.status, end_date: todo.dueDate || '' });
          }
          setIsEditOpen(open);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="task-name">Task Name</Label>
                <Input
                  id="task-name"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  placeholder="Enter task name..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-status">Status</Label>
                <NativeSelect
                  id="task-status"
                  value={editData.status}
                  onChange={(value) => setEditData({ ...editData, status: value })}
                  options={[
                    { value: 'not_started', label: 'Not Started' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'blocked', label: 'Blocked' },
                    { value: 'done', label: 'Done' },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due">Due Date</Label>
                <input
                  id="task-due"
                  type="date"
                  value={editData.end_date}
                  onChange={(e) => setEditData({ ...editData, end_date: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={!editData.title.trim() || isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </td>
    </tr>
  );
}
