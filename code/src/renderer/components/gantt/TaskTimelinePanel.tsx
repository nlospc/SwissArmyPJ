import { ExclamationTriangleIcon } from '../../icons';
import type { WorkPackage } from '@shared/types';

// Timeline utilities
const DAY_MS = 24 * 60 * 60 * 1000;

const calculateBarStyle = (
  startDate: Date | null,
  endDate: Date | null,
  viewStart: Date,
  viewEnd: Date
) => {
  if (!startDate || !endDate) {
    return { left: '0%', width: '0%', visible: false };
  }

  const startMs = startDate.getTime();
  const rawEndMs = endDate.getTime();
  const endMs = rawEndMs <= startMs ? startMs + DAY_MS : rawEndMs;

  const totalDuration = viewEnd.getTime() - viewStart.getTime();
  if (totalDuration <= 0) {
    return { left: '0%', width: '0%', visible: false };
  }

  const startOffset = Math.max(0, startMs - viewStart.getTime());
  const duration = Math.min(endMs, viewEnd.getTime()) - Math.max(startMs, viewStart.getTime());

  return {
    left: `${(startOffset / totalDuration) * 100}%`,
    width: `${Math.max(0, (duration / totalDuration) * 100)}%`,
    visible: duration > 0,
  };
};

const WP_STATUS_COLORS: Record<string, string> = {
  todo: '#6B7280',
  in_progress: '#2B7FFF',
  done: '#00C950',
  blocked: '#DC2626',
};

interface TaskTimelinePanelProps {
  tasks: WorkPackage[];
  viewStart: Date;
  viewEnd: Date;
  selectedTaskId: number | null;
  onSelectTask: (taskId: number) => void;
  onBeginDrag: (
    task: WorkPackage,
    kind: 'move' | 'resize_start' | 'resize_end' | 'milestone_move',
    e: React.MouseEvent
  ) => void;
  isDraggingTask: boolean;
}

export const TaskTimelinePanel = ({
  tasks,
  viewStart,
  viewEnd,
  selectedTaskId,
  onSelectTask,
  onBeginDrag,
  isDraggingTask,
}: TaskTimelinePanelProps) => {
  return (
    <div className="flex-1 relative">
      {tasks.map((task) => {
        const startDate = task.start_date ? new Date(task.start_date) : null;
        const endDate = task.end_date ? new Date(task.end_date) : null;
        const barStyle = calculateBarStyle(startDate, endDate, viewStart, viewEnd);
        const isMilestone = task.type === 'milestone';
        const hasConflict = task.hasConflict || false;
        const isSelected = selectedTaskId === task.id;
        const isDragging = isDraggingTask && isSelected;

        const statusColor = WP_STATUS_COLORS[task.status] || WP_STATUS_COLORS.todo;

        return (
          <div
            key={task.id}
            className={`relative border-b border-border-light hover:bg-background-hover transition-colors ${
              isSelected ? 'bg-background-hover' : ''
            }`}
            style={{ height: '34px' }}
          >
            {barStyle.visible ? (
              <>
                {isMilestone ? (
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 w-[20px] h-[20px] cursor-pointer hover:opacity-80 transition-opacity ${
                      hasConflict ? 'ring-2 ring-red-500 ring-offset-2' : ''
                    }`}
                    style={{
                      left: `calc(${barStyle.left} + ${parseFloat(barStyle.width) / 2 - 3.5}%)`,
                      transform: 'translateY(-50%) rotate(45deg)',
                      backgroundColor: hasConflict ? '#DC2626' : statusColor,
                    }}
                    onClick={() => onSelectTask(task.id)}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onBeginDrag(task, 'milestone_move', e);
                    }}
                    title={`Milestone: ${task.name}${hasConflict ? ' (Dependency Conflict!)' : ''}`}
                  />
                ) : (
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 h-[18px] rounded border-2 flex items-center px-2 cursor-pointer transition-opacity ${
                      isDragging ? 'opacity-50' : 'hover:opacity-80'
                    }`}
                    style={{
                      left: barStyle.left,
                      width: barStyle.width,
                      backgroundColor: hasConflict ? '#FEE2E2' : `${statusColor}20`,
                      borderColor: hasConflict ? '#DC2626' : statusColor,
                    }}
                    onClick={() => onSelectTask(task.id)}
                    onMouseDown={(e) => onBeginDrag(task, 'move', e)}
                    title={hasConflict ? 'Dependency Conflict! This task violates dependency constraints.' : task.name}
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        onBeginDrag(task, 'resize_start', e);
                      }}
                      title="Resize start"
                    />
                    <div
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        onBeginDrag(task, 'resize_end', e);
                      }}
                      title="Resize end"
                    />
                    <div className="flex items-center gap-2 overflow-hidden">
                      {hasConflict && <ExclamationTriangleIcon className="w-3 h-3 text-red-600 flex-shrink-0" />}
                      {/* Progress indicator - circular style */}
                      <div className="flex-shrink-0 flex items-center gap-1">
                        <svg className="w-4 h-4" viewBox="0 0 16 16">
                          {/* Background circle */}
                          <circle
                            cx="8"
                            cy="8"
                            r="6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="opacity-20"
                            style={{ color: statusColor }}
                          />
                          {/* Progress circle */}
                          <circle
                            cx="8"
                            cy="8"
                            r="6"
                            fill="none"
                            stroke={statusColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            transform="rotate(-90 8 8)"
                            strokeDasharray={`${(task.progress / 100) * 37.7} 37.7`}
                          />
                        </svg>
                        <span className="text-[9px] font-semibold" style={{ color: statusColor }}>{task.progress}%</span>
                      </div>
                      <span className="text-[10px] font-medium text-text-primary truncate">{task.name}</span>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
