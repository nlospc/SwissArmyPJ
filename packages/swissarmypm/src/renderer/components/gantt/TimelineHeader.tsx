/**
 * Timeline Header Component
 * Renders the date header for the Gantt chart
 */

import React from 'react';
import { generateDateHeaders } from '@/lib/gantt-utils';
import type { GanttDateRange, GanttViewMode } from '@/types/gantt';

interface TimelineHeaderProps {
  dateRange: GanttDateRange;
  viewMode: GanttViewMode;
  dayWidth: number;
}

export function TimelineHeader({ dateRange, viewMode, dayWidth }: TimelineHeaderProps) {
  const headers = generateDateHeaders(dateRange, viewMode);

  const getHeaderStyle = (index: number) => ({
    left: `${index * dayWidth}px`,
    width: `${dayWidth}px`,
  });

  return (
    <div className="relative border-b border-theme-border h-12 bg-theme-layout overflow-hidden">
      {headers.map((header, index) => (
        <div
          key={index}
          className="absolute top-0 bottom-0 flex items-center justify-center text-xs border-r border-theme-border/30"
          style={getHeaderStyle(index)}
        >
          <span
            className={`
              ${header.isToday ? 'font-bold text-primary' : 'text-theme-secondary'}
              ${header.isWeekend ? 'opacity-50' : ''}
            `}
          >
            {header.label}
          </span>
          {header.isToday && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </div>
      ))}
    </div>
  );
}
