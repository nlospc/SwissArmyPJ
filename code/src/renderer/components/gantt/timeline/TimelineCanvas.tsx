import type { WorkPackage, Dependency } from '@shared/types';
import type { RenderUnit } from '@/utils/date';
import { TimeHeader } from './TimeHeader';
import { TimeGrid } from './TimeGrid';
import { TodayMarker } from './TodayMarker';
import { TimelineRow } from './TimelineRow';
import { RelationLayer } from './RelationLayer';

interface TimelineCanvasProps {
  tasks: WorkPackage[];
  dependencies: Dependency[];
  viewStart: Date;
  viewEnd: Date;
  renderUnit: RenderUnit;
  selectedTaskId: number | null;
  draggingTaskId: number | null;
  onSelectTask: (id: number) => void;
  onBeginDrag: (task: WorkPackage, kind: 'move' | 'resize_start' | 'resize_end' | 'milestone_move', e: React.MouseEvent) => void;
  onPanStart: (e: React.MouseEvent) => void;
  onAutoZoom: () => void;
}

export function TimelineCanvas({
  tasks, dependencies, viewStart, viewEnd, renderUnit,
  selectedTaskId, draggingTaskId, onSelectTask, onBeginDrag,
  onPanStart, onAutoZoom,
}: TimelineCanvasProps) {
  const contentHeight = tasks.length * 34;

  return (
    <>
      <TimeHeader
        viewStart={viewStart}
        viewEnd={viewEnd}
        renderUnit={renderUnit}
        onMouseDown={onPanStart}
        onDoubleClick={onAutoZoom}
      />
      <div className="flex-1 overflow-auto relative">
        <TimeGrid viewStart={viewStart} viewEnd={viewEnd} renderUnit={renderUnit} height={contentHeight} />
        <TodayMarker viewStart={viewStart} viewEnd={viewEnd} />
        <RelationLayer
          dependencies={dependencies}
          workPackages={tasks}
          viewStart={viewStart}
          viewEnd={viewEnd}
          rowHeight={34}
        />
        {tasks.map((task) => (
          <TimelineRow
            key={task.id}
            task={task}
            viewStart={viewStart}
            viewEnd={viewEnd}
            isSelected={selectedTaskId === task.id}
            isDragging={draggingTaskId === task.id}
            onSelect={() => onSelectTask(task.id)}
            onBeginDrag={onBeginDrag}
          />
        ))}
      </div>
    </>
  );
}
