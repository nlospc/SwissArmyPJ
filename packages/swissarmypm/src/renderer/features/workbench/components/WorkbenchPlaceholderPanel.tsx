import React from 'react';
import { Card, Empty, Typography } from 'antd';

const { Text, Paragraph } = Typography;

interface WorkbenchPlaceholderPanelProps {
  title: string;
  description: string;
}

export function WorkbenchPlaceholderPanel({ title, description }: WorkbenchPlaceholderPanelProps) {
  return (
    <Card>
      <div className="space-y-3">
        <Text type="secondary">{title}</Text>
        <Paragraph className="mb-0 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {description}
        </Paragraph>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Coming next" />
      </div>
    </Card>
  );
}
