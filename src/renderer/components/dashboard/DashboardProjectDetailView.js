import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Empty, Tag, Typography, Progress, Divider, Avatar, Modal, Form, Input, Select, message, theme, } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DownloadOutlined, UserOutlined, FlagOutlined, CalendarOutlined, ExclamationCircleOutlined, } from '@ant-design/icons';
import { useProjectStore } from '@/stores/useProjectStore';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { formatDistanceToNow } from 'date-fns';
const { Title, Text, Paragraph } = Typography;
const STATUS_LABELS = {
    done: 'Done',
    in_progress: 'In Progress',
    blocked: 'Blocked',
    not_started: 'Not Started',
};
export function DashboardProjectDetailView({ projectId, onClose }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [addWorkItemVisible, setAddWorkItemVisible] = useState(false);
    const [form] = Form.useForm();
    const { token } = theme.useToken();
    const { getProjectById } = useProjectStore();
    const { workItems, loadWorkItemsByProject, addWorkItem } = useWorkItemStore();
    const { getPortfolioById } = usePortfolioStore();
    const selectedProject = projectId ? getProjectById(projectId) : null;
    useEffect(() => {
        if (projectId) {
            loadWorkItemsByProject(projectId);
        }
    }, [projectId, loadWorkItemsByProject]);
    const projectWorkItems = useMemo(() => {
        return workItems.filter((wi) => wi.project_id === projectId);
    }, [workItems, projectId]);
    const stats = useMemo(() => {
        const total = projectWorkItems.length;
        const done = projectWorkItems.filter((i) => i.status === 'done').length;
        const blocked = projectWorkItems.filter((i) => i.status === 'blocked').length;
        const inProgress = projectWorkItems.filter((i) => i.status === 'in_progress').length;
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;
        return { total, done, blocked, inProgress, progress };
    }, [projectWorkItems]);
    const upcomingMilestones = useMemo(() => {
        return projectWorkItems
            .filter((wi) => wi.type === 'milestone' && wi.end_date)
            .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
            .slice(0, 4);
    }, [projectWorkItems]);
    const activeRisks = useMemo(() => {
        return projectWorkItems.filter((wi) => (wi.type === 'issue' || wi.type === 'clash' || wi.status === 'blocked') && wi.status !== 'done');
    }, [projectWorkItems]);
    const portfolioName = selectedProject?.portfolio_id
        ? getPortfolioById(selectedProject.portfolio_id)?.name
        : null;
    const getBudget = (project) => {
        const hash = project.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const planned = Math.round((hash % 80 + 20) * 10000);
        const spent = Math.round(planned * 0.55);
        return { planned, spent }; // placeholder values
    };
    const budget = selectedProject ? getBudget(selectedProject) : null;
    const handleAddWorkItem = async () => {
        try {
            const values = await form.validateFields();
            if (!projectId)
                return;
            await addWorkItem({
                project_id: projectId,
                type: values.type,
                title: values.title,
                status: values.status || 'not_started',
                level: 1,
            });
            message.success('Work item added');
            form.resetFields();
            setAddWorkItemVisible(false);
        }
        catch (error) {
            console.error(error);
        }
    };
    if (!selectedProject) {
        return (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsx(Empty, { description: "Project not found" }) }));
    }
    const getStatusChip = (status) => {
        const label = STATUS_LABELS[status] || 'Unknown';
        let bg = token.colorFillSecondary;
        let text = token.colorTextSecondary;
        let border = token.colorSplit;
        if (status === 'done') {
            bg = token.colorSuccessBg;
            text = token.colorSuccessText;
            border = token.colorSuccessBorder;
        }
        else if (status === 'in_progress') {
            bg = token.colorInfoBg;
            text = token.colorInfoText;
            border = token.colorInfoBorder;
        }
        else if (status === 'blocked') {
            bg = token.colorErrorBg;
            text = token.colorErrorText;
            border = token.colorErrorBorder;
        }
        return (_jsx("span", { className: "px-2.5 py-0.5 rounded-full text-xs font-medium border", style: {
                background: bg,
                color: text,
                borderColor: border,
            }, children: label }));
    };
    return (_jsxs("div", { className: "flex flex-col h-full", style: { background: token.colorBgLayout }, children: [_jsx("header", { className: "px-8 py-4 flex-shrink-0 border-b", style: {
                    background: token.colorBgContainer,
                    borderColor: token.colorBorderSecondary,
                }, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Button, { size: "small", icon: _jsx(ArrowLeftOutlined, {}), onClick: onClose, children: "Back to Dashboard" }), _jsx("div", { className: "h-6 w-px", style: { background: token.colorSplit } }), _jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsx(Title, { level: 3, className: "mb-0", children: selectedProject.name }), getStatusChip(selectedProject.status)] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs(Text, { type: "secondary", className: "text-xs", children: ["Last updated:", ' ', selectedProject.updated_at
                                            ? formatDistanceToNow(new Date(selectedProject.updated_at), { addSuffix: true })
                                            : 'Never'] }), _jsx(Button, { icon: _jsx(DownloadOutlined, {}), children: "Export" }), _jsx(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: () => setAddWorkItemVisible(true), children: "Add Item" })] })] }) }), _jsx("main", { className: "flex-1 overflow-auto px-8 py-6", children: _jsxs("div", { className: "max-w-7xl mx-auto grid grid-cols-12 gap-8", children: [_jsxs("div", { className: "col-span-8 space-y-6", children: [_jsx("div", { className: "border-b flex gap-6", style: { borderColor: token.colorSplit }, children: ['overview', 'workitems', 'risks'].map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab), className: "pb-3 border-b-2 font-medium text-sm", style: {
                                            borderColor: activeTab === tab ? token.colorPrimary : 'transparent',
                                            color: activeTab === tab ? token.colorPrimary : token.colorTextSecondary,
                                        }, children: [tab === 'overview' && 'Overview', tab === 'workitems' && (_jsxs(_Fragment, { children: ["Work Items", ' ', _jsx("span", { className: "ml-1 rounded-full px-1.5 py-0.5 text-xs", style: {
                                                            background: token.colorFillTertiary,
                                                            color: token.colorTextSecondary,
                                                        }, children: stats.total })] })), tab === 'risks' && (_jsxs(_Fragment, { children: ["Risks", ' ', _jsx("span", { className: "ml-1 rounded-full px-1.5 py-0.5 text-xs", style: {
                                                            background: token.colorErrorBg,
                                                            color: token.colorErrorText,
                                                        }, children: activeRisks.length })] }))] }, tab))) }), activeTab === 'overview' && (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { bodyStyle: { padding: 24 }, children: [_jsx("h3", { className: "text-sm font-semibold uppercase tracking-wider mb-3", style: { color: token.colorTextSecondary }, children: "About Project" }), _jsx(Paragraph, { className: "mb-0", style: { color: token.colorText }, children: selectedProject.description || 'No description available.' })] }), _jsxs(Card, { bodyStyle: { padding: 24 }, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { style: { color: token.colorText, fontWeight: 600 }, children: "Overall Progress" }), _jsxs("span", { style: { color: token.colorPrimary, fontSize: 24, fontWeight: 600 }, children: [stats.progress, "%"] })] }), _jsx(Progress, { percent: stats.progress, strokeColor: token.colorPrimary, showInfo: false }), _jsxs("div", { className: "flex justify-between text-xs mt-2", children: [_jsxs("span", { style: { color: token.colorTextSecondary }, children: ["Start: ", selectedProject.start_date || 'TBD'] }), _jsxs("span", { style: { color: token.colorTextSecondary }, children: ["Target: ", selectedProject.end_date || 'TBD'] })] })] }), _jsx(Card, { title: "Upcoming Milestones", bodyStyle: { padding: 0 }, children: upcomingMilestones.length === 0 ? (_jsx("div", { className: "p-6", children: _jsx(Empty, { description: "No upcoming milestones" }) })) : (_jsx("div", { children: upcomingMilestones.map((milestone, idx) => (_jsxs("div", { className: "flex items-center justify-between px-6 py-4", style: {
                                                        borderTop: idx === 0 ? 'none' : `1px solid ${token.colorSplit}`,
                                                    }, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { style: {
                                                                        width: 8,
                                                                        height: 8,
                                                                        borderRadius: '50%',
                                                                        background: token.colorSuccess,
                                                                    } }), _jsx("span", { style: { color: token.colorText, fontWeight: 500 }, children: milestone.title })] }), _jsx("span", { style: { color: token.colorTextSecondary, fontSize: 12 }, children: milestone.end_date
                                                                ? formatDistanceToNow(new Date(milestone.end_date), { addSuffix: true })
                                                                : 'No date' })] }, milestone.id))) })) })] })), activeTab === 'workitems' && (_jsx(Card, { bodyStyle: { padding: 0 }, children: stats.total === 0 ? (_jsx("div", { className: "p-6", children: _jsx(Empty, { description: "No work items yet" }) })) : (_jsx("div", { children: projectWorkItems.map((item, idx) => (_jsxs("div", { className: "flex items-center justify-between px-6 py-4", style: { borderTop: idx === 0 ? 'none' : `1px solid ${token.colorSplit}` }, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Tag, { children: item.type }), _jsx("span", { style: { color: token.colorText, fontWeight: 500 }, children: item.title })] }), getStatusChip(item.status)] }, item.id))) })) })), activeTab === 'risks' && (_jsx(Card, { bodyStyle: { padding: 24 }, children: activeRisks.length === 0 ? (_jsx(Empty, { description: "No active risks" })) : (_jsx("div", { className: "space-y-4", children: activeRisks.map((risk) => (_jsx("div", { className: "p-4 rounded-lg", style: {
                                                border: `1px solid ${token.colorWarningBorder}`,
                                                background: token.colorWarningBg,
                                            }, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(ExclamationCircleOutlined, { style: { color: token.colorWarning } }), _jsxs("div", { children: [_jsx("div", { style: { color: token.colorText, fontWeight: 600 }, children: risk.title }), risk.notes && (_jsx("div", { style: { color: token.colorTextSecondary, marginTop: 4 }, children: risk.notes }))] })] }) }, risk.id))) })) }))] }), _jsxs("div", { className: "col-span-4 space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs(Card, { bodyStyle: { padding: 16 }, children: [_jsx("div", { style: { color: token.colorTextSecondary, fontSize: 12, fontWeight: 500 }, children: "Budget" }), _jsx("div", { style: { color: token.colorText, fontSize: 18, fontWeight: 600, marginTop: 4 }, children: budget ? `$${(budget.planned / 1000).toFixed(1)}K` : '—' }), _jsx("div", { style: { color: token.colorSuccess, fontSize: 12, marginTop: 4 }, children: "On track" })] }), _jsxs(Card, { bodyStyle: { padding: 16 }, children: [_jsx("div", { style: { color: token.colorTextSecondary, fontSize: 12, fontWeight: 500 }, children: "Team" }), _jsx("div", { style: { color: token.colorText, fontSize: 18, fontWeight: 600, marginTop: 4 }, children: Math.max(5, Math.floor(Math.random() * 15)) }), _jsx("div", { style: { color: token.colorTextSecondary, fontSize: 12, marginTop: 4 }, children: "Active members" })] })] }), _jsx(Card, { title: "Project Details", children: _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsx("div", { style: { color: token.colorTextSecondary, fontSize: 12, fontWeight: 500 }, children: "Project Lead" }), _jsxs("div", { className: "flex items-center gap-2", style: { marginTop: 8 }, children: [_jsx(Avatar, { size: "small", icon: _jsx(UserOutlined, {}) }), _jsx("span", { style: { color: token.colorText }, children: selectedProject.owner || 'Unassigned' })] })] }), _jsx(Divider, {}), _jsxs("div", { children: [_jsx("div", { style: { color: token.colorTextSecondary, fontSize: 12, fontWeight: 500 }, children: "Sponsor" }), _jsx("div", { style: { color: token.colorText, marginTop: 4 }, children: "TBD" })] }), _jsx(Divider, {}), _jsxs("div", { children: [_jsx("div", { style: { color: token.colorTextSecondary, fontSize: 12, fontWeight: 500 }, children: "Timeline" }), _jsxs("div", { className: "flex items-center gap-2", style: { marginTop: 4 }, children: [_jsx(CalendarOutlined, { style: { color: token.colorTextSecondary } }), _jsxs("span", { style: { color: token.colorText }, children: [selectedProject.start_date || 'N/A', " - ", selectedProject.end_date || 'N/A'] })] })] }), _jsx(Divider, {}), _jsxs("div", { children: [_jsx("div", { style: { color: token.colorTextSecondary, fontSize: 12, fontWeight: 500 }, children: "Portfolio" }), _jsxs("div", { className: "flex items-center gap-2", style: { marginTop: 4 }, children: [_jsx(FlagOutlined, { style: { color: token.colorTextSecondary } }), _jsx("span", { style: { color: token.colorText }, children: portfolioName || 'Unassigned' })] })] }), selectedProject.tags && selectedProject.tags.length > 0 && (_jsxs(_Fragment, { children: [_jsx(Divider, {}), _jsxs("div", { children: [_jsx("div", { style: { color: token.colorTextSecondary, fontSize: 12, fontWeight: 500 }, children: "Tags" }), _jsx("div", { className: "flex flex-wrap gap-2", style: { marginTop: 8 }, children: selectedProject.tags.map((tag) => (_jsx(Tag, { children: tag }, tag))) })] })] }))] }) }), activeRisks.length > 0 && (_jsxs(Card, { children: [_jsxs("div", { className: "flex items-center gap-2", style: { color: token.colorText, fontWeight: 600 }, children: [_jsx(ExclamationCircleOutlined, { style: { color: token.colorWarning } }), "Top Risks"] }), _jsx("ul", { className: "mt-3 space-y-3", children: activeRisks.slice(0, 3).map((risk) => (_jsxs("li", { style: { color: token.colorTextSecondary }, children: [_jsx("span", { style: { color: token.colorText, fontWeight: 500 }, children: risk.title }), _jsx("div", { children: risk.status === 'blocked' ? 'Blocked' : 'Mitigating' })] }, risk.id))) }), activeRisks.length > 3 && (_jsxs(Button, { type: "link", size: "small", style: { padding: 0 }, onClick: () => setActiveTab('risks'), children: ["View all ", activeRisks.length, " risks"] }))] }))] })] }) }), _jsx(Modal, { title: "Add Work Item", open: addWorkItemVisible, onCancel: () => {
                    setAddWorkItemVisible(false);
                    form.resetFields();
                }, onOk: handleAddWorkItem, okText: "Add", children: _jsxs(Form, { form: form, layout: "vertical", initialValues: { type: 'task', status: 'not_started' }, children: [_jsx(Form.Item, { name: "type", label: "Type", rules: [{ required: true }], children: _jsx(Select, { options: [
                                    { value: 'task', label: 'Task' },
                                    { value: 'issue', label: 'Issue' },
                                    { value: 'milestone', label: 'Milestone' },
                                    { value: 'phase', label: 'Phase' },
                                    { value: 'remark', label: 'Remark' },
                                    { value: 'clash', label: 'Clash' },
                                ] }) }), _jsx(Form.Item, { name: "title", label: "Title", rules: [{ required: true }], children: _jsx(Input, { placeholder: "Enter work item title" }) }), _jsx(Form.Item, { name: "status", label: "Status", children: _jsx(Select, { options: [
                                    { value: 'not_started', label: 'Not Started' },
                                    { value: 'in_progress', label: 'In Progress' },
                                    { value: 'blocked', label: 'Blocked' },
                                    { value: 'done', label: 'Done' },
                                ] }) })] }) })] }));
}
