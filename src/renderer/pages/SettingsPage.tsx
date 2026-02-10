import React, { useState } from 'react';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useUIStore } from '@/stores/useUIStore';
import { useI18n } from '@/hooks/useI18n';
import { ipc } from '@/lib/ipc';
import { loadSampleData } from '@/lib/sampleData';
import { Card, Input, Button, Alert, Space, Typography, Modal, Upload, Descriptions, Select } from 'antd';
import { ExclamationCircleOutlined, DownloadOutlined, UploadOutlined, ReloadOutlined } from '@ant-design/icons';
import type { UploadChangeParam } from 'antd/es/upload';

const { Title, Text } = Typography;
const { Dragger } = Upload;

export function SettingsPage() {
  const { workspace, updateWorkspaceName } = useWorkspaceStore();
  const { language, setLanguage } = useUIStore();
  const { t } = useI18n();
  
  const [workspaceName, setWorkspaceName] = useState(workspace?.name || '');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateWorkspace = async () => {
    if (!workspaceName.trim()) return;
    await updateWorkspaceName(workspaceName);
    setMessage({ type: 'success', text: t('settings.workspaceNameUpdated') });
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

      setMessage({ type: 'success', text: t('settings.exportSuccess') });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: t('settings.exportFailed') });
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await ipc.settings.import(data);

      if (result.success) {
        setMessage({ type: 'success', text: t('settings.importSuccess') });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage({ type: 'error', text: t('settings.importFailed') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.invalidImportFile') });
    }
  };

  const handleResetToSampleData = async () => {
    Modal.confirm({
      title: t('settings.resetConfirmTitle'),
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>{t('settings.resetConfirmContent1')}</p>
          <p>{t('settings.resetConfirmContent2')}</p>
        </div>
      ),
      okText: t('settings.resetConfirmOk'),
      okType: 'danger',
      cancelText: t('common.cancel'),
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
          setMessage({ type: 'success', text: t('settings.resetSampleLoaded') });
          setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
          setMessage({ type: 'error', text: t('settings.resetFailed') });
        }
      },
    });
  };

  const uploadProps = {
    name: 'file',
    accept: '.json' as const,
    beforeUpload: (file: File) => {
      handleImport(file);
      return false;
    },
    showUploadList: false,
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Title level={2}>{t('settings.title')}</Title>
        <Text type="secondary">{t('settings.subtitle')}</Text>
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
      <Card title={<Title level={4} className="mb-0">{t('settings.workspace')}</Title>}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>{t('settings.workspaceName')}</Text>
            <div className="flex gap-2 mt-2">
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder={t('settings.workspaceNamePlaceholder')}
                style={{ flex: 1 }}
              />
              <Button type="primary" onClick={handleUpdateWorkspace}>
                {t('settings.updateWorkspace')}
              </Button>
            </div>
          </div>
        </Space>
      </Card>

      {/* Language Settings */}
      <Card title={<Title level={4} className="mb-0">{t('settings.language')}</Title>}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text type="secondary" className="block mb-3">
              {t('settings.languageDesc')}
            </Text>
            <Select
              value={language}
              onChange={setLanguage}
              style={{ width: 200 }}
              options={[
                { label: t('settings.languageChinese'), value: 'zh' },
                { label: t('settings.languageEnglish'), value: 'en' },
              ]}
            />
          </div>
        </Space>
      </Card>

      {/* Data Management */}
      <Card title={<Title level={4} className="mb-0">{t('settings.dataManagement')}</Title>}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Export */}
          <div>
            <Title level={5}>{t('settings.exportData')}</Title>
            <Text type="secondary" className="block mb-3">
              {t('settings.exportDataDesc')}
            </Text>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              {t('settings.exportDataButton')}
            </Button>
          </div>

          {/* Import */}
          <div className="border-t border-gray-100 pt-4 dark:border-gray-700">
            <Title level={5}>{t('settings.importData')}</Title>
            <Text type="secondary" className="block mb-3">
              {t('settings.importDataDesc')}
            </Text>
            <Dragger {...uploadProps} style={{ maxWidth: '500px' }}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">{t('settings.importUploadText')}</p>
              <p className="ant-upload-hint">{t('settings.importFileHint')}</p>
            </Dragger>
          </div>

          {/* Reset */}
          <div className="border-t border-gray-100 pt-4 dark:border-gray-700">
            <Title level={5}>{t('settings.resetToSample')}</Title>
            <Text type="secondary" className="block mb-3">
              {t('settings.resetToSampleDesc')}
            </Text>
            <Button
              danger
              icon={<ReloadOutlined />}
              onClick={handleResetToSampleData}
            >
              {t('settings.resetToSampleButton')}
            </Button>
          </div>
        </Space>
      </Card>

      {/* App Info */}
      <Card title={<Title level={4} className="mb-0">{t('settings.about')}</Title>}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label={t('settings.version')}>1.0.0</Descriptions.Item>
          <Descriptions.Item label={t('settings.platform')}>Electron + SQLite</Descriptions.Item>
          <Descriptions.Item label={t('settings.componentLibrary')}>Ant Design v5</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
