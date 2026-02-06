/**
 * ProjectGanttChart - Displays all projects in an interactive Gantt chart
 * First level view: Shows projects and their timelines
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Card, Toolbar, Button, Select, Space, Input, Tag, Typography } from 'antd';
import {
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

const { Text } = Typography;

interface ProjectGanttChartProps {
  projects: Project[];
  workItems: WorkItem[];
  viewMode?: TimeScale;
  loading?: boolean;
  onProjectClick?: (project: Project) => void;
  onWorkItemClick?: (workItem: WorkItem) => void;
}

export function ProjectGanttChart({
  projects,
  workItems,
  viewMode = 'month',
  loading,
  onProjectClick,
  onWorkItemClick,
}: ProjectGanttChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<GanttBarItem | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [itemStartX, setItemStartX] = useState<number>(0);

  // Convert projects to Gantt bar items
  const ganttItems = useMemo(() => {
    return projects.map((project) => {
      const projectItems = workItems.filter((w) => w.project_id === project.id);
      const startDate = projectItems.length > 0
        ? projectItems.reduce((min, item) =>
            item.start_date && (!min || dayjs(item.start_date).isBefore(dayjs(min)))
              ? item.start_date
              : min,
            null as string | null)
        : project.start_date;

      const endDate = projectItems.length > 0
        ? projectItems.reduce((max, item) =>
            item.end_date && (!max || dayjs(item.end_date).isAfter(dayjs(max)))
              ? item.end_date
              : max,
            null as string | null)
        : project.end_date;

      return {
        id: project.id,
        name: project.name,
        type: 'Project',
        status: project.status || 'Active',
        startDate: startDate ? dayjs(startDate) : null,
        endDate: endDate ? dayjs(endDate) : null,
        assignee: project.owner,
        progress: project.progress,
        isMilestone: false,
      } as GanttBarItem;
    });
  }, [projects, workItems]);

  const rowHeight = 48;
  const headerHeight = 60;
  const tableWidth = 400; // Width of left panel table
  const timelineHeight = ganttItems.length * rowHeight + headerHeight;

  return (
    <TimelineProvider initialScale={viewMode}>
      <ProjectGanttChartContent
        ref={svgRef}
        ganttItems={ganttItems}
        projects={projects}
        workItems={workItems}
        rowHeight={rowHeight}
        headerHeight={headerHeight}
        tableWidth={tableWidth}
        timelineHeight={timelineHeight}
        loading={loading}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        draggedItem={draggedItem}
        setDraggedItem={setDraggedItem}
        dragStartX={dragStartX}
        setDragStartX={setDragStartX}
        itemStartX={itemStartX}
        setItemStartX={setItemStartX}
        onProjectClick={onProjectClick}
        onWorkItemClick={onWorkItemClick}
      />
    </TimelineProvider>
  );
}

interface ProjectGanttChartContentProps {
  ganttItems: GanttBarItem[];
  projects: Project[];
  workItems: WorkItem[];
  rowHeight: number;
  headerHeight: number;
  tableWidth: number;
  timelineHeight: number;
  loading?: boolean;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  draggedItem: GanttBarItem | null;
  setDraggedItem: (item: GanttBarItem | null) => void;
  dragStartX: number;
  setDragStartX: (x: number) => void;
  itemStartX: number;
  setItemStartX: (x: number) => void;
  onProjectClick?: (project: Project) => void;
  onWorkItemClick?: (workItem: WorkItem) => void;
}

const ProjectGanttChartContent = React.forwardRef<SVGSVGElement, ProjectGanttChartContentProps>(
  (
    {
      ganttItems,
      projects,
      workItems,
      rowHeight,
      headerHeight,
      tableWidth,
      timelineHeight,
      loading,
      selectedId,
      setSelectedId,
      draggedItem,
      setDraggedItem,
      dragStartX,
      setDragStartX,
      itemStartX,
      setItemStartX,
      onProjectClick,
      onWorkItemClick,
    },
    ref
  ) => {
    const svgRef = React.useRef<SVGSVGElement>(null);
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

    // Handle drag start
    const handleDragStart = (item: GanttBarItem, event: React.MouseEvent) => {
      setDraggedItem(item);
      setDragStartX(event.clientX);
      setItemStartX(event.clientX);
    };

    // Handle mouse move during drag
    useEffect(() => {
      if (!draggedItem) return;

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - dragStartX;
        const svg = svgRef.current;
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        const timelineX = e.clientX - rect.left - tableWidth;

        // Calculate new start date based on drag position
        const daysPerPixel = 1 / columnWidth;
        const dayDelta = deltaX * daysPerPixel;

        // Update visual position during drag (visual feedback only)
        // Actual date update happens on drag end
      };

      const handleMouseUp = (e: MouseEvent) => {
        if (!draggedItem) return;

        const deltaX = e.clientX - dragStartX;
        const daysPerPixel = 1 / columnWidth;
        const dayDelta = Math.round(deltaX * daysPerPixel);

        if (dayDelta !== 0) {
          const newStartDate = draggedItem.startDate?.add(dayDelta, 'day');
          const endDateDays = draggedItem.endDate?.diff(draggedItem.startDate, 'day') || 0;
          const newEndDate = newStartDate?.add(endDateDays, 'day');

          // Update project dates
          const project = projects.find((p) => p.id === draggedItem.id);
          if (project && onProjectClick) {
            // Trigger project update with new dates
            console.log('Update project dates:', project.id, newStartDate, newEndDate);
          }
        }

        setDraggedItem(null);
        setDragStartX(0);
        setItemStartX(0);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [draggedItem, dragStartX, columnWidth, projects, onProjectClick]);

    const handleItemClick = (item: GanttBarItem) => {
      setSelectedId(item.id);
      const project = projects.find((p) => p.id === item.id);
      if (project && onProjectClick) {
        onProjectClick(project);
      }
    };

    return (
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-theme-border">
          <Space>
            <Text strong>Timeline</Text>
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
            <Button icon={<ZoomOutOutlined />} onClick={zoomOut} />
            <Button icon={<ZoomInOutlined />} onClick={zoomIn} />
            <Button icon={<LeftOutlined />} onClick={panLeft} />
            <Button icon={<RightOutlined />} onClick={panRight} />
            <Button icon={<CalendarOutlined />} onClick={goToday}>
              Today
            </Button>
          </Space>

          <Space>
            <Input placeholder="Search projects..." prefix={<FilterOutlined />} style={{ width: 200 }} />
          </Space>
        </div>

        {/* Gantt Chart */}
        <div className="flex-1 overflow-auto">
          <div className="relative" style={{ width: tableWidth + totalTimelineWidth }}>
            <svg
              ref={(node) => {
                svgRef.current = node;
                if (typeof ref === 'function') ref(node);
                else if (ref) ref.current = node;
              }}
              width={tableWidth + totalTimelineWidth}
              height={timelineHeight}
              style={{ display: 'block' }}
            >
              {/* Background */}
              <rect x={0} y={0} width={tableWidth + totalTimelineWidth} height={timelineHeight} fill="#f5f5f5" />

              {/* Left Panel - Project Table */}
              <rect x={0} y={0} width={tableWidth} height={timelineHeight} fill="white" />
              <line x1={tableWidth} y1={0} x2={tableWidth} y2={timelineHeight} stroke="#d9d9d9" strokeWidth={1} />

              {/* Header background */}
              <rect x={0} y={0} width={tableWidth + totalTimelineWidth} height={headerHeight} fill="#fafafa" />
              <line x1={0} y1={headerHeight} x2={tableWidth + totalTimelineWidth} y2={headerHeight} stroke="#d9d9d9" strokeWidth={1} />

              {/* Header columns */}
              <text x={10} y={35} fontSize={14} fontWeight="bold" fill="#333">
                Project Name
              </text>
              <text x={tableWidth + 10} y={35} fontSize={14} fontWeight="bold" fill="#333">
                {scale.charAt(0).toUpperCase() + scale.slice(1)} Timeline
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
              {ganttItems.map((item, index) => {
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

              {/* Project names */}
              {ganttItems.map((item, index) => {
                const y = headerHeight + index * rowHeight;
                const project = projects.find((p) => p.id === item.id);
                const itemCount = workItems.filter((w) => w.project_id === item.id).length;

                return (
                  <g key={item.id} onClick={() => handleItemClick(item)} style={{ cursor: 'pointer' }}>
                    <text x={10} y={y + rowHeight / 2 + 5} fontSize={13} fill="#333">
                      {item.name}
                    </text>
                    <text x={10} y={y + rowHeight / 2 + 22} fontSize={11} fill="#999">
                      {itemCount} items
                    </text>
                    <text x={tableWidth - 10} y={y + rowHeight / 2 + 5} fontSize={12} fill="#666" textAnchor="end">
                      {item.progress || 0}%
                    </text>
                    {item.progress !== undefined && item.progress > 0 && (
                      <rect
                        x={tableWidth - 60}
                        y={y + rowHeight / 2 + 10}
                        width={50}
                        height={4}
                        rx={2}
                        fill="#f0f0f0"
                      />
                    )}
                    {item.progress !== undefined && item.progress > 0 && (
                      <rect
                        x={tableWidth - 60}
                        y={y + rowHeight / 2 + 10}
                        width={(item.progress / 100) * 50}
                        height={4}
                        rx={2}
                        fill={item.progress >= 80 ? '#52c41a' : item.progress >= 50 ? '#1890ff' : '#faad14'}
                      />
                    )}
                  </g>
                );
              })}

              {/* Gantt bars */}
              <g transform={`translate(0, ${headerHeight})`}>
                {ganttItems.map((item, index) => (
                  <GanttBar
                    key={item.id}
                    item={item}
                    index={index}
                    rowHeight={rowHeight}
                    viewStart={viewStart}
                    onDragStart={handleDragStart}
                    onClick={handleItemClick}
                    selected={selectedId === item.id}
                  />
                ))}
              </g>

              {/* Today marker */}
              {(() => {
                const today = dayjs();
                if (today.isAfter(viewStart) && today.isBefore(viewEnd)) {
                  const todayX = tableWidth + ((today.diff(viewStart, 'day') * columnWidth) / (scale === 'day' ? 1 : scale === 'week' ? 7 : scale === 'month' ? 30 : 90));
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
        </div>
      </div>
    );
  }
);

ProjectGanttChartContent.displayName = 'ProjectGanttChartContent';
