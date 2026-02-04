import React, { useEffect } from 'react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { Card, Button, Alert, Space, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';

// Import dashboard sub-components
import { ProjectTable } from '@/components/dashboard/ProjectTable';
import { TopWidgetDrawer } from '@/components/dashboard/TopWidgetDrawer';

const { Title, Text } = Typography;

export function DashboardPage() {
  const {
    projectHealthList,
    changeFeed,
    upcomingMilestones,
    riskSummary,
    loading,
    error,
    lastRefreshed,
    refreshAll,
  } = useDashboardStore();

  useEffect(() => {
    refreshAll();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      refreshAll();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshAll]);

  const handleRefresh = () => {
    refreshAll();
  };

  if (error) {
    return (
      <div className="p-8">
        <Alert
          message="Error Loading Dashboard"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="px-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <Title level={2} className="mb-1">Portfolio Dashboard</Title>
            <Text type="secondary">
              30-second context recovery for your IT portfolio
            </Text>
          </div>
          <Space>
            {lastRefreshed && (
              <Text type="secondary" className="text-sm">
                Last refreshed: {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
              </Text>
            )}
            <Button
              onClick={handleRefresh}
              icon={<ReloadOutlined spin={loading} />}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>
      </div>

      {/* Top Widget Drawer */}
      <TopWidgetDrawer
        changeFeed={changeFeed}
        upcomingMilestones={upcomingMilestones}
        riskSummary={riskSummary}
        loading={loading}
      />

      {/* Main Content */}
      <div className="px-8 pt-6 space-y-6">
        {/* Project Health Table */}
        <Card
          title={<Title level={4} className="mb-0">Project Health</Title>}
        >
          <ProjectTable projects={projectHealthList} />
        </Card>
      </div>
    </div>
  );
}
