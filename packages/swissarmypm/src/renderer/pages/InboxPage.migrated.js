import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useInboxStore } from '@/stores/useInboxStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { Card, Button, Input, Badge, Tabs, Steps, Table, Space } from 'antd';
const { TextArea } = Input;
const { Step } = Steps;
export function InboxPage() {
    const { inboxItems, markAsProcessed, createInboxItem } = useInboxStore();
    const { projects, createProject } = useProjectStore();
    const [selectedItem, setSelectedItem] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [entityType, setEntityType] = useState('work_item');
    const [formData, setFormData] = useState({});
    const [newItemText, setNewItemText] = useState('');
    const unprocessedItems = inboxItems.filter(item => item.processed === 0);
    const processedItems = inboxItems.filter(item => item.processed === 1);
    const steps = ['classify', 'extract', 'review'];
    const handleSelectItem = (item) => {
        setSelectedItem(item);
        setCurrentStep(0);
        setFormData({});
    };
    const handleClassify = (type) => {
        setEntityType(type);
        // Auto-extract fields
        const extracted = autoExtract(selectedItem.raw_text, type);
        setFormData(extracted);
        setCurrentStep(1);
    };
    const autoExtract = (text, type) => {
        const data = {};
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
            }
            else if (text.match(/\b(issue|bug|problem|blocker)\b/i)) {
                data.type = 'issue';
            }
            else if (text.match(/\b(phase|stage)\b/i)) {
                data.type = 'phase';
            }
            else if (text.match(/\b(clash|conflict|risk)\b/i)) {
                data.type = 'clash';
            }
            else if (text.match(/\b(remark|note|comment)\b/i)) {
                data.type = 'remark';
            }
            else {
                data.type = 'task';
            }
            // Try to match project
            const projectMatch = projects.find(p => text.toLowerCase().includes(p.name.toLowerCase()));
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
        if (!selectedItem)
            return;
        if (entityType === 'project') {
            const projectData = {
                name: formData.name || formData.title || 'Untitled Project',
                status: formData.status || 'not_started',
                start_date: formData.start_date,
                end_date: formData.end_date,
                owner: formData.owner,
            };
            await createProject(projectData);
        }
        else {
            const workItemData = {
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
        if (!newItemText.trim())
            return;
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
            render: (date) => new Date(date).toLocaleDateString(),
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
            render: (date) => new Date(date).toLocaleDateString(),
        },
    ];
    return (_jsxs("div", { className: "flex h-full", children: [_jsxs("div", { className: "w-96 border-r border-theme-secondary p-4 space-y-4 overflow-auto dark:border-gray-700", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold mb-2", children: "Inbox" }), _jsxs("div", { className: "space-y-2", children: [_jsx(TextArea, { placeholder: "Add new inbox item...", value: newItemText, onChange: (e) => setNewItemText(e.target.value), rows: 3 }), _jsx(Button, { onClick: handleAddInboxItem, className: "w-full", type: "primary", children: "Add to Inbox" })] })] }), _jsx(Tabs, { defaultActiveKey: "unprocessed", items: [
                            {
                                key: 'unprocessed',
                                label: (_jsxs("span", { children: ["Unprocessed", unprocessedItems.length > 0 && (_jsx(Badge, { count: unprocessedItems.length, className: "ml-2" }))] })),
                                children: (_jsx(Table, { dataSource: unprocessedItems, columns: unprocessedColumns, rowKey: "id", pagination: false, size: "small", onRow: (record) => ({
                                        onClick: () => handleSelectItem(record),
                                        style: {
                                            cursor: 'pointer',
                                            backgroundColor: selectedItem?.id === record.id ? '#e6f7ff' : undefined,
                                        },
                                    }) })),
                            },
                            {
                                key: 'processed',
                                label: 'Processed',
                                children: (_jsx(Table, { dataSource: processedItems, columns: processedColumns, rowKey: "id", pagination: false, size: "small" })),
                            },
                        ] })] }), _jsx("div", { className: "flex-1 p-8 overflow-auto", children: !selectedItem ? (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsxs("div", { className: "text-center text-theme-secondary", children: [_jsx("p", { className: "text-lg font-medium", children: "Select an inbox item to process" }), _jsx("p", { className: "text-sm mt-2", children: "Choose an item from the left panel" })] }) })) : (_jsxs("div", { className: "max-w-3xl mx-auto space-y-6", children: [_jsxs(Steps, { current: currentStep, className: "mb-8", children: [_jsx(Step, { title: "Classify", description: "Classify entity type" }), _jsx(Step, { title: "Extract", description: "Extract information" }), _jsx(Step, { title: "Review", description: "Review and create" })] }), _jsx(Card, { title: _jsx("span", { className: "text-sm", children: "Original Inbox Item" }), size: "small", children: _jsx("p", { className: "text-sm bg-theme-container p-3 rounded dark:bg-gray-800", children: selectedItem.raw_text }) }), currentStep === 0 && (_jsx(Card, { title: "Step 1: Classify Entity Type", children: _jsxs(Space, { direction: "vertical", style: { width: '100%' }, size: "middle", children: [_jsx("p", { className: "text-sm text-theme-secondary", children: "What type of entity should this create?" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs(Button, { size: "large", className: "h-24 flex flex-col items-center justify-center", onClick: () => handleClassify('project'), children: [_jsx("span", { className: "text-lg font-semibold", children: "Project" }), _jsx("span", { className: "text-xs text-theme-secondary", children: "A new project container" })] }), _jsxs(Button, { size: "large", type: "primary", className: "h-24 flex flex-col items-center justify-center", onClick: () => handleClassify('work_item'), children: [_jsx("span", { className: "text-lg font-semibold", children: "Work Item" }), _jsx("span", { className: "text-xs", children: "A task, milestone, or issue" })] })] })] }) })), currentStep === 1 && (_jsx(Card, { title: "Step 2: Review Extracted Information", children: _jsxs(Space, { direction: "vertical", style: { width: '100%' }, size: "middle", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Title/Name" }), _jsx(Input, { value: formData.title || formData.name, onChange: (e) => setFormData({ ...formData, title: e.target.value }) })] }), entityType === 'work_item' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Type" }), _jsx(Input, { value: formData.type, disabled: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Project" }), _jsx(Input, { value: projects.find(p => p.id === formData.project_id)?.name || 'None', disabled: true })] })] })), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Start Date" }), _jsx(Input, { type: "date", value: formData.start_date, onChange: (e) => setFormData({ ...formData, start_date: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "End Date" }), _jsx(Input, { type: "date", value: formData.end_date, onChange: (e) => setFormData({ ...formData, end_date: e.target.value }) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Status" }), _jsx(Input, { value: formData.status || 'not_started', disabled: true })] })] }), _jsxs("div", { className: "flex gap-2 pt-4", children: [_jsx(Button, { onClick: () => setCurrentStep(0), children: "Back" }), _jsxs(Button, { type: "primary", onClick: handleSubmit, children: ["Create ", entityType === 'project' ? 'Project' : 'Work Item'] })] })] }) }))] })) })] }));
}
