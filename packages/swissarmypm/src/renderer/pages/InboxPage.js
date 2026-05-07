import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useInboxStore } from '@/stores/useInboxStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { Card, Button, Input, Tabs, Badge, Empty, Typography, Space, Table, Steps, Select, Radio, Tag, Divider, Alert, } from 'antd';
const { Title, Text } = Typography;
export function InboxPage() {
    const { inboxItems, markAsProcessed, createInboxItem } = useInboxStore();
    const { projects, createProject } = useProjectStore();
    const [selectedItem, setSelectedItem] = useState(null);
    const [currentStep, setCurrentStep] = useState('classify');
    const [entityType, setEntityType] = useState('work_item');
    const [formData, setFormData] = useState({});
    const [newItemText, setNewItemText] = useState('');
    const [activeTab, setActiveTab] = useState('unprocessed');
    const unprocessedItems = inboxItems.filter((item) => item.processed === 0);
    const processedItems = inboxItems.filter((item) => item.processed === 1);
    const handleSelectItem = (item) => {
        setSelectedItem(item);
        setCurrentStep('classify');
        setEntityType('work_item');
        setFormData({});
    };
    const handleClassify = (type) => {
        setEntityType(type);
        const extracted = autoExtract(selectedItem.raw_text, type);
        setFormData(extracted);
        setCurrentStep('extract');
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
            // For now, just mark as processed
        }
        await markAsProcessed(selectedItem.id);
        setSelectedItem(null);
        setCurrentStep('classify');
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
    // Table columns for inbox items
    const columns = [
        {
            title: 'Item',
            dataIndex: 'raw_text',
            key: 'raw_text',
            render: (text, record) => (_jsx("div", { className: `cursor-pointer p-2 rounded transition-colors ${selectedItem?.id === record.id
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`, onClick: () => handleSelectItem(record), children: _jsx("div", { className: "line-clamp-2", children: text }) })),
        },
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 100,
            render: (date) => (_jsx(Text, { type: "secondary", className: "text-xs", children: new Date(date).toLocaleDateString() })),
        },
    ];
    const getStepNumber = (step) => {
        const steps = { classify: 0, extract: 1, review: 2 };
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
            label: (_jsxs("span", { children: ["Unprocessed", unprocessedItems.length > 0 && (_jsx(Badge, { count: unprocessedItems.length, className: "ml-2" }))] })),
            children: unprocessedItems.length === 0 ? (_jsx(Empty, { description: "No unprocessed items" })) : (_jsx(Table, { columns: columns, dataSource: unprocessedItems, rowKey: "id", pagination: false, size: "small", showHeader: false })),
        },
        {
            key: 'processed',
            label: 'Processed',
            children: processedItems.length === 0 ? (_jsx(Empty, { description: "No processed items" })) : (_jsx(Table, { columns: columns, dataSource: processedItems, rowKey: "id", pagination: false, size: "small", showHeader: false })),
        },
    ];
    return (_jsxs("div", { className: "flex h-full", children: [_jsxs("div", { className: "w-96 border-r border-gray-200 dark:border-gray-700 p-4 space-y-4 overflow-auto", children: [_jsxs("div", { children: [_jsx(Title, { level: 4, children: "Inbox" }), _jsxs(Space, { direction: "vertical", className: "w-full", size: "middle", children: [_jsx(Input.TextArea, { placeholder: "Add new inbox item...", value: newItemText, onChange: (e) => setNewItemText(e.target.value), rows: 3 }), _jsx(Button, { type: "primary", onClick: handleAddInboxItem, block: true, children: "Add to Inbox" })] })] }), _jsx(Tabs, { activeKey: activeTab, onChange: setActiveTab, type: "card", items: tabItems })] }), _jsx("div", { className: "flex-1 p-8 overflow-auto", children: !selectedItem ? (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsx(Empty, { description: _jsxs(Space, { direction: "vertical", children: [_jsx(Text, { children: "Select an inbox item to process" }), _jsx(Text, { type: "secondary", children: "Choose an item from the left panel" })] }) }) })) : (_jsxs("div", { className: "max-w-3xl mx-auto space-y-6", children: [_jsx(Steps, { current: getStepNumber(currentStep), items: [{ title: 'Classify' }, { title: 'Extract' }, { title: 'Review' }] }), _jsx(Divider, {}), _jsx(Card, { size: "small", children: _jsxs(Space, { direction: "vertical", className: "w-full", children: [_jsx(Text, { strong: true, type: "secondary", children: "Original Inbox Item" }), _jsx("div", { className: "bg-gray-50 dark:bg-gray-800 p-3 rounded", children: _jsx(Text, { children: selectedItem.raw_text }) })] }) }), currentStep === 'classify' && (_jsx(Card, { title: "Step 1: Classify Entity Type", children: _jsxs(Space, { direction: "vertical", size: "large", className: "w-full", children: [_jsx(Text, { type: "secondary", children: "What type of entity should this create?" }), _jsx(Radio.Group, { value: entityType, onChange: (e) => setEntityType(e.target.value), className: "w-full", children: _jsxs(Space, { direction: "vertical", className: "w-full", children: [_jsx(Radio, { value: "project", className: "w-full p-4 border rounded hover:bg-gray-50 dark:hover:bg-gray-800", children: _jsxs(Space, { direction: "vertical", size: 0, children: [_jsx(Text, { strong: true, children: "Project" }), _jsx(Text, { type: "secondary", className: "text-xs", children: "A new project container" })] }) }), _jsx(Radio, { value: "work_item", className: "w-full p-4 border rounded hover:bg-gray-50 dark:hover:bg-gray-800", children: _jsxs(Space, { direction: "vertical", size: 0, children: [_jsx(Text, { strong: true, children: "Work Item" }), _jsx(Text, { type: "secondary", className: "text-xs", children: "Task, issue, milestone, phase, remark, or clash" })] }) })] }) }), _jsx(Button, { type: "primary", size: "large", onClick: () => handleClassify(entityType), block: true, children: "Next: Extract Fields" })] }) })), currentStep === 'extract' && (_jsx(Card, { title: "Step 2: Review Extracted Fields", children: _jsxs(Space, { direction: "vertical", size: "middle", className: "w-full", children: [_jsx(Alert, { message: "Auto-extracted from text", description: "Review the auto-extracted information below and edit if needed.", type: "info", showIcon: true }), _jsxs(Space, { direction: "vertical", className: "w-full", children: [_jsx(Text, { strong: true, children: entityType === 'project' ? 'Project Name' : 'Title' }), _jsx(Input, { value: formData.title || formData.name || '', onChange: (e) => setFormData({
                                                    ...formData,
                                                    [entityType === 'project' ? 'name' : 'title']: e.target.value,
                                                }), placeholder: `Enter ${entityType === 'project' ? 'project name' : 'title'}` })] }), entityType === 'work_item' && (_jsxs(_Fragment, { children: [_jsxs(Space, { direction: "vertical", className: "w-full", children: [_jsx(Text, { strong: true, children: "Type" }), _jsx(Select, { value: formData.type, onChange: (value) => setFormData({ ...formData, type: value }), options: workItemTypes, placeholder: "Select work item type", className: "w-full" })] }), _jsxs(Space, { direction: "vertical", className: "w-full", children: [_jsx(Text, { strong: true, children: "Project" }), _jsx(Select, { value: formData.project_id, onChange: (value) => setFormData({ ...formData, project_id: value }), options: projects.map((p) => ({ value: p.id, label: p.name })), placeholder: "Select project", className: "w-full", showSearch: true, filterOption: (input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) })] })] })), _jsxs(Space, { direction: "vertical", className: "w-full", children: [_jsx(Text, { strong: true, children: "Status" }), _jsx(Select, { value: formData.status, onChange: (value) => setFormData({ ...formData, status: value }), options: statusOptions, placeholder: "Select status", className: "w-full" })] }), _jsxs(Space, { direction: "horizontal", className: "w-full", children: [_jsxs(Space, { direction: "vertical", className: "flex-1", children: [_jsx(Text, { strong: true, children: "Start Date" }), _jsx(Input, { type: "date", value: formData.start_date || '', onChange: (e) => setFormData({ ...formData, start_date: e.target.value }) })] }), _jsxs(Space, { direction: "vertical", className: "flex-1", children: [_jsx(Text, { strong: true, children: "End Date" }), _jsx(Input, { type: "date", value: formData.end_date || '', onChange: (e) => setFormData({ ...formData, end_date: e.target.value }) })] })] }), _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx(Button, { onClick: () => setCurrentStep('classify'), children: "Back" }), _jsx(Button, { type: "primary", onClick: () => setCurrentStep('review'), children: "Next: Review" })] })] }) })), currentStep === 'review' && (_jsx(Card, { title: "Step 3: Review and Create", children: _jsxs(Space, { direction: "vertical", size: "large", className: "w-full", children: [_jsx(Alert, { message: "Ready to create", description: "Review the final entity details before creating.", type: "success", showIcon: true }), _jsx(Card, { type: "inner", size: "small", children: _jsxs(Space, { direction: "vertical", className: "w-full", size: "small", children: [_jsxs("div", { children: [_jsx(Text, { type: "secondary", children: "Entity Type:" }), _jsx(Tag, { color: entityType === 'project' ? 'blue' : 'green', className: "ml-2", children: entityType === 'project' ? 'Project' : 'Work Item' })] }), _jsxs("div", { children: [_jsxs(Text, { type: "secondary", children: [entityType === 'project' ? 'Name' : 'Title', ":"] }), _jsx("div", { children: _jsx(Text, { strong: true, children: formData.title || formData.name }) })] }), formData.type && (_jsxs("div", { children: [_jsx(Text, { type: "secondary", children: "Type:" }), _jsx("div", { children: _jsx(Tag, { children: formData.type }) })] })), formData.status && (_jsxs("div", { children: [_jsx(Text, { type: "secondary", children: "Status:" }), _jsx("div", { children: _jsx(Tag, { color: formData.status === 'done'
                                                                    ? 'success'
                                                                    : formData.status === 'blocked'
                                                                        ? 'error'
                                                                        : formData.status === 'in_progress'
                                                                            ? 'processing'
                                                                            : 'default', children: statusOptions.find((s) => s.value === formData.status)?.label ||
                                                                    formData.status }) })] })), formData.project_id && (_jsxs("div", { children: [_jsx(Text, { type: "secondary", children: "Project:" }), _jsx("div", { children: _jsx(Text, { children: projects.find((p) => p.id === formData.project_id)?.name }) })] })), (formData.start_date || formData.end_date) && (_jsxs("div", { children: [_jsx(Text, { type: "secondary", children: "Dates:" }), _jsx("div", { children: _jsxs(Text, { children: [formData.start_date || '—', " \u2192 ", formData.end_date || '—'] }) })] }))] }) }), _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx(Button, { onClick: () => setCurrentStep('extract'), children: "Back" }), _jsx(Button, { type: "primary", onClick: handleSubmit, size: "large", children: "Create Entity & Mark Processed" })] })] }) }))] })) })] }));
}
