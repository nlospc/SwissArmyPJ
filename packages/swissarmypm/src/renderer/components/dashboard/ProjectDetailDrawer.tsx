import React, { useEffect, useState, useMemo } from 'react';
import { Drawer, Tabs, Descriptions, Tag, Progress, Button, Space, Typography, Divider, Empty, Spin } from 'antd';
import { Project, WorkItem } from '@/shared/types';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { EditOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';

const { Title, Paragraph, Text } = Typography;

// Animation styles
const DRAWER_STYLES = {
  body: { padding: '24px' },
  mask: { backdropFilter: 'blur(2px)' },
};

const TAB_ANIMATION_CONFIG = {
  inkBar: {
    style: {
      transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)',
    },
  },
  tabPane: {
    transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)',
  },
};

interface ProjectDetailDrawerProps {
  project: Project | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: number) => void;
}

export function ProjectDetailDrawer({
  project,
  open,
  onClose,
  onEdit,
  onDelete,
}: ProjectDetailDrawerProps) {
  const { workItemsByProject, loadWorkItemsByProject } = useWorkItemStore();
  const { updateProject } = useProjectStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Animation states - MOVED UP before any early returns
  const [contentVisible, setContentVisible] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('overview');

  // Load work items when project changes
  useEffect(() => {
    if (project && open) {
      setLoading(true);
      loadWorkItemsByProject(project.id).finally(() => {
        setLoading(false);
      });
    }
  }, [project?.id, open, loadWorkItemsByProject]);

  // Animation effect - MOVED UP before any early returns
  useEffect(() => {
    if (open) {
      // Trigger content animation after drawer starts opening
      setContentVisible(false);
      const timer = setTimeout(() => setContentVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setContentVisible(false);
    }
  }, [open]);

  const workItems = project?.id ? workItemsByProject.get(project.id) || [] : [];

  // Calculate metrics from work items - keep hook order stable across renders
  const metrics = useMemo(() => {
    const totalTasks = workItems.length;
    const doneTasks = workItems.filter((item) => item.status === 'done').length;
    const blockedItems = workItems.filter((item) => item.status === 'blocked');
    const milestones = workItems.filter((item) => item.type === 'milestone');
    const issues = workItems.filter((item) => item.type === 'issue');

    return {
      totalTasks,
      doneTasks,
      progress: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      blockerCount: blockedItems.length,
      milestoneCount: milestones.length,
      issueCount: issues.length,
      nextMilestone: milestones
        .filter((m) => m.status !== 'done')
        .sort((a, b) => new Date(a.start_date || '').getTime() - new Date(b.start_date || '').getTime())[0],
    };
  }, [workItems]);

  // Early return AFTER hooks and derived state
  if (!project) {
    return null;
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      done: 'green',
      in_progress: 'blue',
      blocked: 'red',
      not_started: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const text: Record<string, string> = {
      done: 'Done',
      in_progress: 'In Progress',
      blocked: 'Blocked',
      not_started: 'Not Started',
    };
    return text[status] || status;
  };

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="metric-card bg-gray-50 dark:bg-gray-800 p-4 rounded-lg hover:shadow-md transition-shadow">
          <Text type="secondary">Progress</Text>
          <div className="mt-2">
            <Progress
              percent={metrics.progress}
              size="small"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              className="progress-bar-animated"
            />
            <Text className="text-xs">{metrics.doneTasks}/{metrics.totalTasks} tasks completed</Text>
          </div>
        </div>
        <div className="metric-card bg-gray-50 dark:bg-gray-800 p-4 rounded-lg hover:shadow-md transition-shadow">
          <Text type="secondary">Timeline</Text>
          <div className="mt-2">
            <Text strong>
              {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'} →{' '}
              {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}
            </Text>
          </div>
        </div>
      </div>

      {/* Project Description */}
      {project.description && (
        <div>
          <Title level={5}>Description</Title>
          <Paragraph>{project.description}</Paragraph>
        </div>
      )}

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div>
          <Title level={5}>Tags</Title>
          <Space wrap>
            {project.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        </div>
      )}

      {/* Quick Stats */}
      <div>
        <Title level={5}>Quick Stats</Title>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(project.status)}>{getStatusText(project.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Owner">{project.owner || 'Unassigned'}</Descriptions.Item>
          <Descriptions.Item label="Total Tasks">{metrics.totalTasks}</Descriptions.Item>
          <Descriptions.Item label="Completed">{metrics.doneTasks}</Descriptions.Item>
          <Descriptions.Item label="Blocked">
            {metrics.blockerCount > 0 ? (
              <Tag color="red">{metrics.blockerCount}</Tag>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">None</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Milestones">{metrics.milestoneCount}</Descriptions.Item>
          <Descriptions.Item label="Issues">{metrics.issueCount}</Descriptions.Item>
          <Descriptions.Item label="Next Milestone">
            {metrics.nextMilestone ? (
              <span>{metrics.nextMilestone.title}</span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">None</span>
            )}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </div>
  );

  const renderWorkItems = () => (
    <div className="space-y-4">
      {workItems.length === 0 ? (
        <Empty description="No work items yet" className="animate-fade-in" />
      ) : (
        <div className="space-y-2">
          {workItems.map((item, index) => (
            <div
              key={item.id}
              className="work-item-card border rounded-lg p-4 hover:bg-gray-50 dark:bg-gray-800 transition-all duration-200 hover:shadow-md animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag color={getStatusColor(item.status)} className="status-tag-animated">{getStatusText(item.status)}</Tag>
                    <Tag color="blue">{item.type}</Tag>
                    <Text strong>{item.title}</Text>
                  </div>
                  {item.notes && (
                    <Paragraph className="mb-0 text-sm text-gray-500 dark:text-gray-400">{item.notes}</Paragraph>
                  )}
                  {(item.start_date || item.end_date) && (
                    <Text className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                      {item.start_date && `Start: ${new Date(item.start_date).toLocaleDateString()}`}
                      {item.start_date && item.end_date && ' | '}
                      {item.end_date && `End: ${new Date(item.end_date).toLocaleDateString()}`}
                    </Text>
                  )}
                </div>
              </div>
              {item.children && item.children.length > 0 && (
                <div className="ml-4 mt-2 space-y-2">
                  {item.children.map((child, childIndex) => (
                    <div
                      key={child.id}
                      className="border-l-2 pl-3 py-1 hover:bg-gray-50 dark:bg-gray-800 transition-colors rounded animate-fade-in"
                      style={{ animationDelay: `${(index * 50) + (childIndex * 25) + 100}ms` }}
                    >
                      <div className="flex items-center gap-2">
                        <Tag color={getStatusColor(child.status)}>{getStatusText(child.status)}</Tag>
                        <Text className="text-sm">{child.title}</Text>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTimeline = () => (
    <div>
      <Empty description="Timeline view will be integrated here" />
    </div>
  );

  const items: TabsProps['items'] = [
    {
      key: 'overview',
      label: 'Overview',
      children: loading ? <Spin size="large" className="animate-spin-slow" /> : renderOverview(),
    },
    {
      key: 'workitems',
      label: `Work Items (${workItems.length})`,
      children: loading ? <Spin size="large" className="animate-spin-slow" /> : renderWorkItems(),
    },
    {
      key: 'timeline',
      label: 'Timeline',
      children: renderTimeline(),
    },
  ];

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <Title level={4} className="mb-0">
              {project.name}
            </Title>
            <Text type="secondary" className="text-sm">
              Project Details
            </Text>
          </div>
          <Space>
            {onEdit && (
              <Button icon={<EditOutlined />} onClick={() => onEdit(project)}>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button danger icon={<DeleteOutlined />} onClick={() => onDelete(project.id)}>
                Delete
              </Button>
            )}
          </Space>
        </div>
      }
      placement="right"
      width={720}
      open={open}
      onClose={onClose}
      closeIcon={<CloseOutlined />}
      styles={DRAWER_STYLES}
      destroyOnClose={true}
      maskClosable={true}
      keyboard={true}
      className="project-detail-drawer"
    >
      <div
        className={`drawer-content ${contentVisible ? 'content-visible' : ''}`}
        style={{
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        }}
      >
        <Tabs
          activeKey={activeTabKey}
          onChange={(key) => {
            setActiveTabKey(key);
            setActiveTab(key);
          }}
          items={items}
          animated={TAB_ANIMATION_CONFIG}
        />
      </div>
    </Drawer>
  );
}
