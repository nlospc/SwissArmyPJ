import React, { useState } from 'react';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { ipc } from '@/lib/ipc';
import { loadSampleData } from '@/lib/sampleData';
import { Card, Input, Button, Alert, Space, Typography, Modal, Upload, Descriptions } from 'antd';
import { ExclamationCircleOutlined, DownloadOutlined, UploadOutlined, ReloadOutlined } from '@ant-design/icons';
import type { UploadChangeParam } from 'antd/es/upload';

const { Title, Text } = Typography;
const { Dragger } = Upload;

export function SettingsPage() {
  const { workspace, updateWorkspaceName } = useWorkspaceStore();
  const [workspaceName, setWorkspaceName] = useState(workspace?.name || '');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateWorkspace = async () => {
    if (!workspaceName.trim()) return;
    await updateWorkspaceName(workspaceName);
    setMessage({ type: 'success', text: 'Workspace name updated successfully' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExport = async () => {
    const result = await ipc.settings.export();
    if (result.success && result.data) {
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `swissarmypm-export-${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      setMessage({ type: 'success', text: 'Data exported successfully' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: 'Failed to export data' });
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await ipc.settings.import(data);

      if (result.success) {
        setMessage({ type: 'success', text: 'Data imported successfully. Please reload the page.' });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage({ type: 'error', text: 'Failed to import data' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Invalid import file' });
    }
  };

  const handleResetToSampleData = async () => {
    Modal.confirm({
      title: 'Are you absolutely sure?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>This action will delete ALL your current data and replace it with sample data.</p>
          <p>This action cannot be undone. Make sure to export your data first if you want to keep it.</p>
        </div>
      ),
      okText: 'Yes, reset to sample data',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await ipc.settings.import({
            portfolios: [],
            projects: [],
            work_items: [],
            inbox_items: [],
            todos: [],
            settings: [],
          });
          await loadSampleData();
          setMessage({ type: 'success', text: 'Sample data loaded. Reloading page...' });
          setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
          setMessage({ type: 'error', text: 'Failed to reset data' });
        }
      },
    });
  };

  const uploadProps = {
    name: 'file',
    accept: '.json' as const,
    beforeUpload: (file: File) => {
      handleImport(file);
      return false; // Prevent automatic upload
    },
    showUploadList: false,
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Title level={2}>Settings</Title>
        <Text type="secondary">Manage your workspace and data</Text>
      </div>

      {message && (
        <Alert
          message={message.text}
          type={message.type}
          showIcon
          closable
          onClose={() => setMessage(null)}
        />
      )}

      {/* Workspace Settings */}
      <Card title={<Title level={4} className="mb-0">Workspace</Title>}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>Workspace Name</Text>
            <div className="flex gap-2 mt-2">
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="My Workspace"
                style={{ flex: 1 }}
              />
              <Button type="primary" onClick={handleUpdateWorkspace}>
                Update
              </Button>
            </div>
          </div>
        </Space>
      </Card>

      {/* Data Management */}
      <Card title={<Title level={4} className="mb-0">Data Management</Title>}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Export */}
          <div>
            <Title level={5}>Export Data</Title>
            <Text type="secondary" className="block mb-3">
              Download all your data as a JSON file
            </Text>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              Export Data
            </Button>
          </div>

          {/* Import */}
          <div className="border-t border-gray-100 pt-4 dark:border-gray-700">
            <Title level={5}>Import Data</Title>
            <Text type="secondary" className="block mb-3">
              Import data from a previously exported JSON file
            </Text>
            <Dragger {...uploadProps} style={{ maxWidth: '500px' }}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Click or drag JSON file to this area to upload</p>
              <p className="ant-upload-hint">Support for .json files only</p>
            </Dragger>
          </div>

          {/* Reset */}
          <div className="border-t border-gray-100 pt-4 dark:border-gray-700">
            <Title level={5}>Reset to Sample Data</Title>
            <Text type="secondary" className="block mb-3">
              Clear all data and reload sample projects and work items
            </Text>
            <Button
              danger
              icon={<ReloadOutlined />}
              onClick={handleResetToSampleData}
            >
              Reset to Sample Data
            </Button>
          </div>
        </Space>
      </Card>

      {/* App Info */}
      <Card title={<Title level={4} className="mb-0">About</Title>}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Version">1.0.0</Descriptions.Item>
          <Descriptions.Item label="Platform">Electron + SQLite</Descriptions.Item>
          <Descriptions.Item label="Component Library">Ant Design v5</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
