import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Input, Button, Table, Tag, Typography, Empty, Space, Tabs, Progress, Statistic, Row, Col, Divider, Select, Modal, Form, Dropdown, } from 'antd';
import { CaretRightOutlined, CaretDownOutlined, UserOutlined, CalendarOutlined, FlagOutlined, ExclamationCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, StopOutlined, PlusOutlined, MoreOutlined, EditOutlined, DeleteOutlined, CloseOutlined, } from '@ant-design/icons';
import { useProjectStore } from '@/stores/useProjectStore';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
const { Title } = Typography;
// ============================================================================
// Shared option sets
// ============================================================================
const STATUS_OPTIONS = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'done', label: 'Done' },
];
const TYPE_OPTIONS = [
    { value: 'task', label: 'Task' },
    { value: 'issue', label: 'Issue' },
    { value: 'milestone', label: 'Milestone' },
    { value: 'phase', label: 'Phase' },
    { value: 'remark', label: 'Remark' },
    { value: 'clash', label: 'Clash' },
];
const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
];
const PRIORITY_COLORS = {
    low: 'default', medium: 'blue', high: 'orange', critical: 'red',
};
// ============================================================================
// Sponsor mapping (placeholder until sponsor field is added to DB)
// ============================================================================
const SPONSORS = {
    'ERP Migration': 'Lisa Park – VP Engineering',
    'Mobile App Development': 'James Wright – CTO',
    'Cloud Infrastructure Upgrade': 'Nina Patel – VP Infrastructure',
    'Security Compliance Initiative': 'Mark Torres – CISO',
};
function getSponsor(name) {
    return SPONSORS[name] || 'TBD';
}
// ============================================================================
// Budget helpers (placeholder until budget fields are added to DB)
// ============================================================================
function getBudget(project) {
    const hash = project.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const planned = Math.round((hash % 80 + 20) * 10000);
    const progressPct = project.status === 'done' ? 88 : project.status === 'blocked' ? 32 : 56;
    const spent = Math.round((planned * (progressPct + (hash % 12))) / 100);
    return { planned, spent, remaining: planned - spent };
}
function classifyCategory(item) {
    const blob = `${item.title} ${item.notes || ''}`.toLowerCase();
    if (blob.includes('budget') || blob.includes('cost') || blob.includes('pricing'))
        return 'Budget';
    if (blob.includes('vendor') || blob.includes('sla') || blob.includes('external'))
        return 'External';
    if (blob.includes('resource') || blob.includes('team') || blob.includes('consultant'))
        return 'Resource';
    if (blob.includes('schedule') || blob.includes('timeline') || blob.includes('deadline'))
        return 'Schedule';
    return 'Technical';
}
function classifyImpact(item) {
    if (item.status === 'blocked' || item.type === 'clash')
        return 'High';
    const notes = (item.notes || '').toLowerCase();
    if (notes.includes('critical') || notes.includes('immediate'))
        return 'High';
    if (notes.includes('low') || notes.includes('minor'))
        return 'Low';
    return 'Medium';
}
function deriveRisks(workItems, owner) {
    const risks = [];
    const seen = new Set();
    const push = (item) => {
        if (seen.has(item.id))
            return;
        seen.add(item.id);
        risks.push({
            id: item.id,
            title: item.title,
            category: classifyCategory(item),
            impact: classifyImpact(item),
            likelihood: item.status === 'blocked' ? 'High' : 'Medium',
            status: item.status === 'done' ? 'Resolved' : item.status === 'blocked' ? 'Open' : 'Mitigating',
            owner: owner || 'Unassigned',
            notes: item.notes || '',
        });
    };
    const walk = (items) => {
        items.forEach((item) => {
            if (item.type === 'issue' || item.type === 'clash' || item.status === 'blocked') {
                push(item);
            }
            if (item.children)
                walk(item.children);
        });
    };
    walk(workItems);
    return risks;
}
// ============================================================================
// Shared UI helpers
// ============================================================================
const STATUS_CFG = {
    done: { color: 'success', label: 'Done', icon: _jsx(CheckCircleOutlined, {}) },
    in_progress: { color: 'processing', label: 'In Progress', icon: _jsx(ClockCircleOutlined, {}) },
    blocked: { color: 'error', label: 'Blocked', icon: _jsx(StopOutlined, {}) },
    not_started: { color: 'default', label: 'Not Started', icon: _jsx(FlagOutlined, {}) },
};
function StatusTag({ status }) {
    const cfg = STATUS_CFG[status] || STATUS_CFG.not_started;
    return _jsxs(Tag, { color: cfg.color, children: [cfg.icon, " ", cfg.label] });
}
const TYPE_COLORS = {
    task: 'blue', issue: 'red', milestone: 'purple',
    phase: 'green', remark: 'orange', clash: '#d9534f',
};
// ============================================================================
// Budget breakdown rows (deterministic from totals)
// ============================================================================
function budgetBreakdown(planned, spent) {
    const cats = [
        { key: 'dev', category: 'Development', pAll: 0.45, pSpent: 0.48 },
        { key: 'infra', category: 'Infrastructure', pAll: 0.25, pSpent: 0.22 },
        { key: 'pm', category: 'Management', pAll: 0.15, pSpent: 0.18 },
        { key: 'other', category: 'Other / Reserve', pAll: 0.15, pSpent: 0.12 },
    ];
    return cats.map((c) => {
        const allocated = Math.round(planned * c.pAll);
        const catSpent = Math.round(spent * c.pSpent);
        return {
            key: c.key,
            category: c.category,
            allocated,
            spent: catSpent,
            pct: allocated > 0 ? Math.min(Math.round((catSpent / allocated) * 100), 100) : 0,
        };
    });
}
// ============================================================================
// InlineEdit – click text to edit in place
// ============================================================================
function InlineEdit({ value, onSave, type = 'text', placeholder = '—', options, multiline = false, renderDisplay, }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState('');
    const cancelled = useRef(false);
    if (!editing) {
        let display;
        if (renderDisplay) {
            display = renderDisplay();
        }
        else if (type === 'select' && options) {
            display = options.find((o) => o.value === value)?.label || placeholder;
        }
        else {
            display = value != null && value !== '' ? String(value) : placeholder;
        }
        return (_jsx("span", { className: "cursor-pointer hover:text-blue-500 transition-colors", onClick: () => { setVal(value ?? ''); cancelled.current = false; setEditing(true); }, children: display }));
    }
    const done = (v) => { onSave(v ?? val); setEditing(false); };
    const cancel = () => { cancelled.current = true; setEditing(false); };
    if (type === 'select' && options) {
        return (_jsx(Select, { value: val === '' || val == null ? undefined : val, size: "small", options: options, allowClear: true, defaultOpen: true, onChange: (v) => done(v), onDropdownVisibleChange: (visible) => { if (!visible)
                cancel(); }, style: { width: '100%' }, getPopupContainer: (trigger) => trigger.parentElement }));
    }
    if (multiline) {
        return (_jsx(Input.TextArea, { value: val, autoFocus: true, rows: 2, size: "small", onChange: (e) => setVal(e.target.value), onBlur: () => { if (!cancelled.current)
                done(); }, onKeyDown: (e) => { if (e.key === 'Escape')
                cancel(); } }));
    }
    return (_jsx(Input, { value: val, autoFocus: true, size: "small", type: type, onChange: (e) => setVal(e.target.value), onBlur: () => { if (!cancelled.current)
            done(); }, onKeyDown: (e) => {
            if (e.key === 'Enter')
                e.currentTarget.blur();
            if (e.key === 'Escape')
                cancel();
        } }));
}
export function DashboardProjectDetailView({ projectId, onClose }) {
    const { projects, updateProject, deleteProject } = useProjectStore();
    const { workItemsByProject, loadWorkItemsByProject, createWorkItem, updateWorkItem, deleteWorkItem } = useWorkItemStore();
    const { portfolios, getPortfolioById } = usePortfolioStore();
    const [activeTab, setActiveTab] = useState('overview');
    // Work item modal
    const [addWorkItemOpen, setAddWorkItemOpen] = useState(false);
    const [workItemForm] = Form.useForm();
    // Inline row editing (work items table)
    const [editingRowKey, setEditingRowKey] = useState(null);
    const [rowValues, setRowValues] = useState({});
    const selectedProject = projectId ? projects.find((p) => p.id === projectId) : null;
    useEffect(() => {
        if (projectId) {
            loadWorkItemsByProject(projectId);
        }
    }, [projectId, loadWorkItemsByProject]);
    if (!selectedProject) {
        return (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsx(Empty, { description: "Select a project to view details", image: Empty.PRESENTED_IMAGE_SIMPLE }) }));
    }
    const workItems = workItemsByProject.get(selectedProject.id) || [];
    const flatWorkItems = useMemo(() => {
        const flatten = (items, parentKey = null) => {
            const out = [];
            items.forEach((item) => {
                const key = parentKey ? `${parentKey}-${item.id}` : `${item.id}`;
                out.push({ ...item, key });
                if (item.children?.length)
                    out.push(...flatten(item.children, key));
            });
            return out;
        };
        return flatten(workItems);
    }, [workItems]);
    const saveProjectField = (updates) => {
        updateProject(selectedProject.id, updates);
    };
    const handleDeleteProject = () => {
        Modal.confirm({
            title: 'Delete Project',
            content: `Are you sure you want to delete "${selectedProject.name}"? All associated work items will also be removed.`,
            okText: 'Delete',
            okButtonProps: { danger: true },
            onOk: async () => {
                await deleteProject(selectedProject.id);
                onClose();
            },
        });
    };
    const openAddWorkItem = (presetType = 'task') => {
        workItemForm.resetFields();
        workItemForm.setFieldsValue({ type: presetType, status: 'not_started' });
        setAddWorkItemOpen(true);
    };
    const handleAddWorkItem = async () => {
        try {
            await workItemForm.validateFields();
            const values = workItemForm.getFieldsValue();
            await createWorkItem({
                project_id: selectedProject.id,
                parent_id: values.parent_id || undefined,
                type: values.type,
                title: values.title,
                status: values.status || 'not_started',
                start_date: values.start_date || undefined,
                end_date: values.end_date || undefined,
                notes: values.notes || undefined,
                owner: values.owner || undefined,
                priority: values.priority || undefined,
            });
            workItemForm.resetFields();
            setAddWorkItemOpen(false);
            await loadWorkItemsByProject(selectedProject.id);
        }
        catch (_e) {
            // validation
        }
    };
    const handleDeleteWorkItem = (id) => {
        const item = flatWorkItems.find((wi) => wi.id === id);
        Modal.confirm({
            title: 'Delete Work Item',
            content: `Are you sure you want to delete "${item?.title || 'this item'}"?`,
            okText: 'Delete',
            okButtonProps: { danger: true },
            onOk: async () => {
                await deleteWorkItem(id);
                await loadWorkItemsByProject(selectedProject.id);
            },
        });
    };
    const startEditRow = (record) => {
        setEditingRowKey(record.key);
        setRowValues({
            title: record.title,
            type: record.type,
            status: record.status,
            start_date: record.start_date || '',
            end_date: record.end_date || '',
            notes: record.notes || '',
            owner: record.owner || '',
            priority: record.priority || 'medium',
        });
    };
    const saveEditRow = async (record) => {
        if (!rowValues.title)
            return;
        await updateWorkItem(record.id, {
            title: rowValues.title,
            type: rowValues.type,
            status: rowValues.status,
            start_date: rowValues.start_date || undefined,
            end_date: rowValues.end_date || undefined,
            notes: rowValues.notes || undefined,
            owner: rowValues.owner || undefined,
            priority: rowValues.priority || undefined,
        });
        setEditingRowKey(null);
    };
    const cancelEditRow = () => setEditingRowKey(null);
    const risks = useMemo(() => deriveRisks(workItems, selectedProject.owner || null), [workItems, selectedProject]);
    const budget = useMemo(() => (selectedProject ? getBudget(selectedProject) : { planned: 0, spent: 0, remaining: 0 }), [selectedProject]);
    const stats = useMemo(() => {
        const total = flatWorkItems.length;
        const done = flatWorkItems.filter((i) => i.status === 'done').length;
        const blocked = flatWorkItems.filter((i) => i.status === 'blocked').length;
        const inProgress = flatWorkItems.filter((i) => i.status === 'in_progress').length;
        return { total, done, blocked, inProgress };
    }, [flatWorkItems]);
    const portfolioName = selectedProject.portfolio_id
        ? getPortfolioById(selectedProject.portfolio_id)?.name || `Portfolio #${selectedProject.portfolio_id}`
        : null;
    const workItemColumns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => {
                if (record.key === editingRowKey) {
                    return (_jsxs(Space, { style: { width: '100%' }, children: [_jsx(Select, { value: rowValues.type, size: "small", options: TYPE_OPTIONS, onChange: (v) => setRowValues((prev) => ({ ...prev, type: v })), style: { width: 100 } }), _jsx(Input, { value: rowValues.title, size: "small", onChange: (e) => setRowValues((prev) => ({ ...prev, title: e.target.value })), style: { flex: 1 } })] }));
                }
                return (_jsxs(Space, { children: [_jsx(Tag, { color: TYPE_COLORS[record.type] || 'default', style: { margin: 0, fontSize: 11 }, children: record.type }), _jsx("span", { className: record.level === 2 ? 'text-sm text-theme-primary ml-2' : 'text-sm font-medium', children: text })] }));
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            render: (s, record) => {
                if (record.key === editingRowKey) {
                    return (_jsx(Select, { value: rowValues.status, size: "small", options: STATUS_OPTIONS, onChange: (v) => setRowValues((prev) => ({ ...prev, status: v })) }));
                }
                return _jsx(StatusTag, { status: s });
            },
        },
        {
            title: 'Start',
            dataIndex: 'start_date',
            key: 'start_date',
            width: 110,
            render: (d, record) => {
                if (record.key === editingRowKey) {
                    return _jsx(Input, { type: "date", value: rowValues.start_date, size: "small", onChange: (e) => setRowValues((prev) => ({ ...prev, start_date: e.target.value })) });
                }
                return _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: d || '—' });
            },
        },
        {
            title: 'End',
            dataIndex: 'end_date',
            key: 'end_date',
            width: 110,
            render: (d, record) => {
                if (record.key === editingRowKey) {
                    return _jsx(Input, { type: "date", value: rowValues.end_date, size: "small", onChange: (e) => setRowValues((prev) => ({ ...prev, end_date: e.target.value })) });
                }
                return _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: d || '—' });
            },
        },
        {
            title: 'Owner',
            dataIndex: 'owner',
            key: 'owner',
            width: 110,
            render: (o, record) => {
                if (record.key === editingRowKey) {
                    return _jsx(Input, { value: rowValues.owner, size: "small", placeholder: "Assignee", onChange: (e) => setRowValues((prev) => ({ ...prev, owner: e.target.value })) });
                }
                return _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: o || '—' });
            },
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            width: 95,
            render: (p, record) => {
                if (record.key === editingRowKey) {
                    return (_jsx(Select, { value: rowValues.priority, size: "small", options: PRIORITY_OPTIONS, onChange: (v) => setRowValues((prev) => ({ ...prev, priority: v })) }));
                }
                return p ? _jsx(Tag, { color: PRIORITY_COLORS[p] || 'default', style: { margin: 0, fontSize: 11 }, children: p }) : _jsx("span", { className: "text-xs text-gray-400", children: "\u2014" });
            },
        },
        {
            title: 'Notes',
            dataIndex: 'notes',
            key: 'notes',
            ellipsis: true,
            render: (n, record) => {
                if (record.key === editingRowKey) {
                    return _jsx(Input, { value: rowValues.notes, size: "small", onChange: (e) => setRowValues((prev) => ({ ...prev, notes: e.target.value })) });
                }
                return _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: n || '—' });
            },
        },
        {
            title: '',
            key: 'actions',
            width: 80,
            render: (_, record) => {
                if (record.key === editingRowKey) {
                    return (_jsxs(Space, { size: "small", children: [_jsx(Button, { type: "link", size: "small", icon: _jsx(CheckCircleOutlined, {}), onClick: () => saveEditRow(record), style: { padding: 0, color: '#52c41a' } }), _jsx(Button, { type: "link", size: "small", icon: _jsx(CloseOutlined, {}), onClick: cancelEditRow, style: { padding: 0, color: '#ff4d4f' } })] }));
                }
                return (_jsxs(Space, { size: "small", children: [_jsx(Button, { type: "link", size: "small", icon: _jsx(EditOutlined, {}), onClick: () => startEditRow(record), style: { padding: 0 } }), _jsx(Button, { type: "link", size: "small", icon: _jsx(DeleteOutlined, {}), danger: true, onClick: () => handleDeleteWorkItem(record.id), style: { padding: 0 } })] }));
            },
        },
    ];
    const riskColumns = [
        {
            title: 'Risk',
            dataIndex: 'title',
            key: 'title',
            render: (t) => _jsx("span", { className: "text-sm font-medium", children: t }),
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 100,
            render: (v) => {
                const map = { Technical: 'blue', Resource: 'orange', Schedule: 'purple', Budget: 'green', External: 'red' };
                return _jsx(Tag, { color: map[v] || 'default', children: v });
            },
        },
        {
            title: 'Impact',
            dataIndex: 'impact',
            key: 'impact',
            width: 75,
            render: (v) => {
                const map = { High: 'red', Medium: 'orange', Low: 'green' };
                return _jsx(Tag, { color: map[v], children: v });
            },
        },
        {
            title: 'Likelihood',
            dataIndex: 'likelihood',
            key: 'likelihood',
            width: 90,
            render: (v) => {
                const map = { High: 'red', Medium: 'orange', Low: 'green' };
                return _jsx(Tag, { color: map[v] || 'default', children: v });
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (v) => {
                const map = { Open: 'error', Mitigating: 'warning', Resolved: 'success' };
                return _jsx(Tag, { color: map[v] || 'default', children: v });
            },
        },
        {
            title: 'Notes',
            dataIndex: 'notes',
            key: 'notes',
            ellipsis: true,
            render: (n) => _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: n || '—' }),
        },
    ];
    const budgetBreakdownColumns = [
        { title: 'Category', dataIndex: 'category', key: 'category', render: (t) => _jsx("span", { className: "text-sm font-medium", children: t }) },
        { title: 'Allocated', dataIndex: 'allocated', key: 'allocated', width: 110, render: (v) => _jsxs("span", { className: "text-sm", children: ["$", v.toLocaleString()] }) },
        { title: 'Spent', dataIndex: 'spent', key: 'spent', width: 110, render: (v) => _jsxs("span", { className: "text-sm", children: ["$", v.toLocaleString()] }) },
        {
            title: '% Used',
            dataIndex: 'pct',
            key: 'pct',
            width: 110,
            render: (v) => _jsx(Progress, { percent: v, size: "small", strokeColor: v > 90 ? '#ff4d4f' : v > 75 ? '#faad14' : '#52c41a', showInfo: true }),
        },
    ];
    return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsx("div", { className: "px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsx(Title, { level: 3, className: "mb-0", children: selectedProject.name }), _jsx(InlineEdit, { value: selectedProject.status, type: "select", options: STATUS_OPTIONS, onSave: (v) => saveProjectField({ status: v }), renderDisplay: () => _jsx(StatusTag, { status: selectedProject.status }) })] }), _jsxs("div", { className: "flex items-center gap-4 mt-1.5 text-sm text-gray-500 dark:text-gray-400 flex-wrap", children: [selectedProject.owner && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(UserOutlined, {}), " ", selectedProject.owner] })), selectedProject.start_date && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(CalendarOutlined, {}), " ", selectedProject.start_date, " \u2192 ", selectedProject.end_date || '—'] })), portfolioName && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(FlagOutlined, {}), " ", portfolioName] }))] })] }), _jsxs(Space, { children: [_jsx(Button, { size: "small", icon: _jsx(PlusOutlined, {}), onClick: () => openAddWorkItem(), children: "Add Item" }), _jsx(Dropdown, { menu: {
                                        items: [
                                            { key: 'delete', icon: _jsx(DeleteOutlined, {}), label: 'Delete Project', danger: true, onClick: handleDeleteProject },
                                        ],
                                    }, trigger: ['click'], children: _jsx(Button, { size: "small", icon: _jsx(MoreOutlined, {}) }) })] })] }) }), _jsx("div", { className: "flex-1 overflow-y-auto", children: _jsx(Tabs, { activeKey: activeTab, onChange: setActiveTab, className: "px-6", tabBarStyle: { marginBottom: 12 }, items: [
                        {
                            key: 'overview',
                            label: 'Overview',
                            children: (_jsxs("div", { className: "space-y-4 pb-6", children: [_jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { span: 6, children: _jsx(Card, { styles: { body: { padding: 16 } }, children: _jsx(Statistic, { title: "Total Items", value: stats.total, prefix: _jsx(FlagOutlined, { style: { color: '#1677ff' } }) }) }) }), _jsx(Col, { span: 6, children: _jsx(Card, { styles: { body: { padding: 16 } }, children: _jsx(Statistic, { title: "Done", value: stats.done, valueStyle: { color: '#52c41a' }, prefix: _jsx(CheckCircleOutlined, {}) }) }) }), _jsx(Col, { span: 6, children: _jsx(Card, { styles: { body: { padding: 16 } }, children: _jsx(Statistic, { title: "In Progress", value: stats.inProgress, valueStyle: { color: '#1677ff' }, prefix: _jsx(ClockCircleOutlined, {}) }) }) }), _jsx(Col, { span: 6, children: _jsx(Card, { styles: { body: { padding: 16 } }, children: _jsx(Statistic, { title: "Blocked", value: stats.blocked, valueStyle: { color: '#ff4d4f' }, prefix: _jsx(StopOutlined, {}) }) }) })] }), _jsxs(Card, { title: "Progress", children: [_jsx(Progress, { percent: stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0, strokeColor: "#1677ff", size: 14, showInfo: true }), _jsx("div", { className: "flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400", children: _jsxs("span", { children: [stats.done, " of ", stats.total, " items completed"] }) })] }), _jsxs(Card, { title: "Project Details", children: [_jsxs("div", { className: "grid grid-cols-2 gap-y-4 gap-x-8 text-sm", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold", children: "Project Lead" }), _jsxs("div", { className: "mt-0.5 flex items-center gap-1", children: [_jsx(UserOutlined, { className: "text-gray-500 dark:text-gray-400" }), _jsx(InlineEdit, { value: selectedProject.owner, onSave: (v) => saveProjectField({ owner: v || undefined }) })] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold", children: "Sponsor" }), _jsx("div", { className: "mt-0.5", children: getSponsor(selectedProject.name) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold", children: "Start Date" }), _jsx("div", { className: "mt-0.5", children: _jsx(InlineEdit, { value: selectedProject.start_date, type: "date", onSave: (v) => saveProjectField({ start_date: v || undefined }) }) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold", children: "Target End" }), _jsx("div", { className: "mt-0.5", children: _jsx(InlineEdit, { value: selectedProject.end_date, type: "date", onSave: (v) => saveProjectField({ end_date: v || undefined }) }) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold", children: "Portfolio" }), _jsx("div", { className: "mt-0.5", children: _jsx(InlineEdit, { value: selectedProject.portfolio_id, type: "select", options: portfolios.map((p) => ({ value: p.id, label: p.name })), onSave: (v) => saveProjectField({ portfolio_id: v || undefined }), renderDisplay: () => _jsx(_Fragment, { children: portfolioName || '—' }) }) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold", children: "Open Risks" }), _jsx("div", { className: "mt-0.5 flex items-center gap-2", children: (() => {
                                                                    const open = risks.filter((r) => r.status !== 'Resolved').length;
                                                                    const hasHigh = risks.some((r) => r.impact === 'High' && r.status === 'Open');
                                                                    return (_jsxs("span", { className: [
                                                                            'text-sm font-semibold',
                                                                            open === 0 ? 'text-green-600' : hasHigh ? 'text-red-600' : 'text-amber-600',
                                                                        ].join(' '), children: [open, " ", open === 1 ? 'risk' : 'risks'] }));
                                                                })() })] })] }), _jsx(Divider, {}), _jsxs("div", { children: [_jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold mb-1", children: "Description" }), _jsx(InlineEdit, { value: selectedProject.description, multiline: true, onSave: (v) => saveProjectField({ description: v || undefined }) })] }), _jsx(Divider, {}), _jsxs("div", { children: [_jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold mb-1", children: "Tags" }), _jsx(InlineEdit, { value: selectedProject.tags?.join(', ') || '', placeholder: "tag1, tag2", onSave: (v) => saveProjectField({ tags: v ? v.split(',').map((t) => t.trim()).filter(Boolean) : [] }), renderDisplay: () => (selectedProject.tags?.length ? (_jsx("div", { className: "flex gap-1.5 flex-wrap", children: selectedProject.tags.map((t) => _jsx(Tag, { style: { margin: 0 }, children: t }, t)) })) : _jsx("span", { className: "text-gray-500 dark:text-gray-400", children: "tag1, tag2" })) })] })] })] })),
                        },
                        {
                            key: 'workitems',
                            label: `Work Items (${flatWorkItems.length})`,
                            children: (_jsx("div", { className: "pb-6", children: _jsx(Card, { extra: _jsx(Button, { size: "small", icon: _jsx(PlusOutlined, {}), onClick: () => openAddWorkItem(), children: "Add" }), children: flatWorkItems.length === 0 ? (_jsx(Empty, { description: "No work items for this project" })) : (_jsx(Table, { columns: workItemColumns, dataSource: flatWorkItems, pagination: false, size: "small", expandable: {
                                            defaultExpandAllRows: false,
                                            expandIcon: ({ expanded, onExpand, record }) => record.children && record.children.length > 0 ? (expanded
                                                ? _jsx(CaretDownOutlined, { onClick: (e) => onExpand(record, e), style: { cursor: 'pointer' } })
                                                : _jsx(CaretRightOutlined, { onClick: (e) => onExpand(record, e), style: { cursor: 'pointer' } })) : null,
                                        } })) }) })),
                        },
                        {
                            key: 'risks',
                            label: `Risks (${risks.length})`,
                            children: (_jsxs("div", { className: "pb-6 space-y-4", children: [_jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { span: 6, children: _jsx(Card, { styles: { body: { padding: 16 }, header: { borderBottom: '2px solid #ff4d4f' } }, children: _jsx(Statistic, { title: "High Impact", value: risks.filter((r) => r.impact === 'High').length, valueStyle: { color: '#ff4d4f' }, prefix: _jsx(ExclamationCircleOutlined, {}) }) }) }), _jsx(Col, { span: 6, children: _jsx(Card, { styles: { body: { padding: 16 }, header: { borderBottom: '2px solid #faad14' } }, children: _jsx(Statistic, { title: "Medium Impact", value: risks.filter((r) => r.impact === 'Medium').length, valueStyle: { color: '#faad14' }, prefix: _jsx(ExclamationCircleOutlined, {}) }) }) }), _jsx(Col, { span: 6, children: _jsx(Card, { styles: { body: { padding: 16 }, header: { borderBottom: '2px solid #52c41a' } }, children: _jsx(Statistic, { title: "Low Impact", value: risks.filter((r) => r.impact === 'Low').length, valueStyle: { color: '#52c41a' }, prefix: _jsx(ExclamationCircleOutlined, {}) }) }) }), _jsx(Col, { span: 6, children: _jsx(Card, { styles: { body: { padding: 16 }, header: { borderBottom: '2px solid #52c41a' } }, children: _jsx(Statistic, { title: "Resolved", value: risks.filter((r) => r.status === 'Resolved').length, valueStyle: { color: '#52c41a' }, prefix: _jsx(CheckCircleOutlined, {}) }) }) })] }), _jsx(Card, { extra: _jsx(Button, { size: "small", icon: _jsx(PlusOutlined, {}), onClick: () => openAddWorkItem('issue'), children: "Log Risk" }), children: risks.length === 0 ? (_jsx(Empty, { description: "No risks identified \u2014 issues, clashes or blocked items will appear here" })) : (_jsx(Table, { columns: riskColumns, dataSource: risks, rowKey: "id", pagination: false, size: "small" })) })] })),
                        },
                        {
                            key: 'budget',
                            label: 'Budget',
                            children: (_jsxs("div", { className: "pb-6 space-y-4", children: [_jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { span: 8, children: _jsx(Card, { styles: { body: { padding: 16 }, header: { borderBottom: '2px solid #1677ff' } }, children: _jsx(Statistic, { title: "Planned Budget", value: `$${budget.planned.toLocaleString()}`, valueStyle: { color: '#1677ff' } }) }) }), _jsx(Col, { span: 8, children: _jsx(Card, { styles: { body: { padding: 16 }, header: { borderBottom: '2px solid #faad14' } }, children: _jsx(Statistic, { title: "Spent", value: `$${budget.spent.toLocaleString()}`, valueStyle: { color: '#faad14' } }) }) }), _jsx(Col, { span: 8, children: _jsx(Card, { styles: { body: { padding: 16 }, header: { borderBottom: budget.remaining >= 0 ? '2px solid #52c41a' : '2px solid #ff4d4f' } }, children: _jsx(Statistic, { title: "Remaining", value: `$${budget.remaining.toLocaleString()}`, valueStyle: { color: budget.remaining >= 0 ? '#52c41a' : '#ff4d4f' } }) }) })] }), _jsxs(Card, { title: "Budget Utilization", children: [_jsx(Progress, { percent: budget.planned > 0 ? Math.round((budget.spent / budget.planned) * 100) : 0, strokeColor: budget.planned > 0 && budget.spent / budget.planned > 0.9 ? '#ff4d4f' :
                                                    budget.planned > 0 && budget.spent / budget.planned > 0.75 ? '#faad14' : '#52c41a', size: 16, showInfo: true }), _jsx("div", { className: "flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400", children: _jsxs("span", { children: ["$", budget.spent.toLocaleString(), " spent of $", budget.planned.toLocaleString(), " planned"] }) }), _jsx(Divider, {}), _jsx("div", { className: "text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3", children: "Breakdown by Category" }), _jsx(Table, { columns: budgetBreakdownColumns, dataSource: budgetBreakdown(budget.planned, budget.spent), pagination: false, size: "small" })] })] })),
                        },
                    ] }) }), _jsx(Modal, { open: addWorkItemOpen, onCancel: () => { workItemForm.resetFields(); setAddWorkItemOpen(false); }, title: "Add Work Item", footer: [
                    _jsx(Button, { onClick: () => { workItemForm.resetFields(); setAddWorkItemOpen(false); }, children: "Cancel" }, "cancel"),
                    _jsx(Button, { type: "primary", onClick: handleAddWorkItem, children: "Add" }, "submit"),
                ], forceRender: true, children: _jsxs(Form, { form: workItemForm, layout: "vertical", size: "small", children: [_jsx(Form.Item, { name: "title", label: "Title", rules: [{ required: true, message: 'Title is required' }], children: _jsx(Input, { placeholder: "Work item title" }) }), _jsxs("div", { style: { display: 'flex', gap: 12 }, children: [_jsx(Form.Item, { name: "type", label: "Type", style: { flex: 1 }, rules: [{ required: true }], children: _jsx(Select, { options: TYPE_OPTIONS }) }), _jsx(Form.Item, { name: "status", label: "Status", style: { flex: 1 }, children: _jsx(Select, { options: STATUS_OPTIONS }) })] }), _jsx(Form.Item, { name: "parent_id", label: "Parent Item", children: _jsx(Select, { placeholder: "Top-level parent (optional)", allowClear: true, options: workItems.map((wi) => ({ value: wi.id, label: `${wi.type}: ${wi.title}` })) }) }), _jsxs("div", { style: { display: 'flex', gap: 12 }, children: [_jsx(Form.Item, { name: "owner", label: "Owner", style: { flex: 1 }, children: _jsx(Input, { placeholder: "Assignee name" }) }), _jsx(Form.Item, { name: "priority", label: "Priority", style: { flex: 1 }, children: _jsx(Select, { options: PRIORITY_OPTIONS, defaultValue: "medium" }) })] }), _jsxs("div", { style: { display: 'flex', gap: 12 }, children: [_jsx(Form.Item, { name: "start_date", label: "Start", style: { flex: 1 }, children: _jsx(Input, { type: "date" }) }), _jsx(Form.Item, { name: "end_date", label: "End", style: { flex: 1 }, children: _jsx(Input, { type: "date" }) })] }), _jsx(Form.Item, { name: "notes", label: "Notes", children: _jsx(Input.TextArea, { rows: 3, placeholder: "Additional notes" }) })] }) })] }));
}
