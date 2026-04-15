/**
 * ProjectGanttChart - Displays all projects in an interactive Gantt chart
 * Refactored to use vis-timeline library for improved performance and features
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card, Button, Select, Space, Input, Tag, message } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  CalendarOutlined,
  FilterOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { VisTimelineWrapper, type VisTimelineItem } from './VisTimelineWrapper';
import {
  projectsToTimelineItems,
  portfoliosToGroups,
  timelineItemToProjectUpdate,
  calculateDateRange,
} from './timeline-adapter';
import type { TimelineOptions } from 'vis-timeline/types';
import type { Project, WorkItem } from '@/shared/types';

interface ProjectGanttChartProps {
  projects: Project[];
  workItems?: WorkItem[];
  portfolios?: Array<{ id: number; name: string }>;
  loading?: boolean;
  onProjectClick?: (project: Project) => void;
  onProjectUpdate?: (projectId: number, updates: Partial<Project>) => void;
  onExport?: () => void;
}

export function ProjectGanttChart({
  projects,
  workItems = [],
  portfolios = [],
  loading = false,
  onProjectClick,
  onProjectUpdate,
  onExport,
}: ProjectGanttChartProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewScale, setViewScale] = useState<'day' | 'week' | 'month'>('month');

  // Filter projects based on search and status
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = !searchQuery ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.owner?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  // Convert projects to vis-timeline items
  const timelineItems = useMemo(() => {
    return projectsToTimelineItems(filteredProjects);
  }, [filteredProjects]);

  // Create groups from portfolios
  const timelineGroups = useMemo(() => {
    return portfolios.length > 0 ? portfoliosToGroups(portfolios) : undefined;
  }, [portfolios]);

  // Calculate date range for initial view
  const dateRange = useMemo(() => {
    return calculateDateRange(filteredProjects);
  }, [filteredProjects]);

  // vis-timeline options
  const timelineOptions: TimelineOptions = useMemo(() => ({
    editable: {
      updateTime: true,
      updateGroup: portfolios.length > 0,
      add: false,
      remove: false,
    },
    groupOrder: 'content',
    stack: false,
    orientation: 'top',
    start: dateRange.start,
    end: dateRange.end,
    zoomMin: 86400000, // 1 day
    zoomMax: 31536000000 * 2, // 2 years
    margin: {
      item: {
        horizontal: 10,
        vertical: 5,
      },
      axis: 5,
    },
    height: '100%',
    moment: (date: Date) => {
      // Format dates based on view scale
      return date;
    },
  }), [dateRange, portfolios.length]);

  // Handle item click
  const handleItemClick = useCallback((item: VisTimelineItem) => {
    const project = projects.find(p => p.id === Number(item.id));
    if (project && onProjectClick) {
      onProjectClick(project);
    }
  }, [projects, onProjectClick]);

  // Handle item double-click
  const handleItemDoubleClick = useCallback((item: VisTimelineItem) => {
    const project = projects.find(p => p.id === Number(item.id));
    if (project) {
      message.info(`Opening project: ${project.name}`);
      if (onProjectClick) {
        onProjectClick(project);
      }
    }
  }, [projects, onProjectClick]);

  // Handle item update (drag to change dates/portfolio)
  const handleItemUpdate = useCallback((
    item: VisTimelineItem,
    callback: (item: VisTimelineItem | null) => void
  ) => {
    const projectId = Number(item.id);
    const updates = timelineItemToProjectUpdate(item);

    if (onProjectUpdate) {
      onProjectUpdate(projectId, updates);
      message.success('Project dates updated');
      callback(item); // Accept the change
    } else {
      console.log('Project update:', projectId, updates);
      callback(item); // Accept the change
    }
  }, [onProjectUpdate]);

  // Handle CSV export
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      // Default export implementation
      const csvContent = [
        ['Project Name', 'Status', 'Owner', 'Start Date', 'End Date', 'Portfolio'].join(','),
        ...filteredProjects.map(p => [
          `"${p.name}"`,
          p.status,
          p.owner || '',
          p.start_date || '',
          p.end_date || '',
          portfolios.find(port => port.id === p.portfolio_id)?.name || 'Unassigned',
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projects-timeline-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('Timeline exported to CSV');
    }
  };

  return (
    <Card
      className="h-full flex flex-col"
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 } }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <Space size="middle">
          <span className="text-base font-semibold">Project Timeline</span>
          <Tag color="blue">{filteredProjects.length} projects</Tag>
        </Space>

        <Space size="middle">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 140 }}
            size="small"
            options={[
              { label: 'All Statuses', value: 'all' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Not Started', value: 'not_started' },
              { label: 'Blocked', value: 'blocked' },
              { label: 'Done', value: 'done' },
            ]}
          />

          {/* Search */}
          <Input
            placeholder="Search projects..."
            prefix={<FilterOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ width: 200 }}
            size="small"
          />

          {/* View Scale */}
          <Select
            value={viewScale}
            onChange={setViewScale}
            style={{ width: 100 }}
            size="small"
            options={[
              { label: 'Day', value: 'day' },
              { label: 'Week', value: 'week' },
              { label: 'Month', value: 'month' },
            ]}
          />

          {/* Today Button */}
          <Button
            icon={<CalendarOutlined />}
            size="small"
            onClick={() => {
              // vis-timeline doesn't expose moveTo easily from wrapper
              // Could be implemented with ref to timeline instance
              message.info('Navigate to today');
            }}
          >
            Today
          </Button>

          {/* Export Button */}
          <Button
            icon={<DownloadOutlined />}
            size="small"
            onClick={handleExport}
          >
            Export CSV
          </Button>
        </Space>
      </div>

      {/* Timeline */}
      <div className="flex-1 relative" style={{ minHeight: 400 }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-sm text-gray-500">Loading projects...</div>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <CalendarOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
              <div className="mt-4 text-gray-500">No projects to display</div>
              <div className="mt-2 text-sm text-gray-400">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create a project to get started'
                }
              </div>
            </div>
          </div>
        ) : (
          <VisTimelineWrapper
            items={timelineItems}
            groups={timelineGroups}
            options={timelineOptions}
            onItemClick={handleItemClick}
            onItemDoubleClick={handleItemDoubleClick}
            onItemUpdate={handleItemUpdate}
            className={loading ? 'loading' : ''}
          />
        )}
      </div>

      {/* Footer with legend */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <Space size="large" className="text-xs">
          <span className="text-gray-500">Legend:</span>
          <Space size="small">
            <div className="w-4 h-2 bg-green-100 border border-green-500 rounded"></div>
            <span className="text-gray-600">Done</span>
          </Space>
          <Space size="small">
            <div className="w-4 h-2 bg-blue-100 border border-blue-500 rounded"></div>
            <span className="text-gray-600">In Progress</span>
          </Space>
          <Space size="small">
            <div className="w-4 h-2 bg-red-100 border border-red-500 rounded" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255, 77, 79, 0.2) 4px, rgba(255, 77, 79, 0.2) 8px)'
            }}></div>
            <span className="text-gray-600">Blocked</span>
          </Space>
          <Space size="small">
            <div className="w-4 h-2 bg-gray-100 border border-gray-300 rounded"></div>
            <span className="text-gray-600">Not Started</span>
          </Space>
          <span className="text-gray-400 ml-4">
            • Drag bars to change dates • Double-click to open project
          </span>
        </Space>
      </div>
    </Card>
  );
}
