import React, { useState } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import { useUIStore } from '@/stores/useUIStore';
import { Card, Input, Badge, Button, Table, Tag, Typography, Empty, Space } from 'antd';
import { CaretRightOutlined, CaretDownOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd';
import type { Project, WorkItem } from '@/shared/types';

const { Title, Text } = Typography;

export function ProjectsPage() {
  const { projects } = useProjectStore();
  const { workItemsByProject, loadWorkItemsByProject } = useWorkItemStore();
  const { selectedProjectId, setSelectedProjectId } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.owner && p.owner.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectProject = async (project: Project) => {
    setSelectedProjectId(project.id);
    await loadWorkItemsByProject(project.id);
  };

  const toggleExpand = (itemId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      done: { color: 'success', text: 'Done' },
      in_progress: { color: 'processing', text: 'In Progress' },
      blocked: { color: 'error', text: 'Blocked' },
      not_started: { color: 'default', text: 'Not Started' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getTypeTag = (type: string) => {
    const typeMap: Record<string, string> = {
      task: 'blue',
      issue: 'red',
      milestone: 'purple',
      phase: 'green',
      remark: 'orange',
      clash: 'orange',
    };
    return <Tag color={typeMap[type] || 'default'}>{type}</Tag>;
  };

  const projectColumns: ColumnsType<Project> = [
    {
      title: 'Project',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <div>
          <div className="font-medium">{text}</div>
          {record.owner && (
            <div className="text-xs text-gray-500">{record.owner}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
  ];

  // Work Items Table with expandable rows
  const getWorkItemColumns = (): ColumnsType<WorkItem> => [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: WorkItem) => (
        <Space>
          {getTypeTag(record.type)}
          <span className="font-medium">{text}</span>
        </Space>
      ),
    },
    {
      title: 'Dates',
      key: 'dates',
      render: (_, record: WorkItem) =>
        record.start_date && record.end_date ? (
          <Text type="secondary" className="text-xs">
            {record.start_date} → {record.end_date}
          </Text>
        ) : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes: string) => notes || '-',
    },
  ];

  const workItems = selectedProjectId ? workItemsByProject.get(selectedProjectId) || [] : [];

  // Convert work items tree to flat list with parent keys for Table
  const flattenWorkItems = (items: WorkItem[], parentKey: string | null = null): Array<WorkItem & { key: string; parent: string | null }> => {
    const result: Array<WorkItem & { key: string; parent: string | null }> = [];
    items.forEach(item => {
      const key = `${parentKey ? parentKey + '-' : ''}${item.id}`;
      result.push({ ...item, key, parent: parentKey });
      if (item.children && item.children.length > 0) {
        result.push(...flattenWorkItems(item.children, key));
      }
    });
    return result;
  };

  const flatWorkItems = flattenWorkItems(workItems);

  return (
    <div className="flex h-full">
      {/* Left Panel - Project List */}
      <div className="w-96 border-r border-gray-200 p-4 space-y-4 overflow-auto dark:border-gray-700">
        <div>
          <Title level={4}>Projects</Title>
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
          />
        </div>

        <Table
          columns={projectColumns}
          dataSource={filteredProjects}
          rowKey="id"
          pagination={false}
          size="small"
          onRow={(record) => ({
            onClick: () => handleSelectProject(record),
            style: {
              cursor: 'pointer',
              backgroundColor: selectedProjectId === record.id ? '#e6f7ff' : undefined,
            },
          })}
        />
      </div>

      {/* Right Panel - Project Details & Work Items */}
      <div className="flex-1 p-8 overflow-auto">
        {!selectedProject ? (
          <div className="flex items-center justify-center h-full">
            <Empty description="Select a project to view details" />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Project Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Title level={2}>{selectedProject.name}</Title>
                  {selectedProject.owner && (
                    <Text type="secondary">Owner: {selectedProject.owner}</Text>
                  )}
                </div>
                {getStatusTag(selectedProject.status)}
              </div>

              {selectedProject.description && (
                <Text type="secondary">{selectedProject.description}</Text>
              )}

              <Space className="mt-4">
                {selectedProject.start_date && (
                  <Text>
                    <span className="font-medium">Start:</span> {selectedProject.start_date}
                  </Text>
                )}
                {selectedProject.end_date && (
                  <Text>
                    <span className="font-medium">End:</span> {selectedProject.end_date}
                  </Text>
                )}
              </Space>
            </div>

            {/* Work Items */}
            <Card
              title={<Title level={4} className="mb-0">Work Items</Title>}
            >
              {flatWorkItems.length === 0 ? (
                <Empty description="No work items for this project" />
              ) : (
                <Table
                  columns={getWorkItemColumns()}
                  dataSource={flatWorkItems}
                  pagination={false}
                  size="small"
                  expandable={{
                    defaultExpandAllRows: false,
                    expandIcon: ({ expanded, onExpand, record }) =>
                      record.children && record.children.length > 0 ? (
                        expanded ? (
                          <CaretDownOutlined onClick={(e) => onExpand(record, e)} />
                        ) : (
                          <CaretRightOutlined onClick={(e) => onExpand(record, e)} />
                        )
                      ) : null,
                  }}
                />
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
