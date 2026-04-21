/**
 * Main Gantt Chart Component
 * Interactive timeline with zoom controls
 */

import React, { useState } from 'react';
import { Card, Button, Space, Radio, Tooltip, Typography } from 'antd';
import { ZoomIn, ZoomOut, RotateCcw, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { TimelineHeader } from './TimelineHeader';
import { TimelineGrid } from './TimelineGrid';
import { GanttRow } from './GanttRow';
import { getDateRangeForView, getTotalDays } from '@/lib/gantt-utils';
import type {
  GanttChartData,
  GanttConfig,
  GanttViewMode,
  GanttGroup,
} from '@/types/gantt';
import { DEFAULT_GANTT_CONFIG } from '@/types/gantt';

const { Text } = Typography;

interface GanttChartProps {
  data: GanttChartData;
  config?: Partial<GanttConfig>;
  onBarClick?: (bar: any) => void;
  onExport?: () => void;
}

export function GanttChart({ data, config: userConfig, onBarClick, onExport }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<GanttViewMode>('month');
  const [zoom, setZoom] = useState(1);
  const [expandedGroups, setExpandedGroups] = useState<Set<string | number>>(new Set());

  const config = { ...DEFAULT_GANTT_CONFIG, ...userConfig };
  const dayWidth = config.dayWidth * zoom;

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.5));
  const handleResetZoom = () => setZoom(1);

  const handleToggleExpand = (groupId: string | number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

  // Calculate total rows (groups + expanded bars)
  const totalRows = data.groups.reduce((acc, group) => {
    const isExpanded = expandedGroups.has(group.id) || group.expanded !== false;
    return acc + 1 + (isExpanded ? group.bars.length : 0);
  }, 0);

  // Calculate timeline width
  const totalDays = getTotalDays(data.dateRange);
  const timelineWidth = (totalDays + 1) * dayWidth;

  // Prepare groups with expanded state
  const groupsWithExpansion = data.groups.map((group) => ({
    ...group,
    expanded: expandedGroups.has(group.id) || group.expanded !== false,
  }));

  return (
    <Card
      className="w-full"
      bodyStyle={{ padding: 0 }}
      extra={
        <Space size="middle">
          {/* View Mode Selector */}
          <Radio.Group
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            size="small"
          >
            <Radio.Button value="day">Day</Radio.Button>
            <Radio.Button value="week">Week</Radio.Button>
            <Radio.Button value="month">Month</Radio.Button>
            <Radio.Button value="quarter">Quarter</Radio.Button>
          </Radio.Group>

          {/* Zoom Controls */}
          <Space size="small">
            <Tooltip title="Zoom Out">
              <Button
                type="text"
                size="small"
                icon={<ZoomOut className="h-4 w-4" />}
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
              />
            </Tooltip>
            <Text className="text-xs text-theme-secondary w-12 text-center">
              {Math.round(zoom * 100)}%
            </Text>
            <Tooltip title="Zoom In">
              <Button
                type="text"
                size="small"
                icon={<ZoomIn className="h-4 w-4" />}
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              />
            </Tooltip>
            <Tooltip title="Reset Zoom">
              <Button
                type="text"
                size="small"
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={handleResetZoom}
              />
            </Tooltip>
          </Space>

          {/* Export Button */}
          {onExport && (
            <Tooltip title="Export">
              <Button
                type="text"
                size="small"
                icon={<Download className="h-4 w-4" />}
                onClick={handleExport}
              />
            </Tooltip>
          )}
        </Space>
      }
    >
      {/* Gantt Chart Container */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div
          className="relative"
          style={{
            marginLeft: '280px', // Left panel width
            width: `calc(100% - 280px)`,
          }}
        >
          <TimelineHeader
            dateRange={data.dateRange}
            viewMode={viewMode}
            dayWidth={dayWidth}
          />
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Row Labels */}
          <div
            className="flex-shrink-0 bg-theme-layout border-r border-theme-border overflow-hidden"
            style={{ width: '280px' }}
          >
            {groupsWithExpansion.map((group, groupIndex) => {
              const isExpanded = group.expanded;
              const rowTop = calculateRowTop(
                groupsWithExpansion.slice(0, groupIndex),
                config.rowHeight
              );

              return (
                <div
                  key={group.id}
                  className="absolute left-0 right-0 border-b border-theme-border/20 hover:bg-theme-bg-spotlight/30 transition-colors"
                  style={{
                    top: `${rowTop}px`,
                    height: `${config.rowHeight}px`,
                  }}
                >
                  <div className="flex items-center h-full px-4">
                    <div
                      className="flex items-center justify-center w-6 cursor-pointer text-theme-secondary hover:text-theme-text"
                      onClick={() => handleToggleExpand(group.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text ellipsis={{ tooltip: group.name }} className="font-medium text-sm">
                        {group.name}
                      </Text>
                      <Text type="secondary" className="ml-2 text-xs">
                        ({group.bars.length})
                      </Text>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Panel - Timeline */}
          <div className="flex-1 overflow-auto">
            <div
              className="relative"
              style={{ width: `${timelineWidth}px`, height: `${totalRows * config.rowHeight}px` }}
            >
              {/* Grid Background */}
              <TimelineGrid
                dateRange={data.dateRange}
                dayWidth={dayWidth}
                rowHeight={config.rowHeight}
                totalRows={totalRows}
              />

              {/* Bars */}
              {groupsWithExpansion.map((group, groupIndex) => {
                const baseRowTop = calculateRowTop(
                  groupsWithExpansion.slice(0, groupIndex),
                  config.rowHeight
                );
                const relativeRowIndex = Math.floor(baseRowTop / config.rowHeight);

                return group.bars.map((bar, barIndex) => (
                  <GanttBar
                    key={bar.id}
                    bar={bar}
                    dateRange={data.dateRange}
                    dayWidth={dayWidth}
                    barHeight={config.barHeight}
                    rowIndex={relativeRowIndex + barIndex + 1}
                    rowHeight={config.rowHeight}
                    onClick={onBarClick}
                  />
                ));
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function calculateRowTop(groups: GanttGroup[], rowHeight: number): number {
  return groups.reduce((acc, group) => {
    const isExpanded = group.expanded !== false;
    return acc + rowHeight + (isExpanded ? group.bars.length * rowHeight : 0);
  }, 0);
}
