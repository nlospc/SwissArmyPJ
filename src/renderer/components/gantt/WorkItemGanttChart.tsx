/**
 * WorkItemGanttChart - Displays work items for a specific project
 * Second level view: Shows all work items within a project
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Button, Space, Typography, Breadcrumb, Tag, Select, Input, Progress } from 'antd';
import {
  HomeOutlined,
  ProjectOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { TimelineProvider, useTimeline, type TimeScale } from './TimelineProvider';
import { generateHeaderColumns, generateGridLines, getTimelineWidth } from './timeline-utils';
import { GanttBar, type GanttBarItem } from './GanttBar';
import type { Project, WorkItem } from '@/shared/types';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface WorkItemGanttChartProps {
  project: Project;
  workItems: WorkItem[];
  viewMode?: TimeScale;
  loading?: boolean;
  onBack: () => void;
  onWorkItemClick?: (workItem: WorkItem) => void;
}

export function WorkItemGanttChart({
  project,
  workItems,
  viewMode = 'month',
  loading,
  onBack,
  onWorkItemClick,
}: WorkItemGanttChartProps) {
  // Convert work items to Gantt bar items
  const ganttItems = useMemo(() => {
    return workItems
      .filter((w) => w.project_id === project.id)
      .map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        status: item.status,
        startDate: item.start_date ? dayjs(item.start_date) : null,
        endDate: item.end_date ? dayjs(item.end_date) : null,
        assignee: item.owner,
        progress: item.progress,
        isMilestone: item.type === 'Milestone',
      } as GanttBarItem))
      .sort((a, b) => {
        // Sort by start date, then by type (Milestones first)
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        const dateDiff = a.startDate.diff(b.startDate);
        if (dateDiff !== 0) return dateDiff;
        return a.isMilestone ? -1 : b.isMilestone ? 1 : 0;
      });
  }, [workItems, project.id]);

  // Group work items by type for statistics
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    workItems.forEach((item) => {
      byType[item.type] = (byType[item.type] || 0) + 1;
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    });

    return { byType, byStatus, total: workItems.length };
  }, [workItems]);

  return (
    <TimelineProvider initialScale={viewMode}>
      <WorkItemGanttChartContent
        project={project}
        ganttItems={ganttItems}
        workItems={workItems}
        stats={stats}
        loading={loading}
        onBack={onBack}
        onWorkItemClick={onWorkItemClick}
      />
    </TimelineProvider>
  );
}

interface WorkItemGanttChartContentProps {
  project: Project;
  ganttItems: GanttBarItem[];
  workItems: WorkItem[];
  stats: { byType: Record<string, number>; byStatus: Record<string, number>; total: number };
  loading?: boolean;
  onBack: () => void;
  onWorkItemClick?: (workItem: WorkItem) => void;
}

const WorkItemGanttChartContent: React.FC<WorkItemGanttChartContentProps> = ({
  project,
  ganttItems,
  workItems,
  stats,
  loading,
  onBack,
  onWorkItemClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const {
    viewStart,
    viewEnd,
    columnWidth,
    scale,
    setScale,
    zoomIn,
    zoomOut,
    panLeft,
    panRight,
    goToday,
  } = useTimeline();

  // Apply filters
  const filteredItems = useMemo(() => {
    return ganttItems.filter((item) => {
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (filterType !== 'all' && item.type !== filterType) return false;
      return true;
    });
  }, [ganttItems, filterStatus, filterType]);

  const headerColumns = useMemo(
    () => generateHeaderColumns(viewStart, viewEnd, scale),
    [viewStart, viewEnd, scale]
  );

  const gridLines = useMemo(
    () => generateGridLines(viewStart, viewEnd, scale, columnWidth),
    [viewStart, viewEnd, scale, columnWidth]
  );

  const totalTimelineWidth = useMemo(
    () => getTimelineWidth(viewStart, viewEnd, columnWidth, scale),
    [viewStart, viewEnd, columnWidth, scale]
  );

  const rowHeight = 48;
  const headerHeight = 60;
  const tableWidth = 500; // Wider table for work item details
  const timelineHeight = filteredItems.length * rowHeight + headerHeight;

  const handleItemClick = (item: GanttBarItem) => {
    setSelectedId(item.id);
    const workItem = workItems.find((w) => w.id === item.id);
    if (workItem && onWorkItemClick) {
      onWorkItemClick(workItem);
    }
  };

  // Get unique statuses and types for filters
  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(ganttItems.map((item) => item.status)));
  }, [ganttItems]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(ganttItems.map((item) => item.type)));
  }, [ganttItems]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with Breadcrumb */}
      <div className="border-b border-theme-border bg-theme-bg-container px-6 py-4">
        <Breadcrumb className="mb-2">
          <Breadcrumb.Item>
            <HomeOutlined /> Portfolio
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <ProjectOutlined /> {project.name}
          </Breadcrumb.Item>
        </Breadcrumb>
        <Title level={4} className="mb-2">
          {project.name}
        </Title>
        <Space size="large">
          <Text>
            {stats.total} Work Items | {stats.byStatus.Done || 0} Done | {stats.byStatus['In Progress'] || 0} In Progress
          </Text>
          {project.progress !== undefined && (
            <Progress percent={project.progress} size="small" style={{ width: 200 }} />
          )}
        </Space>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-theme-border">
        <Space>
          <Button icon={<HomeOutlined />} onClick={onBack}>
            Back to Portfolio
          </Button>
          <Select
            value={scale}
            onChange={setScale}
            style={{ width: 100 }}
            options={[
              { label: 'Day', value: 'day' },
              { label: 'Week', value: 'week' },
              { label: 'Month', value: 'month' },
              { label: 'Quarter', value: 'quarter' },
            ]}
          />
        </Space>

        <Space>
          <Select
            placeholder="Filter by status"
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 150 }}
            allowClear
            options={[
              { label: 'All Statuses', value: 'all' },
              ...uniqueStatuses.map((s) => ({ label: s, value: s })),
            ]}
          />
          <Select
            placeholder="Filter by type"
            value={filterType}
            onChange={setFilterType}
            style={{ width: 150 }}
            allowClear
            options={[
              { label: 'All Types', value: 'all' },
              ...uniqueTypes.map((t) => ({ label: t, value: t })),
            ]}
          />
        </Space>

        <Space>
          <Button icon={<ZoomOutOutlined />} onClick={zoomOut} />
          <Button icon={<ZoomInOutlined />} onClick={zoomIn} />
          <Button icon={<LeftOutlined />} onClick={panLeft} />
          <Button icon={<RightOutlined />} onClick={panRight} />
          <Button icon={<CalendarOutlined />} onClick={goToday}>
            Today
          </Button>
        </Space>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1 overflow-auto">
        <div className="relative" style={{ width: tableWidth + totalTimelineWidth }}>
          <svg
            ref={svgRef}
            width={tableWidth + totalTimelineWidth}
            height={timelineHeight}
            style={{ display: 'block' }}
          >
            {/* Background */}
            <rect x={0} y={0} width={tableWidth + totalTimelineWidth} height={timelineHeight} fill="#f5f5f5" />

            {/* Left Panel - Work Item Table */}
            <rect x={0} y={0} width={tableWidth} height={timelineHeight} fill="white" />
            <line x1={tableWidth} y1={0} x2={tableWidth} y2={timelineHeight} stroke="#d9d9d9" strokeWidth={1} />

            {/* Header background */}
            <rect x={0} y={0} width={tableWidth + totalTimelineWidth} height={headerHeight} fill="#fafafa" />
            <line x1={0} y1={headerHeight} x2={tableWidth + totalTimelineWidth} y2={headerHeight} stroke="#d9d9d9" strokeWidth={1} />

            {/* Table headers */}
            <text x={10} y={35} fontSize={14} fontWeight="bold" fill="#333">
              Work Item
            </text>
            <text x={350} y={35} fontSize={14} fontWeight="bold" fill="#333">
              Status
            </text>
            <text x={tableWidth + 10} y={35} fontSize={14} fontWeight="bold" fill="#333">
              Timeline
            </text>

            {/* Timeline header */}
            {headerColumns.map((col, index) => {
              const x = tableWidth + index * col.width;
              return (
                <g key={col.key}>
                  <rect x={x} y={0} width={col.width} height={headerHeight} fill={col.isWeekend ? '#f0f0f0' : 'white'} />
                  <text x={x + 5} y={35} fontSize={12} fill="#666">
                    {col.label}
                  </text>
                  <line x1={x} y1={0} x2={x} y2={timelineHeight} stroke="#f0f0f0" strokeWidth={1} />
                </g>
              );
            })}

            {/* Grid lines */}
            {gridLines.map((line, index) => {
              const x = tableWidth + line.x;
              return (
                <line
                  key={index}
                  x1={x}
                  y1={headerHeight}
                  x2={x}
                  y2={timelineHeight}
                  stroke={line.type === 'major' ? '#e8e8e8' : '#f5f5f5'}
                  strokeWidth={line.type === 'major' ? 1 : 0.5}
                />
              );
            })}

            {/* Row backgrounds */}
            {filteredItems.map((item, index) => {
              const y = headerHeight + index * rowHeight;
              return (
                <rect
                  key={item.id}
                  x={0}
                  y={y}
                  width={tableWidth + totalTimelineWidth}
                  height={rowHeight}
                  fill={selectedId === item.id ? '#e6f7ff' : index % 2 === 0 ? 'white' : '#fafafa'}
                />
              );
            })}

            {/* Work item rows */}
            {filteredItems.map((item, index) => {
              const y = headerHeight + index * rowHeight;
              const workItem = workItems.find((w) => w.id === item.id);

              // Status color for tag
              let statusColor = 'default';
              if (item.status === 'Done') statusColor = 'success';
              else if (item.status === 'In Progress') statusColor = 'processing';
              else if (item.status === 'Blocked') statusColor = 'error';
              else if (item.status === 'In Review' || item.status === 'In Test') statusColor = 'warning';

              return (
                <g key={item.id} onClick={() => handleItemClick(item)} style={{ cursor: 'pointer' }}>
                  {/* Type icon */}
                  <text x={10} y={y + 20} fontSize={16}>
                    {item.isMilestone ? '◆' : item.type === 'Story' ? '📖' : item.type === 'Bug' ? '🐛' : item.type === 'Spike' ? '🔬' : '📝'}
                  </text>

                  {/* Work item name */}
                  <text x={35} y={y + 20} fontSize={13} fontWeight="500" fill="#333">
                    {item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name}
                  </text>

                  {/* Assignee */}
                  {item.assignee && (
                    <text x={35} y={y + 38} fontSize={11} fill="#999">
                      👤 {item.assignee}
                    </text>
                  )}

                  {/* Status tag */}
                  <foreignObject x={320} y={y + 12} width={100} height={24}>
                    <Tag color={statusColor} style={{ margin: 0, fontSize: 11 }}>
                      {item.status}
                    </Tag>
                  </foreignObject>
                </g>
              );
            })}

            {/* Gantt bars */}
            <g transform={`translate(0, ${headerHeight})`}>
              {filteredItems.map((item, index) => (
                <GanttBar
                  key={item.id}
                  item={item}
                  index={index}
                  rowHeight={rowHeight}
                  viewStart={viewStart}
                  onClick={handleItemClick}
                  selected={selectedId === item.id}
                />
              ))}
            </g>

            {/* Today marker */}
            {(() => {
              const today = dayjs();
              if (today.isAfter(viewStart) && today.isBefore(viewEnd)) {
                const pixelsPerDay = columnWidth / (scale === 'day' ? 1 : scale === 'week' ? 7 : scale === 'month' ? 30 : 90);
                const todayX = tableWidth + today.diff(viewStart, 'day') * pixelsPerDay;
                return (
                  <>
                    <line x1={todayX} y1={0} x2={todayX} y2={timelineHeight} stroke="#ff4d4f" strokeWidth={2} strokeDasharray="5,5" />
                    <rect x={todayX - 25} y={5} width={50} height={20} rx={4} fill="#ff4d4f" />
                    <text x={todayX} y={19} fontSize={11} fill="white" textAnchor="middle" fontWeight="bold">
                      TODAY
                    </text>
                  </>
                );
              }
              return null;
            })()}
          </svg>
        </div>

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Text type="secondary" className="text-lg">
              No work items found matching the current filters
            </Text>
            <Text type="secondary">
              Try adjusting your filter settings or add work items to this project
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};
