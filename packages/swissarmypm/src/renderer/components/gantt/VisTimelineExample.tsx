/**
 * VisTimelineExample - Example usage of VisTimelineWrapper
 *
 * This component demonstrates how to use the VisTimelineWrapper
 * with Project or WorkItem data.
 */

import React, { useState, useMemo } from 'react';
import { Card, Button, Space, message } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import { VisTimelineWrapper, type VisTimelineItem } from './VisTimelineWrapper';
import type { TimelineOptions } from 'vis-timeline/types';

export const VisTimelineExample: React.FC = () => {
  const [zoomLevel, setZoomLevel] = useState(1);

  // Sample data
  const items: VisTimelineItem[] = useMemo(() => [
    {
      id: 1,
      content: 'Design Phase',
      start: new Date(2026, 1, 1),
      end: new Date(2026, 1, 15),
      type: 'range',
      className: 'timeline-phase status-done',
      title: 'Design Phase\nStatus: Done',
    },
    {
      id: 2,
      content: 'Development Sprint 1',
      start: new Date(2026, 1, 10),
      end: new Date(2026, 1, 24),
      type: 'range',
      className: 'timeline-task status-in_progress',
      title: 'Development Sprint 1\nStatus: In Progress',
    },
    {
      id: 3,
      content: 'Testing',
      start: new Date(2026, 1, 20),
      end: new Date(2026, 2, 5),
      type: 'range',
      className: 'timeline-task status-not_started',
      title: 'Testing\nStatus: Not Started',
    },
    {
      id: 4,
      content: 'Launch Milestone',
      start: new Date(2026, 2, 5),
      type: 'point',
      className: 'timeline-milestone',
      title: 'Launch Milestone\nStatus: Not Started',
    },
    {
      id: 5,
      content: 'Blocked Issue',
      start: new Date(2026, 1, 18),
      end: new Date(2026, 1, 22),
      type: 'range',
      className: 'timeline-issue status-blocked',
      title: 'Blocked Issue\nNeeds attention',
    },
  ], []);

  const options: TimelineOptions = useMemo(() => ({
    editable: {
      updateTime: true,
      updateGroup: false,
      add: false,
      remove: false,
    },
    stack: true,
    orientation: 'top',
    zoomMin: 86400000, // 1 day
    zoomMax: 31536000000, // 1 year
    start: new Date(2026, 0, 15),
    end: new Date(2026, 2, 15),
    margin: {
      item: 10,
      axis: 5,
    },
  }), []);

  const handleItemClick = (item: VisTimelineItem) => {
    message.info(`Clicked: ${item.content}`);
    console.log('Item clicked:', item);
  };

  const handleItemDoubleClick = (item: VisTimelineItem) => {
    message.success(`Double-clicked: ${item.content}`);
    console.log('Item double-clicked:', item);
  };

  const handleItemUpdate = (item: VisTimelineItem, callback: (item: VisTimelineItem | null) => void) => {
    console.log('Item updated:', item);
    message.success(`Updated: ${item.content}`);
    // Accept the change
    callback(item);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
  };

  return (
    <Card
      title="vis-timeline Example"
      extra={
        <Space>
          <Button
            icon={<ZoomOutOutlined />}
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.5}
          >
            Zoom Out
          </Button>
          <Button
            icon={<ZoomInOutlined />}
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
          >
            Zoom In
          </Button>
        </Space>
      }
    >
      <div style={{ height: 400 }}>
        <VisTimelineWrapper
          items={items}
          options={options}
          onItemClick={handleItemClick}
          onItemDoubleClick={handleItemDoubleClick}
          onItemUpdate={handleItemUpdate}
        />
      </div>
      <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
        <p><strong>Try:</strong></p>
        <ul>
          <li>Click items to see messages</li>
          <li>Drag items to change dates</li>
          <li>Scroll to pan horizontally</li>
          <li>Ctrl+Scroll to zoom in/out</li>
        </ul>
      </div>
    </Card>
  );
};
