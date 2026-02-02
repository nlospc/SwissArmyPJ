/**
 * TodoItem - Individual task card with checkbox, timer button, and details
 */

import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Play,
  Timer,
  Calendar,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const markDone = useMyWorkStore((state) => state.markDone);
  const startTimer = useMyWorkStore((state) => state.startTimer);
  const startPomodoro = useMyWorkStore((state) => state.startPomodoro);
  const activeLogs = useMyWorkStore((state) => state.activeLogs);

  const hasActiveTimer = Array.from(activeLogs.values()).some(
    (log) => log.workItemId === todo.id
  );

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
        'mb-2 transition-all',
        isCompleted && 'opacity-60',
        isHovered && 'shadow-md',
        dueDateInfo.isOverdue && !isCompleted && 'border-red-500/30'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
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
          {!isCompleted && (
            <div className="flex items-center gap-2">
              {hasActiveTimer ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-md text-sm">
                  <Clock className="h-4 w-4 animate-pulse" />
                  <span className="font-medium">Running</span>
                </div>
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
