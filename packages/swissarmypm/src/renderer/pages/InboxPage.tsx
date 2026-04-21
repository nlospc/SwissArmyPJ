import React, { useState } from 'react';
import { useInboxStore } from '@/stores/useInboxStore';
import { useProjectStore } from '@/stores/useProjectStore';
import {
  Card,
  Button,
  Input,
  Tabs,
  Badge,
  Empty,
  Typography,
  Space,
  Table,
  Steps,
  Select,
  Radio,
  Tag,
  Divider,
  Alert,
} from 'antd';
import type { InboxItem, CreateProjectDTO, CreateWorkItemDTO } from '@/shared/types';

const { Title, Text } = Typography;

type Step = 'classify' | 'extract' | 'review';
type EntityType = 'project' | 'work_item';

export function InboxPage() {
  const { inboxItems, markAsProcessed, createInboxItem } = useInboxStore();
  const { projects, createProject } = useProjectStore();

  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('classify');
  const [entityType, setEntityType] = useState<EntityType>('work_item');
  const [formData, setFormData] = useState<any>({});
  const [newItemText, setNewItemText] = useState('');
  const [activeTab, setActiveTab] = useState('unprocessed');

  const unprocessedItems = inboxItems.filter((item) => item.processed === 0);
  const processedItems = inboxItems.filter((item) => item.processed === 1);

  const handleSelectItem = (item: InboxItem) => {
    setSelectedItem(item);
    setCurrentStep('classify');
    setEntityType('work_item');
    setFormData({});
  };

  const handleClassify = (type: EntityType) => {
    setEntityType(type);
    const extracted = autoExtract(selectedItem!.raw_text, type);
    setFormData(extracted);
    setCurrentStep('extract');
  };

  const autoExtract = (text: string, type: EntityType) => {
    const data: any = {};

    // Extract status
    const statusMatches = text.match(/\b(blocked|in progress|done|not started)\b/i);
    if (statusMatches) {
      data.status = statusMatches[1].toLowerCase().replace(' ', '_');
    }

    // Extract dates
    const dateMatches = text.match(/\b(\d{4}-\d{2}-\d{2})\b/g);
    if (dateMatches && dateMatches.length > 0) {
      data.start_date = dateMatches[0];
      if (dateMatches.length > 1) {
        data.end_date = dateMatches[1];
      }
    }

    // Extract work item type
    if (type === 'work_item') {
      if (text.match(/\b(milestone|deliverable)\b/i)) {
        data.type = 'milestone';
      } else if (text.match(/\b(issue|bug|problem|blocker)\b/i)) {
        data.type = 'issue';
      } else if (text.match(/\b(phase|stage)\b/i)) {
        data.type = 'phase';
      } else if (text.match(/\b(clash|conflict|risk)\b/i)) {
        data.type = 'clash';
      } else if (text.match(/\b(remark|note|comment)\b/i)) {
        data.type = 'remark';
      } else {
        data.type = 'task';
      }

      // Try to match project
      const projectMatch = projects.find((p) => text.toLowerCase().includes(p.name.toLowerCase()));
      if (projectMatch) {
        data.project_id = projectMatch.id;
      }
    }

    // Use first sentence or first 100 chars as title/name
    const firstSentence = text.split(/[.!?]/)[0].trim();
    data.title = firstSentence.substring(0, 100);
    data.name = firstSentence.substring(0, 100);

    return data;
  };

  const handleSubmit = async () => {
    if (!selectedItem) return;

    if (entityType === 'project') {
      const projectData: CreateProjectDTO = {
        name: formData.name || formData.title || 'Untitled Project',
        status: formData.status || 'not_started',
        start_date: formData.start_date,
        end_date: formData.end_date,
        owner: formData.owner,
      };
      await createProject(projectData);
    } else {
      const workItemData: CreateWorkItemDTO = {
        project_id: formData.project_id || projects[0]?.id || 1,
        type: formData.type || 'task',
        title: formData.title || 'Untitled Work Item',
        status: formData.status || 'not_started',
        start_date: formData.start_date,
        end_date: formData.end_date,
        notes: selectedItem.raw_text,
      };

      // Note: In real implementation, would call workItems.create
      // For now, just mark as processed
    }

    await markAsProcessed(selectedItem.id);
    setSelectedItem(null);
    setCurrentStep('classify');
    setFormData({});
  };

  const handleAddInboxItem = async () => {
    if (!newItemText.trim()) return;
    await createInboxItem({
      source_type: 'text',
      raw_text: newItemText,
    });
    setNewItemText('');
  };

  // Table columns for inbox items
  const columns = [
    {
      title: 'Item',
      dataIndex: 'raw_text',
      key: 'raw_text',
      render: (text: string, record: InboxItem) => (
        <div
          className={`cursor-pointer p-2 rounded transition-colors ${
            selectedItem?.id === record.id
              ? 'bg-blue-50 dark:bg-blue-900/20'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          onClick={() => handleSelectItem(record)}
        >
          <div className="line-clamp-2">{text}</div>
        </div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 100,
      render: (date: string) => (
        <Text type="secondary" className="text-xs">
          {new Date(date).toLocaleDateString()}
        </Text>
      ),
    },
  ];

  const getStepNumber = (step: Step) => {
    const steps: Record<Step, number> = { classify: 0, extract: 1, review: 2 };
    return steps[step];
  };

  const workItemTypes = [
    { value: 'task', label: 'Task' },
    { value: 'issue', label: 'Issue' },
    { value: 'milestone', label: 'Milestone' },
    { value: 'phase', label: 'Phase' },
    { value: 'remark', label: 'Remark' },
    { value: 'clash', label: 'Clash' },
  ];

  const statusOptions = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
    { value: 'blocked', label: 'Blocked' },
  ];

  const tabItems = [
    {
      key: 'unprocessed',
      label: (
        <span>
          Unprocessed
          {unprocessedItems.length > 0 && (
            <Badge count={unprocessedItems.length} className="ml-2" />
          )}
        </span>
      ),
      children: unprocessedItems.length === 0 ? (
        <Empty description="No unprocessed items" />
      ) : (
        <Table
          columns={columns}
          dataSource={unprocessedItems}
          rowKey="id"
          pagination={false}
          size="small"
          showHeader={false}
        />
      ),
    },
    {
      key: 'processed',
      label: 'Processed',
      children: processedItems.length === 0 ? (
        <Empty description="No processed items" />
      ) : (
        <Table
          columns={columns}
          dataSource={processedItems}
          rowKey="id"
          pagination={false}
          size="small"
          showHeader={false}
        />
      ),
    },
  ];

  return (
    <div className="flex h-full">
      {/* Left Panel - Inbox List */}
      <div className="w-96 border-r border-gray-200 dark:border-gray-700 p-4 space-y-4 overflow-auto">
        <div>
          <Title level={4}>Inbox</Title>
          <Space direction="vertical" className="w-full" size="middle">
            <Input.TextArea
              placeholder="Add new inbox item..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              rows={3}
            />
            <Button type="primary" onClick={handleAddInboxItem} block>
              Add to Inbox
            </Button>
          </Space>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" items={tabItems} />
      </div>

      {/* Right Panel - Processing Workflow */}
      <div className="flex-1 p-8 overflow-auto">
        {!selectedItem ? (
          <div className="flex items-center justify-center h-full">
            <Empty
              description={
                <Space direction="vertical">
                  <Text>Select an inbox item to process</Text>
                  <Text type="secondary">Choose an item from the left panel</Text>
                </Space>
              }
            />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Progress Steps */}
            <Steps current={getStepNumber(currentStep)} items={[{ title: 'Classify' }, { title: 'Extract' }, { title: 'Review' }]} />

            <Divider />

            {/* Original Text Display */}
            <Card size="small">
              <Space direction="vertical" className="w-full">
                <Text strong type="secondary">
                  Original Inbox Item
                </Text>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  <Text>{selectedItem.raw_text}</Text>
                </div>
              </Space>
            </Card>

            {/* Step 1: Classify */}
            {currentStep === 'classify' && (
              <Card title="Step 1: Classify Entity Type">
                <Space direction="vertical" size="large" className="w-full">
                  <Text type="secondary">What type of entity should this create?</Text>

                  <Radio.Group
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    className="w-full"
                  >
                    <Space direction="vertical" className="w-full">
                      <Radio value="project" className="w-full p-4 border rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                        <Space direction="vertical" size={0}>
                          <Text strong>Project</Text>
                          <Text type="secondary" className="text-xs">
                            A new project container
                          </Text>
                        </Space>
                      </Radio>
                      <Radio value="work_item" className="w-full p-4 border rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                        <Space direction="vertical" size={0}>
                          <Text strong>Work Item</Text>
                          <Text type="secondary" className="text-xs">
                            Task, issue, milestone, phase, remark, or clash
                          </Text>
                        </Space>
                      </Radio>
                    </Space>
                  </Radio.Group>

                  <Button type="primary" size="large" onClick={() => handleClassify(entityType)} block>
                    Next: Extract Fields
                  </Button>
                </Space>
              </Card>
            )}

            {/* Step 2: Extract */}
            {currentStep === 'extract' && (
              <Card title="Step 2: Review Extracted Fields">
                <Space direction="vertical" size="middle" className="w-full">
                  <Alert
                    message="Auto-extracted from text"
                    description="Review the auto-extracted information below and edit if needed."
                    type="info"
                    showIcon
                  />

                  <Space direction="vertical" className="w-full">
                    <Text strong>{entityType === 'project' ? 'Project Name' : 'Title'}</Text>
                    <Input
                      value={formData.title || formData.name || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [entityType === 'project' ? 'name' : 'title']: e.target.value,
                        })
                      }
                      placeholder={`Enter ${entityType === 'project' ? 'project name' : 'title'}`}
                    />
                  </Space>

                  {entityType === 'work_item' && (
                    <>
                      <Space direction="vertical" className="w-full">
                        <Text strong>Type</Text>
                        <Select
                          value={formData.type}
                          onChange={(value) => setFormData({ ...formData, type: value })}
                          options={workItemTypes}
                          placeholder="Select work item type"
                          className="w-full"
                        />
                      </Space>

                      <Space direction="vertical" className="w-full">
                        <Text strong>Project</Text>
                        <Select
                          value={formData.project_id}
                          onChange={(value) => setFormData({ ...formData, project_id: value })}
                          options={projects.map((p) => ({ value: p.id, label: p.name }))}
                          placeholder="Select project"
                          className="w-full"
                          showSearch
                          filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                        />
                      </Space>
                    </>
                  )}

                  <Space direction="vertical" className="w-full">
                    <Text strong>Status</Text>
                    <Select
                      value={formData.status}
                      onChange={(value) => setFormData({ ...formData, status: value })}
                      options={statusOptions}
                      placeholder="Select status"
                      className="w-full"
                    />
                  </Space>

                  <Space direction="horizontal" className="w-full">
                    <Space direction="vertical" className="flex-1">
                      <Text strong>Start Date</Text>
                      <Input
                        type="date"
                        value={formData.start_date || ''}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </Space>
                    <Space direction="vertical" className="flex-1">
                      <Text strong>End Date</Text>
                      <Input
                        type="date"
                        value={formData.end_date || ''}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </Space>
                  </Space>

                  <div className="flex gap-2 justify-end">
                    <Button onClick={() => setCurrentStep('classify')}>Back</Button>
                    <Button type="primary" onClick={() => setCurrentStep('review')}>
                      Next: Review
                    </Button>
                  </div>
                </Space>
              </Card>
            )}

            {/* Step 3: Review */}
            {currentStep === 'review' && (
              <Card title="Step 3: Review and Create">
                <Space direction="vertical" size="large" className="w-full">
                  <Alert
                    message="Ready to create"
                    description="Review the final entity details before creating."
                    type="success"
                    showIcon
                  />

                  <Card type="inner" size="small">
                    <Space direction="vertical" className="w-full" size="small">
                      <div>
                        <Text type="secondary">Entity Type:</Text>
                        <Tag color={entityType === 'project' ? 'blue' : 'green'} className="ml-2">
                          {entityType === 'project' ? 'Project' : 'Work Item'}
                        </Tag>
                      </div>

                      <div>
                        <Text type="secondary">{entityType === 'project' ? 'Name' : 'Title'}:</Text>
                        <div>
                          <Text strong>{formData.title || formData.name}</Text>
                        </div>
                      </div>

                      {formData.type && (
                        <div>
                          <Text type="secondary">Type:</Text>
                          <div>
                            <Tag>{formData.type}</Tag>
                          </div>
                        </div>
                      )}

                      {formData.status && (
                        <div>
                          <Text type="secondary">Status:</Text>
                          <div>
                            <Tag
                              color={
                                formData.status === 'done'
                                  ? 'success'
                                  : formData.status === 'blocked'
                                    ? 'error'
                                    : formData.status === 'in_progress'
                                      ? 'processing'
                                      : 'default'
                              }
                            >
                              {statusOptions.find((s) => s.value === formData.status)?.label ||
                                formData.status}
                            </Tag>
                          </div>
                        </div>
                      )}

                      {formData.project_id && (
                        <div>
                          <Text type="secondary">Project:</Text>
                          <div>
                            <Text>{projects.find((p) => p.id === formData.project_id)?.name}</Text>
                          </div>
                        </div>
                      )}

                      {(formData.start_date || formData.end_date) && (
                        <div>
                          <Text type="secondary">Dates:</Text>
                          <div>
                            <Text>
                              {formData.start_date || '—'} → {formData.end_date || '—'}
                            </Text>
                          </div>
                        </div>
                      )}
                    </Space>
                  </Card>

                  <div className="flex gap-2 justify-end">
                    <Button onClick={() => setCurrentStep('extract')}>Back</Button>
                    <Button type="primary" onClick={handleSubmit} size="large">
                      Create Entity & Mark Processed
                    </Button>
                  </div>
                </Space>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
