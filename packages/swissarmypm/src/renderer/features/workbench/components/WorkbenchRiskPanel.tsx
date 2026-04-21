import React from 'react';
import { Alert, Card, Empty, List, Space, Tag, Typography } from 'antd';
import { WarningOutlined } from '@ant-design/icons';

import type { WorkItem } from '@/shared/types';

const { Text, Paragraph } = Typography;

const priorityColorMap: Record<'low' | 'medium' | 'high' | 'critical', string> = {
  low: 'green',
  medium: 'gold',
  high: 'orange',
  critical: 'red',
};

type WorkbenchRiskCopy = {
  title: string;
  subtitle: string;
  activeRisks: string;
  criticalRisks: string;
  noRisks: string;
  ownerTbd: string;
  status: string;
};

interface WorkbenchRiskPanelProps {
  risks: WorkItem[];
  copy: WorkbenchRiskCopy;
}

function byPriority(items: WorkItem[]) {
  const weight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  return [...items].sort((left, right) => (weight[right.priority || 'low'] || 0) - (weight[left.priority || 'low'] || 0));
}

export function WorkbenchRiskPanel({ risks, copy }: WorkbenchRiskPanelProps) {
  const sortedRisks = byPriority(risks);
  const criticalCount = sortedRisks.filter((risk) => risk.priority === 'critical').length;

  return (
    <div className="space-y-6">
      <Card>
        <div className="space-y-3">
          <div>
            <Text type="secondary">{copy.title}</Text>
            <Paragraph className="mb-0 mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {copy.subtitle}
            </Paragraph>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
              <div className="text-xs text-slate-500">{copy.activeRisks}</div>
              <div className="mt-2 text-2xl font-semibold text-red-600">{sortedRisks.length}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
              <div className="text-xs text-slate-500">{copy.criticalRisks}</div>
              <div className="mt-2 text-2xl font-semibold text-orange-500">{criticalCount}</div>
            </div>
          </div>
        </div>
      </Card>

      <Card title={<span className="font-semibold">{copy.activeRisks}</span>}>
        {sortedRisks.length === 0 ? (
          <Alert type="success" showIcon message={copy.noRisks} />
        ) : (
          <List
            dataSource={sortedRisks}
            renderItem={(risk) => (
              <List.Item>
                <div className="w-full rounded-xl border border-red-100 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Space wrap>
                        <WarningOutlined className="text-red-500" />
                        <span className="font-medium text-slate-900 dark:text-slate-100">{risk.title}</span>
                      </Space>
                      <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{risk.owner || copy.ownerTbd}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Tag color={risk.priority ? priorityColorMap[risk.priority as 'low' | 'medium' | 'high' | 'critical'] : 'default'}>
                        {risk.priority || '-'}
                      </Tag>
                      <Tag>{copy.status}: {risk.status}</Tag>
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
