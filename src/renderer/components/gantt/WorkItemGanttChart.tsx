/**
 * WorkItemGanttChart - Displays work items for a specific project
 * Refactored to use vis-timeline library for improved performance
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card, Button, Space, Typography, Breadcrumb, Tag, Select, Progress, message } from 'antd';
import {
  HomeOutlined,
  ProjectOutlined,
  CalendarOutlined,
  FilterOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { VisTimelineWrapper, type VisTimelineItem } from './VisTimelineWrapper';
import {
  workItemsToTimelineItems,
  workItemsToGroups,
  timelineItemToWorkItemUpdate,
  calculateDateRange,
} from './timeline-adapter';
import type { TimelineOptions } from 'vis-timeline/types';
import type { Project, WorkItem } from '@/shared/types';

const { Text, Title } = Typography;

interface WorkItemGanttChartProps {
  project: Project;
  workItems: WorkItem[];
  loading?: boolean;
  onBack: () => void;
  onWorkItemClick?: (workItem: WorkItem) => void;
  onWorkItemUpdate?: (workItemId: number, updates: Partial<WorkItem>) => void;
  onExport?: () => void;
}

export function WorkItemGanttChart({
  project,
  workItems,
  loading = false,
  onBack,
  onWorkItemClick,
  onWorkItemUpdate,
  onExport,
}: WorkItemGanttChartProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showHierarchy, setShowHierarchy] = useState(true);

  // Filter work items by project
  const projectWorkItems = useMemo(() => {
    return workItems.filter(w => w.project_id === project.id);
  }, [workItems, project.id]);

  // Apply status and type filters
  const filteredWorkItems = useMemo(() => {
    return projectWorkItems.filter(item => {
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (filterType !== 'all' && item.type !== filterType) return false;
      return true;
    });
  }, [projectWorkItems, filterStatus, filterType]);

  // Calculate statistics
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    projectWorkItems.forEach(item => {
      byType[item.type] = (byType[item.type] || 0) + 1;
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    });

    return {
      total: projectWorkItems.length,
      done: byStatus.done || 0,
      in_progress: byStatus.in_progress || 0,
      blocked: byStatus.blocked || 0,
      byType,
      byStatus,
    };
  }, [projectWorkItems]);

  // Convert to vis-timeline items
  const timelineItems = useMemo(() => {
    return workItemsToTimelineItems(filteredWorkItems);
  }, [filteredWorkItems]);

  // Create groups if showing hierarchy
  const timelineGroups = useMemo(() => {
    return showHierarchy ? workItemsToGroups(filteredWorkItems) : undefined;
  }, [filteredWorkItems, showHierarchy]);

  // Calculate date range
  const dateRange = useMemo(() => {
    return calculateDateRange(filteredWorkItems.length > 0 ? filteredWorkItems : [project]);
  }, [filteredWorkItems, project]);

  // vis-timeline options
  const timelineOptions: TimelineOptions = useMemo(() => ({
    editable: {
      updateTime: true,
      updateGroup: false,
      add: false,
      remove: false,
    },
    stack: true,
    orientation: 'top',
    start: dateRange.start,
    end: dateRange.end,
    zoomMin: 86400000, // 1 day
    zoomMax: 31536000000, // 1 year
    margin: {
      item: {
        horizontal: 5,
        vertical: 3,
      },
      axis: 5,
    },
    height: '100%',
  }), [dateRange]);

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(projectWorkItems.map(item => item.status)));
  }, [projectWorkItems]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(projectWorkItems.map(item => item.type)));
  }, [projectWorkItems]);

  // Event handlers
  const handleItemClick = useCallback((item: VisTimelineItem) => {
    const workItem = workItems.find(w => w.id === Number(item.id));
    if (workItem && onWorkItemClick) {
      onWorkItemClick(workItem);
    }
  }, [workItems, onWorkItemClick]);

  const handleItemDoubleClick = useCallback((item: VisTimelineItem) => {
    const workItem = workItems.find(w => w.id === Number(item.id));
    if (workItem) {
      message.info(`Opening work item: ${workItem.title}`);
      if (onWorkItemClick) {
        onWorkItemClick(workItem);
      }
    }
  }, [workItems, onWorkItemClick]);

  const handleItemUpdate = useCallback((
    item: VisTimelineItem,
    callback: (item: VisTimelineItem | null) => void
  ) => {
    const workItemId = Number(item.id);
    const updates = timelineItemToWorkItemUpdate(item);

    if (onWorkItemUpdate) {
      onWorkItemUpdate(workItemId, updates);
      message.success('Work item dates updated');
      callback(item);
    } else {
      console.log('Work item update:', workItemId, updates);
      callback(item);
    }
  }, [onWorkItemUpdate]);

  // Export handler
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      // Default CSV export
      const csvContent = [
        ['Type', 'Title', 'Status', 'Start Date', 'End Date', 'Notes'].join(','),
        ...filteredWorkItems.map(item => [
          item.type,
          `"${item.title}"`,
          item.status,
          item.start_date || '',
          item.end_date || '',
          item.notes ? `"${item.notes.replace(/"/g, '""')}"` : '',
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}-workitems-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('Work items exported to CSV');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Breadcrumb */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <Breadcrumb className="mb-2">
          <Breadcrumb.Item onClick={onBack} className="cursor-pointer hover:text-blue-500">
            <HomeOutlined /> Portfolio
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <ProjectOutlined /> {project.name}
          </Breadcrumb.Item>
        </Breadcrumb>
        <div className="flex items-center justify-between">
          <div>
            <Title level={4} className="mb-1">
              {project.name}
            </Title>
            <Space size="large" className="text-sm">
              <Text>
                <strong>{stats.total}</strong> work items
              </Text>
              <Text type="success">
                <strong>{stats.done}</strong> done
              </Text>
              <Text className="text-blue-600">
                <strong>{stats.in_progress}</strong> in progress
              </Text>
              {stats.blocked > 0 && (
                <Text type="danger">
                  <strong>{stats.blocked}</strong> blocked
                </Text>
              )}
            </Space>
          </div>
          {project.end_date && (
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Project Progress</div>
              <Progress
                percent={stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}
                size="small"
                style={{ width: 200 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <Card
        className="flex-1 flex flex-col"
        styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 } }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <Space size="middle">
            <Button icon={<HomeOutlined />} onClick={onBack}>
              Back
            </Button>
            <Tag color="blue">{filteredWorkItems.length} items</Tag>
          </Space>

          <Space size="middle">
            {/* Status Filter */}
            <Select
              placeholder="Filter by status"
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 150 }}
              size="small"
              options={[
                { label: 'All Statuses', value: 'all' },
                ...uniqueStatuses.map(s => ({
                  label: s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' '),
                  value: s
                })),
              ]}
            />

            {/* Type Filter */}
            <Select
              placeholder="Filter by type"
              value={filterType}
              onChange={setFilterType}
              style={{ width: 150 }}
              size="small"
              options={[
                { label: 'All Types', value: 'all' },
                ...uniqueTypes.map(t => ({
                  label: t.charAt(0).toUpperCase() + t.slice(1),
                  value: t
                })),
              ]}
            />

            {/* Hierarchy Toggle */}
            <Select
              value={showHierarchy ? 'hierarchy' : 'flat'}
              onChange={(v) => setShowHierarchy(v === 'hierarchy')}
              style={{ width: 120 }}
              size="small"
              options={[
                { label: 'Flat View', value: 'flat' },
                { label: 'Hierarchy', value: 'hierarchy' },
              ]}
            />

            {/* Today Button */}
            <Button
              icon={<CalendarOutlined />}
              size="small"
              onClick={() => message.info('Navigate to today')}
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
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <div className="text-sm text-gray-500">Loading work items...</div>
              </div>
            </div>
          ) : filteredWorkItems.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <CalendarOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <div className="mt-4 text-gray-500">No work items to display</div>
                <div className="mt-2 text-sm text-gray-400">
                  {filterStatus !== 'all' || filterType !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Add work items to this project to get started'
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

        {/* Footer with legend and stats */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <Space size="large" className="text-xs">
              <span className="text-gray-500">Type Legend:</span>
              <Space size="small">
                <div className="w-4 h-2 bg-blue-100 border border-blue-500 rounded"></div>
                <span className="text-gray-600">Task</span>
              </Space>
              <Space size="small">
                <div className="w-4 h-2 bg-red-100 border border-red-500 rounded"></div>
                <span className="text-gray-600">Issue</span>
              </Space>
              <Space size="small">
                <div className="w-2 h-2 bg-purple-500 border border-purple-700 rounded-sm transform rotate-45"></div>
                <span className="text-gray-600 ml-1">Milestone</span>
              </Space>
              <Space size="small">
                <div className="w-4 h-2 border-2 border-green-500 border-dashed rounded"></div>
                <span className="text-gray-600">Phase</span>
              </Space>
            </Space>
            <span className="text-xs text-gray-400">
              • Drag to change dates • Double-click to open • Ctrl+Scroll to zoom
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
