/**
 * GanttBar - Renders a single timeline bar or milestone
 */

import React, { useMemo } from 'react';
import { Typography, Tooltip } from 'antd';
import { calculateBarPosition, getStatusColor, getItemIcon } from './timeline-utils';
import { useTimeline } from './TimelineProvider';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { TimeScale } from './TimelineProvider';

const { Text } = Typography;

export interface GanttBarItem {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  assignee?: string;
  progress?: number;
  isMilestone?: boolean;
}

interface GanttBarProps {
  item: GanttBarItem;
  index: number;
  rowHeight: number;
  viewStart: Dayjs;
  onDragStart?: (item: GanttBarItem, event: React.MouseEvent) => void;
  onDragEnd?: (item: GanttBarItem, newStartDate: Dayjs, newEndDate: Dayjs) => void;
  onClick?: (item: GanttBarItem) => void;
  selected?: boolean;
}

export function GanttBar({
  item,
  index,
  rowHeight,
  viewStart,
  onDragStart,
  onDragEnd,
  onClick,
  selected,
}: GanttBarProps) {
  const { columnWidth, scale } = useTimeline();

  const barPosition = useMemo(() => {
    return calculateBarPosition(item.startDate, item.endDate, viewStart, columnWidth, scale);
  }, [item.startDate, item.endDate, viewStart, columnWidth, scale]);

  if (!barPosition) {
    return null;
  }

  const { x, width } = barPosition;
  const color = getStatusColor(item.status);
  const icon = getItemIcon(item.type);
  const top = index * rowHeight + 8; // 8px padding top
  const height = rowHeight - 16; // 16px total padding

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(item);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDragStart?.(item, e);
  };

  if (item.isMilestone) {
    // Render as diamond marker
    return (
      <Tooltip
        title={
          <div>
            <div>{item.name}</div>
            <div>{icon} {item.type}</div>
            <div>Status: {item.status}</div>
            <div>Date: {item.startDate?.format('YYYY-MM-DD')}</div>
            {item.assignee && <div>Assignee: {item.assignee}</div>}
          </div>
        }
      >
        <g
          transform={`translate(${x + width / 2}, ${top + height / 2})`}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          style={{ cursor: 'pointer' }}
        >
          {/* Diamond shape */}
          <polygon
            points="0,-12 12,0 0,12 -12,0"
            fill={color}
            stroke={selected ? '#1890ff' : 'white'}
            strokeWidth={selected ? 3 : 2}
          />
          {/* Icon */}
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fontSize={12}
            fill="white"
            pointerEvents="none"
          >
            {icon}
          </text>
        </g>
      </Tooltip>
    );
  }

  // Render as bar
  const progressWidth = width * ((item.progress || 0) / 100);

  return (
    <Tooltip
      title={
        <div>
          <div>{item.name}</div>
          <div>{icon} {item.type}</div>
          <div>
            {item.startDate?.format('YYYY-MM-DD')} - {item.endDate?.format('YYYY-MM-DD')}
          </div>
          <div>Status: {item.status}</div>
          {item.assignee && <div>Assignee: {item.assignee}</div>}
          {item.progress !== undefined && <div>Progress: {item.progress}%</div>}
        </div>
      }
    >
      <g
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        style={{ cursor: 'pointer' }}
      >
        {/* Main bar background */}
        <rect
          x={x}
          y={top}
          width={width}
          height={height}
          rx={4}
          fill={color}
          fillOpacity={0.2}
          stroke={selected ? '#1890ff' : color}
          strokeWidth={selected ? 2 : 1}
        />

        {/* Progress bar */}
        {item.progress !== undefined && item.progress > 0 && (
          <rect
            x={x}
            y={top}
            width={progressWidth}
            height={height}
            rx={4}
            fill={color}
            fillOpacity={0.8}
          />
        )}

        {/* Bar label (if wide enough) */}
        {width > 60 && (
          <text
            x={x + 8}
            y={top + height / 2 + 4}
            fontSize={12}
            fill="white"
            pointerEvents="none"
          >
            {item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name}
          </text>
        )}

        {/* Status indicator dot */}
        <circle
          cx={x + width - 8}
          cy={top + height / 2}
          r={4}
          fill={color}
        />
      </g>
    </Tooltip>
  );
}
