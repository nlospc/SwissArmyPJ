import React from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd';

const { Title, Text } = Typography;

export function PortfolioPage() {
  const { projects } = useProjectStore();
  const { workItems } = useWorkItemStore();

  // Calculate KPIs
  const totalProjects = projects.length;
  const totalWorkItems = workItems.length;
  const blockedProjects = projects.filter(p => p.status === 'blocked').length;
  const blockedWorkItems = workItems.filter(w => w.status === 'blocked').length;
  const blockedCount = blockedProjects + blockedWorkItems;
  const atRiskCount = workItems.filter(w => w.type === 'issue').length;

  const statusCounts = {
    not_started: projects.filter(p => p.status === 'not_started').length + workItems.filter(w => w.status === 'not_started').length,
    in_progress: projects.filter(p => p.status === 'in_progress').length + workItems.filter(w => w.status === 'in_progress').length,
    done: projects.filter(p => p.status === 'done').length + workItems.filter(w => w.status === 'done').length,
    blocked: blockedCount,
  };

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const getPercentage = (count: number) => total > 0 ? (count / total) * 100 : 0;

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

  const projectColumns: ColumnsType<any> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date: string) => date || '-',
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date: string) => date || '-',
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      render: (owner: string) => owner || '-',
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <Title level={2}>Portfolio Dashboard</Title>
        <Text type="secondary">Overview of all projects and work items</Text>
      </div>

      {/* KPI Cards */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Projects"
              value={totalProjects}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Work Items"
              value={totalWorkItems}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="At Risk"
              value={atRiskCount}
              valueStyle={{ color: '#faad14' }}
              suffix={<Text type="secondary" className="text-xs">Open issues</Text>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Blocked"
              value={blockedCount}
              valueStyle={{ color: '#ff4d4f' }}
              suffix={<Text type="secondary" className="text-xs">Requires attention</Text>}
            />
          </Card>
        </Col>
      </Row>

      {/* Status Distribution */}
      <Card
        title={<Title level={4} className="mb-0">Status Distribution</Title>}
      >
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <Progress
              percent={100}
              strokeColor={{
                '0%': '#52c41a',
                [getPercentage(statusCounts.done) + '%']: '#1677ff',
                [getPercentage(statusCounts.done) + getPercentage(statusCounts.in_progress) + '%']: '#ff4d4f',
                [getPercentage(statusCounts.done) + getPercentage(statusCounts.in_progress) + getPercentage(statusCounts.blocked) + '%']: '#d9d9d9',
              }}
              showInfo={false}
              trailColor="transparent"
              strokeLinecap="butt"
            />
          </div>

          {/* Legend */}
          <Row gutter={16}>
            <Col span={6}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#52c41a' }} />
                <Text>Done ({statusCounts.done})</Text>
              </div>
            </Col>
            <Col span={6}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1677ff' }} />
                <Text>In Progress ({statusCounts.in_progress})</Text>
              </div>
            </Col>
            <Col span={6}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff4d4f' }} />
                <Text>Blocked ({statusCounts.blocked})</Text>
              </div>
            </Col>
            <Col span={6}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#d9d9d9' }} />
                <Text>Not Started ({statusCounts.not_started})</Text>
              </div>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Projects Table */}
      <Card
        title={<Title level={4} className="mb-0">All Projects</Title>}
      >
        <Table
          columns={projectColumns}
          dataSource={projects}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
