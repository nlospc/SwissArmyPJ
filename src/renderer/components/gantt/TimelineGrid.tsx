/**
 * Timeline Grid Component
 * Renders the background grid with weekend highlighting
 */

import React from 'react';
import { getTotalDays } from '@/lib/gantt-utils';
import type { GanttDateRange } from '@/types/gantt';

interface TimelineGridProps {
  dateRange: GanttDateRange;
  dayWidth: number;
  rowHeight: number;
  totalRows: number;
}

export function TimelineGrid({ dateRange, dayWidth, rowHeight, totalRows }: TimelineGridProps) {
  const totalDays = getTotalDays(dateRange);
  const gridHeight = totalRows * rowHeight;

  const getLineStyle = (index: number) => ({
    left: `${index * dayWidth}px`,
  });

  const getRowStyle = (index: number) => ({
    top: `${index * rowHeight}px`,
    height: `${rowHeight}px`,
  });

  const isWeekend = (dayIndex: number): boolean => {
    const date = new Date(dateRange.startDate);
    date.setDate(date.getDate() + dayIndex);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: `${gridHeight}px` }}
    >
      {/* Weekend backgrounds */}
      {Array.from({ length: totalDays + 1 }).map((_, index) => (
        <React.Fragment key={index}>
          {isWeekend(index) && (
            <div
              className="absolute top-0 bottom-0 bg-theme-bg-spotlight/30"
              style={{
                left: `${index * dayWidth}px`,
                width: `${dayWidth}px`,
              }}
            />
          )}
        </React.Fragment>
      ))}

      {/* Vertical lines */}
      {Array.from({ length: totalDays + 1 }).map((_, index) => (
        <div
          key={index}
          className="absolute top-0 bottom-0 border-r border-theme-border/20"
          style={getLineStyle(index)}
        />
      ))}

      {/* Horizontal lines */}
      {Array.from({ length: totalRows + 1 }).map((_, index) => (
        <div
          key={index}
          className="absolute left-0 right-0 border-b border-theme-border/20"
          style={getRowStyle(index)}
        />
      ))}

      {/* Today indicator line */}
      <TimelineTodayLine dateRange={dateRange} dayWidth={dayWidth} gridHeight={gridHeight} />
    </div>
  );
}

function TimelineTodayLine({
  dateRange,
  dayWidth,
  gridHeight,
}: {
  dateRange: GanttDateRange;
  dayWidth: number;
  gridHeight: number;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(dateRange.startDate);
  startDate.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));

  if (daysDiff < 0 || daysDiff > getTotalDays(dateRange)) {
    return null;
  }

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
      style={{
        left: `${daysDiff * dayWidth + dayWidth / 2}px`,
        height: `${gridHeight}px`,
      }}
    />
  );
}
