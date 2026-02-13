import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useUIStore } from '@/stores/useUIStore';
import { useI18n } from '@/hooks/useI18n';
import { ipc } from '@/lib/ipc';
import { loadSampleData } from '@/lib/sampleData';
import { Card, Input, Button, Alert, Space, Typography, Modal, Upload, Descriptions, Select } from 'antd';
import { ExclamationCircleOutlined, DownloadOutlined, UploadOutlined, ReloadOutlined } from '@ant-design/icons';
const { Title, Text } = Typography;
const { Dragger } = Upload;
export function SettingsPage() {
    const { workspace, updateWorkspaceName } = useWorkspaceStore();
    const { language, setLanguage } = useUIStore();
    const { t } = useI18n();
    const [workspaceName, setWorkspaceName] = useState(workspace?.name || '');
    const [message, setMessage] = useState(null);
    const handleUpdateWorkspace = async () => {
        if (!workspaceName.trim())
            return;
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
        }
        else {
            setMessage({ type: 'error', text: t('settings.exportFailed') });
        }
    };
    const handleImport = async (file) => {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            const result = await ipc.settings.import(data);
            if (result.success) {
                setMessage({ type: 'success', text: t('settings.importSuccess') });
                setTimeout(() => window.location.reload(), 2000);
            }
            else {
                setMessage({ type: 'error', text: t('settings.importFailed') });
            }
        }
        catch (error) {
            setMessage({ type: 'error', text: t('settings.invalidImportFile') });
        }
    };
    const handleResetToSampleData = async () => {
        Modal.confirm({
            title: t('settings.resetConfirmTitle'),
            icon: _jsx(ExclamationCircleOutlined, {}),
            content: (_jsxs("div", { children: [_jsx("p", { children: t('settings.resetConfirmContent1') }), _jsx("p", { children: t('settings.resetConfirmContent2') })] })),
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
                }
                catch (error) {
                    setMessage({ type: 'error', text: t('settings.resetFailed') });
                }
            },
        });
    };
    const uploadProps = {
        name: 'file',
        accept: '.json',
        beforeUpload: (file) => {
            handleImport(file);
            return false;
        },
        showUploadList: false,
    };
    return (_jsxs("div", { className: "p-8 max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { children: [_jsx(Title, { level: 2, children: t('settings.title') }), _jsx(Text, { type: "secondary", children: t('settings.subtitle') })] }), message && (_jsx(Alert, { message: message.text, type: message.type, showIcon: true, closable: true, onClose: () => setMessage(null) })), _jsx(Card, { title: _jsx(Title, { level: 4, className: "mb-0", children: t('settings.workspace') }), children: _jsx(Space, { direction: "vertical", style: { width: '100%' }, size: "middle", children: _jsxs("div", { children: [_jsx(Text, { strong: true, children: t('settings.workspaceName') }), _jsxs("div", { className: "flex gap-2 mt-2", children: [_jsx(Input, { value: workspaceName, onChange: (e) => setWorkspaceName(e.target.value), placeholder: t('settings.workspaceNamePlaceholder'), style: { flex: 1 } }), _jsx(Button, { type: "primary", onClick: handleUpdateWorkspace, children: t('settings.updateWorkspace') })] })] }) }) }), _jsx(Card, { title: _jsx(Title, { level: 4, className: "mb-0", children: t('settings.language') }), children: _jsx(Space, { direction: "vertical", style: { width: '100%' }, children: _jsxs("div", { children: [_jsx(Text, { type: "secondary", className: "block mb-3", children: t('settings.languageDesc') }), _jsx(Select, { value: language, onChange: setLanguage, style: { width: 200 }, options: [
                                    { label: t('settings.languageChinese'), value: 'zh' },
                                    { label: t('settings.languageEnglish'), value: 'en' },
                                ] })] }) }) }), _jsx(Card, { title: _jsx(Title, { level: 4, className: "mb-0", children: t('settings.dataManagement') }), children: _jsxs(Space, { direction: "vertical", style: { width: '100%' }, size: "large", children: [_jsxs("div", { children: [_jsx(Title, { level: 5, children: t('settings.exportData') }), _jsx(Text, { type: "secondary", className: "block mb-3", children: t('settings.exportDataDesc') }), _jsx(Button, { icon: _jsx(DownloadOutlined, {}), onClick: handleExport, children: t('settings.exportDataButton') })] }), _jsxs("div", { className: "border-t border-gray-100 pt-4 dark:border-gray-700", children: [_jsx(Title, { level: 5, children: t('settings.importData') }), _jsx(Text, { type: "secondary", className: "block mb-3", children: t('settings.importDataDesc') }), _jsxs(Dragger, { ...uploadProps, style: { maxWidth: '500px' }, children: [_jsx("p", { className: "ant-upload-drag-icon", children: _jsx(UploadOutlined, {}) }), _jsx("p", { className: "ant-upload-text", children: t('settings.importUploadText') }), _jsx("p", { className: "ant-upload-hint", children: t('settings.importFileHint') })] })] }), _jsxs("div", { className: "border-t border-gray-100 pt-4 dark:border-gray-700", children: [_jsx(Title, { level: 5, children: t('settings.resetToSample') }), _jsx(Text, { type: "secondary", className: "block mb-3", children: t('settings.resetToSampleDesc') }), _jsx(Button, { danger: true, icon: _jsx(ReloadOutlined, {}), onClick: handleResetToSampleData, children: t('settings.resetToSampleButton') })] })] }) }), _jsx(Card, { title: _jsx(Title, { level: 4, className: "mb-0", children: t('settings.about') }), children: _jsxs(Descriptions, { column: 1, size: "small", children: [_jsx(Descriptions.Item, { label: t('settings.version'), children: "1.0.0" }), _jsx(Descriptions.Item, { label: t('settings.platform'), children: "Electron + SQLite" }), _jsx(Descriptions.Item, { label: t('settings.componentLibrary'), children: "Ant Design v5" })] }) })] }));
}
