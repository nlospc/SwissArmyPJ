import { useMemo } from 'react';
import { generateTimeline, type RenderUnit } from '@/utils/date';

interface TimeGridProps {
  viewStart: Date;
  viewEnd: Date;
  renderUnit: RenderUnit;
  height: number;
}

export function TimeGrid({ viewStart, viewEnd, renderUnit, height }: TimeGridProps) {
  const timeline = useMemo(
    () => generateTimeline(viewStart, viewEnd, renderUnit),
    [viewStart, viewEnd, renderUnit]
  );

  const totalMs = viewEnd.getTime() - viewStart.getTime();
  if (totalMs <= 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ height }}>
      {timeline.map((item, i) => {
        const leftPct = ((item.start.getTime() - viewStart.getTime()) / totalMs) * 100;
        return (
          <div
            key={i}
            className="absolute top-0 bottom-0 border-l border-border-light/50"
            style={{ left: `${leftPct}%` }}
          />
        );
      })}
    </div>
  );
}
