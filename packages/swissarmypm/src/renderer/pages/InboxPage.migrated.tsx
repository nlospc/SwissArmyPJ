import React, { useState } from 'react';
import { useInboxStore } from '@/stores/useInboxStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { Card, Button, Input, Badge, Tabs, Steps, Table, Space } from 'antd';
import type { InboxItem, CreateProjectDTO, CreateWorkItemDTO } from '@/shared/types';

const { TextArea } = Input;
const { Step } = Steps;

type StepType = 'classify' | 'extract' | 'review';
type EntityType = 'project' | 'work_item';

export function InboxPage() {
  const { inboxItems, markAsProcessed, createInboxItem } = useInboxStore();
  const { projects, createProject } = useProjectStore();

  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [entityType, setEntityType] = useState<EntityType>('work_item');
  const [formData, setFormData] = useState<any>({});
  const [newItemText, setNewItemText] = useState('');

  const unprocessedItems = inboxItems.filter(item => item.processed === 0);
  const processedItems = inboxItems.filter(item => item.processed === 1);

  const steps: StepType[] = ['classify', 'extract', 'review'];

  const handleSelectItem = (item: InboxItem) => {
    setSelectedItem(item);
    setCurrentStep(0);
    setFormData({});
  };

  const handleClassify = (type: EntityType) => {
    setEntityType(type);
    // Auto-extract fields
    const extracted = autoExtract(selectedItem!.raw_text, type);
    setFormData(extracted);
    setCurrentStep(1);
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
      const projectMatch = projects.find(p =>
        text.toLowerCase().includes(p.name.toLowerCase())
      );
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
    }

    await markAsProcessed(selectedItem.id);
    setSelectedItem(null);
    setCurrentStep(0);
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

  const unprocessedColumns = [
    {
      title: 'Item',
      dataIndex: 'raw_text',
      key: 'raw_text',
      ellipsis: true,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 100,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const processedColumns = [
    {
      title: 'Item',
      dataIndex: 'raw_text',
      key: 'raw_text',
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 100,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div className="flex h-full">
      {/* Left Panel - Inbox List */}
      <div className="w-96 border-r border-theme-secondary p-4 space-y-4 overflow-auto dark:border-gray-700">
        <div>
          <h2 className="text-xl font-bold mb-2">Inbox</h2>
          <div className="space-y-2">
            <TextArea
              placeholder="Add new inbox item..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              rows={3}
            />
            <Button onClick={handleAddInboxItem} className="w-full" type="primary">
              Add to Inbox
            </Button>
          </div>
        </div>

        <Tabs
          defaultActiveKey="unprocessed"
          items={[
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
              children: (
                <Table
                  dataSource={unprocessedItems}
                  columns={unprocessedColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  onRow={(record) => ({
                    onClick: () => handleSelectItem(record),
                    style: {
                      cursor: 'pointer',
                      backgroundColor: selectedItem?.id === record.id ? '#e6f7ff' : undefined,
                    },
                  })}
                />
              ),
            },
            {
              key: 'processed',
              label: 'Processed',
              children: (
                <Table
                  dataSource={processedItems}
                  columns={processedColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              ),
            },
          ]}
        />
      </div>

      {/* Right Panel - Processing Workflow */}
      <div className="flex-1 p-8 overflow-auto">
        {!selectedItem ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-theme-secondary">
              <p className="text-lg font-medium">Select an inbox item to process</p>
              <p className="text-sm mt-2">Choose an item from the left panel</p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Progress Steps */}
            <Steps current={currentStep} className="mb-8">
              <Step title="Classify" description="Classify entity type" />
              <Step title="Extract" description="Extract information" />
              <Step title="Review" description="Review and create" />
            </Steps>

            {/* Original Text */}
            <Card
              title={<span className="text-sm">Original Inbox Item</span>}
              size="small"
            >
              <p className="text-sm bg-theme-container p-3 rounded dark:bg-gray-800">
                {selectedItem.raw_text}
              </p>
            </Card>

            {/* Step 1: Classify */}
            {currentStep === 0 && (
              <Card title="Step 1: Classify Entity Type">
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <p className="text-sm text-theme-secondary">
                    What type of entity should this create?
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      size="large"
                      className="h-24 flex flex-col items-center justify-center"
                      onClick={() => handleClassify('project')}
                    >
                      <span className="text-lg font-semibold">Project</span>
                      <span className="text-xs text-theme-secondary">A new project container</span>
                    </Button>
                    <Button
                      size="large"
                      type="primary"
                      className="h-24 flex flex-col items-center justify-center"
                      onClick={() => handleClassify('work_item')}
                    >
                      <span className="text-lg font-semibold">Work Item</span>
                      <span className="text-xs">A task, milestone, or issue</span>
                    </Button>
                  </div>
                </Space>
              </Card>
            )}

            {/* Step 2: Extract & Review */}
            {currentStep === 1 && (
              <Card title="Step 2: Review Extracted Information">
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title/Name</label>
                      <Input
                        value={formData.title || formData.name}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>

                    {entityType === 'work_item' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">Type</label>
                          <Input value={formData.type} disabled />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Project</label>
                          <Input value={projects.find(p => p.id === formData.project_id)?.name || 'None'} disabled />
                        </div>
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Start Date</label>
                        <Input
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">End Date</label>
                        <Input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <Input value={formData.status || 'not_started'} disabled />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={() => setCurrentStep(0)}>Back</Button>
                    <Button type="primary" onClick={handleSubmit}>
                      Create {entityType === 'project' ? 'Project' : 'Work Item'}
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
