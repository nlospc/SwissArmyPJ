import { useMemo } from 'react';
import { generateTimeline, type RenderUnit } from '@/utils/date';

interface TimeHeaderProps {
  viewStart: Date;
  viewEnd: Date;
  renderUnit: RenderUnit;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
}

export function TimeHeader({ viewStart, viewEnd, renderUnit, onMouseDown, onDoubleClick }: TimeHeaderProps) {
  const timeline = useMemo(
    () => generateTimeline(viewStart, viewEnd, renderUnit),
    [viewStart, viewEnd, renderUnit]
  );

  return (
    <div
      className="sticky top-0 z-20 bg-white border-b border-border-light flex-shrink-0"
      style={{ height: 40 }}
    >
      <div
        className="flex min-w-max h-full select-none"
        style={{ cursor: 'grab' }}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
      >
        {timeline.map((item, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col justify-center items-center text-center border-r border-border-light last:border-r-0"
          >
            <div className="text-xs font-medium text-text-secondary leading-none">{item.label}</div>
            {item.subLabel && (
              <div className="text-[10px] text-text-tertiary leading-tight mt-0.5">{item.subLabel}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
