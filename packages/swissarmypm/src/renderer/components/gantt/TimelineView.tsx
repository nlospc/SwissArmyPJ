import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Typography, Button, Space } from 'antd';
import { Calendar, BarChart3, AlertCircle } from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import { ProjectGanttChart } from './ProjectGanttChart';

const { Title, Text } = Typography;

export function TimelineView() {
  const { projects } = useProjectStore();
  const { workItems } = useWorkItemStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // 计算项目统计数据
  const projectStats = useMemo(() => {
    return projects.map(project => {
      const projectWorkItems = workItems.filter(w => w.project_id === project.id);
      const completed = projectWorkItems.filter(w => w.status === 'done').length;
      const inProgress = projectWorkItems.filter(w => w.status === 'in_progress').length;
      const blocked = projectWorkItems.filter(w => w.status === 'blocked').length;

      return {
        ...project,
        totalTasks: projectWorkItems.length,
        completed,
        inProgress,
        blocked,
        progress: projectWorkItems.length > 0
          ? Math.round((completed / projectWorkItems.length) * 100)
          : 0,
        startDate: project.start_date ? new Date(project.start_date) : new Date(),
        endDate: project.end_date ? new Date(project.end_date) : new Date(),
      };
    });
  }, [projects, workItems]);

  // 全局统计
  const globalStats = useMemo(() => {
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'in_progress').length,
      totalTasks: workItems.length,
      completedTasks: workItems.filter(w => w.status === 'done').length,
      blockedTasks: workItems.filter(w => w.status === 'blocked').length,
    };
  }, [projects, workItems]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      done: 'success',
      in_progress: 'processing',
      blocked: 'error',
      not_started: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      done: '完成',
      in_progress: '进行中',
      blocked: '阻塞',
      not_started: '未开始',
    };
    return texts[status] || status;
  };

  // 如果选中了项目，显示项目 Gantt Chart
  if (selectedProjectId) {
    const selectedProject = projectStats.find(p => p.id === selectedProjectId);
    if (selectedProject) {
      return (
        <div className="h-full flex flex-col">
          <div className="mb-4">
            <Button
              onClick={() => setSelectedProjectId(null)}
              className="mb-4"
            >
              ← 返回时间线视图
            </Button>
            <Title level={3}>{selectedProject.name}</Title>
            <Text type="secondary">
              {selectedProject.startDate.toLocaleDateString()} - {selectedProject.endDate.toLocaleDateString()}
            </Text>
          </div>
          <ProjectGanttChart
            projectId={selectedProject.id}
            projectName={selectedProject.name}
          />
        </div>
      );
    }
  }

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            项目时间线
          </Title>
          <Text type="secondary">查看所有项目的时间安排和进度</Text>
        </div>
        <Space>
          <Button icon={<BarChart3 className="h-4 w-4" />}>
            切换到甘特图
          </Button>
        </Space>
      </div>

      {/* 全局统计卡片 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总项目数"
              value={globalStats.totalProjects}
              prefix={<BarChart3 className="h-4 w-4" />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃项目"
              value={globalStats.activeProjects}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={globalStats.totalTasks}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成任务"
              value={globalStats.completedTasks}
              valueStyle={{ color: '#52c41a' }}
              suffix={`/ ${globalStats.totalTasks}`}
            />
          </Card>
        </Col>
      </Row>

      {/* 项目时间线 */}
      <Card
        title={<Title level={4} className="mb-0">项目时间线</Title>}
      >
        <div className="space-y-4">
          {projectStats.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-theme-tertiary mx-auto mb-4" />
              <Text type="secondary">暂无项目</Text>
            </div>
          ) : (
            projectStats.map(project => (
              <Card
                key={project.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedProjectId(project.id)}
                styles={{
                  body: { padding: '16px' }
                }}
              >
                <div className="space-y-3">
                  {/* 项目头部 */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Title level={5} className="mb-0">
                          {project.name}
                        </Title>
                        <Tag color={getStatusColor(project.status)}>
                          {getStatusText(project.status)}
                        </Tag>
                        {project.blocked > 0 && (
                          <Tag color="error" icon={<AlertCircle className="h-3 w-3" />}>
                            {project.blocked} 阻塞
                          </Tag>
                        )}
                      </div>
                      <Text type="secondary" className="text-sm">
                        {project.startDate.toLocaleDateString()} - {project.endDate.toLocaleDateString()}
                        {project.owner && ` • 负责人: ${project.owner}`}
                      </Text>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-primary">
                        {project.progress}%
                      </div>
                      <Text type="secondary" className="text-xs">
                        {project.completed}/{project.totalTasks} 任务
                      </Text>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div>
                    <Progress
                      percent={project.progress}
                      status={project.blocked > 0 ? 'exception' : 'active'}
                      strokeColor={{
                        '0%': '#1677ff',
                        '100%': '#52c41a',
                      }}
                      size="small"
                    />
                  </div>

                  {/* 任务统计 */}
                  <Row gutter={8}>
                    <Col span={6}>
                      <div className="text-sm">
                        <span className="text-theme-secondary">进行中: </span>
                        <span className="font-medium">{project.inProgress}</span>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div className="text-sm">
                        <span className="text-theme-secondary">已完成: </span>
                        <span className="font-medium text-success">{project.completed}</span>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div className="text-sm">
                        <span className="text-theme-secondary">阻塞: </span>
                        <span className="font-medium text-error">{project.blocked}</span>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div className="text-sm text-theme-tertiary">
                        点击查看详情 →
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
