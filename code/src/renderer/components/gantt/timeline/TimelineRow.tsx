import type { WorkPackage } from '@shared/types';
import { WP_STATUS_COLORS } from '@/utils/colors';
import { calculateBarStyle } from '@/utils/date';
import { ExclamationTriangleIcon } from '@/icons';

interface TimelineRowProps {
  task: WorkPackage;
  viewStart: Date;
  viewEnd: Date;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onBeginDrag: (task: WorkPackage, kind: 'move' | 'resize_start' | 'resize_end' | 'milestone_move', e: React.MouseEvent) => void;
}

export function TimelineRow({ task, viewStart, viewEnd, isSelected, isDragging, onSelect, onBeginDrag }: TimelineRowProps) {
  const startDate = task.start_date ? new Date(task.start_date) : null;
  const endDate = task.end_date ? new Date(task.end_date) : null;
  const barStyle = calculateBarStyle(startDate, endDate, viewStart, viewEnd);
  const isMilestone = task.type === 'milestone';
  const hasConflict = task.hasConflict || false;
  const statusColor = WP_STATUS_COLORS[task.status] || WP_STATUS_COLORS.todo;

  return (
    <div
      className={`relative border-b border-border-light hover:bg-background-hover/50 transition-colors ${
        isSelected ? 'bg-primary/5' : ''
      }`}
      style={{ height: 34 }}
    >
      {barStyle.visible && (
        isMilestone ? (
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-[20px] h-[20px] cursor-pointer hover:opacity-80 ${
              hasConflict ? 'ring-2 ring-red-500 ring-offset-2' : ''
            }`}
            style={{
              left: barStyle.left,
              transform: 'translateY(-50%) rotate(45deg)',
              backgroundColor: hasConflict ? '#DC2626' : statusColor,
            }}
            onClick={onSelect}
            onMouseDown={(e) => { e.stopPropagation(); onBeginDrag(task, 'milestone_move', e); }}
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
            onClick={onSelect}
            onMouseDown={(e) => onBeginDrag(task, 'move', e)}
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"
              onMouseDown={(e) => { e.stopPropagation(); onBeginDrag(task, 'resize_start', e); }} />
            <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
              onMouseDown={(e) => { e.stopPropagation(); onBeginDrag(task, 'resize_end', e); }} />
            <div className="flex items-center gap-2 overflow-hidden">
              {hasConflict && <ExclamationTriangleIcon className="w-3 h-3 text-red-600 flex-shrink-0" />}
              <div className="flex-shrink-0 flex items-center gap-1">
                <svg className="w-4 h-4" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-20" style={{ color: statusColor }} />
                  <circle cx="8" cy="8" r="6" fill="none" stroke={statusColor} strokeWidth="2" strokeLinecap="round" transform="rotate(-90 8 8)" strokeDasharray={`${(task.progress / 100) * 37.7} 37.7`} />
                </svg>
                <span className="text-[9px] font-semibold" style={{ color: statusColor }}>{task.progress}%</span>
              </div>
              <span className="text-[10px] font-medium text-text-primary truncate">{task.name}</span>
            </div>
          </div>
        )
      )}
    </div>
  );
}
