/**
 * Gantt Row Component
 * Renders a single row in the timeline
 */

import React from 'react';
import { Typography } from 'antd';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { GanttBar } from './GanttBar';
import type { GanttGroup, GanttDateRange } from '@/types/gantt';

const { Text } = Typography;

interface GanttRowProps {
  group: GanttGroup;
  dateRange: GanttDateRange;
  dayWidth: number;
  barHeight: number;
  rowHeight: number;
  rowIndex: number;
  onToggleExpand?: (groupId: string | number) => void;
  onBarClick?: (bar: any) => void;
}

export function GanttRow({
  group,
  dateRange,
  dayWidth,
  barHeight,
  rowHeight,
  rowIndex,
  onToggleExpand,
  onBarClick,
}: GanttRowProps) {
  const rowTop = rowIndex * rowHeight;

  return (
    <>
      {/* Group Header Row */}
      <div
        className="absolute left-0 right-0 flex items-center border-b border-theme-border/20 bg-theme-bg-container hover:bg-theme-bg-spotlight/30 transition-colors"
        style={{
          top: `${rowTop}px`,
          height: `${rowHeight}px`,
        }}
      >
        {/* Toggle Button */}
        <div
          className="flex items-center justify-center w-8 cursor-pointer text-theme-secondary hover:text-theme-text"
          style={{ paddingLeft: '8px' }}
          onClick={() => onToggleExpand?.(group.id)}
        >
          {group.expanded !== false ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>

        {/* Group Name */}
        <div className="flex-1 min-w-0">
          <Text ellipsis={{ tooltip: group.name }} className="font-medium text-sm">
            {group.name}
          </Text>
          <Text type="secondary" className="ml-2 text-xs">
            ({group.bars.length} items)
          </Text>
        </div>
      </div>

      {/* Bars */}
      {group.expanded !== false &&
        group.bars.map((bar, barIndex) => (
          <GanttBar
            key={bar.id}
            bar={bar}
            dateRange={dateRange}
            dayWidth={dayWidth}
            barHeight={barHeight}
            rowIndex={rowIndex + barIndex + 1}
            rowHeight={rowHeight}
            onClick={onBarClick}
          />
        ))}
    </>
  );
}
