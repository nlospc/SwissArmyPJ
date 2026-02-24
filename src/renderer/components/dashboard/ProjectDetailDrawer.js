import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useMemo } from 'react';
import { Drawer, Tabs, Descriptions, Tag, Progress, Button, Space, Typography, Empty, Spin, theme } from 'antd';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { EditOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons';
const { Title, Paragraph, Text } = Typography;
// Animation styles
const DRAWER_STYLES = {
    body: { padding: '24px' },
    mask: { backdropFilter: 'blur(2px)' },
};
const TAB_ANIMATION_CONFIG = {
    inkBar: {
        style: {
            transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)',
        },
    },
    tabPane: {
        transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)',
    },
};
export function ProjectDetailDrawer({ project, open, onClose, onEdit, onDelete, }) {
    const { token } = theme.useToken();
    const { workItemsByProject, loadWorkItemsByProject } = useWorkItemStore();
    const { updateProject } = useProjectStore();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    // Animation states - MOVED UP before any early returns
    const [contentVisible, setContentVisible] = useState(false);
    const [activeTabKey, setActiveTabKey] = useState('overview');
    // Load work items when project changes
    useEffect(() => {
        if (project && open) {
            setLoading(true);
            loadWorkItemsByProject(project.id).finally(() => {
                setLoading(false);
            });
        }
    }, [project?.id, open, loadWorkItemsByProject]);
    // Animation effect - MOVED UP before any early returns
    useEffect(() => {
        if (open) {
            // Trigger content animation after drawer starts opening
            setContentVisible(false);
            const timer = setTimeout(() => setContentVisible(true), 100);
            return () => clearTimeout(timer);
        }
        else {
            setContentVisible(false);
        }
    }, [open]);
    const workItems = project?.id ? workItemsByProject.get(project.id) || [] : [];
    // Calculate metrics from work items - keep hook order stable across renders
    const metrics = useMemo(() => {
        const totalTasks = workItems.length;
        const doneTasks = workItems.filter((item) => item.status === 'done').length;
        const blockedItems = workItems.filter((item) => item.status === 'blocked');
        const milestones = workItems.filter((item) => item.type === 'milestone');
        const issues = workItems.filter((item) => item.type === 'issue');
        return {
            totalTasks,
            doneTasks,
            progress: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
            blockerCount: blockedItems.length,
            milestoneCount: milestones.length,
            issueCount: issues.length,
            nextMilestone: milestones
                .filter((m) => m.status !== 'done')
                .sort((a, b) => new Date(a.start_date || '').getTime() - new Date(b.start_date || '').getTime())[0],
        };
    }, [workItems]);
    // Early return AFTER hooks and derived state
    if (!project) {
        return null;
    }
    const getStatusColor = (status) => {
        const colors = {
            done: 'green',
            in_progress: 'blue',
            blocked: 'red',
            not_started: 'default',
        };
        return colors[status] || 'default';
    };
    const getStatusText = (status) => {
        const text = {
            done: 'Done',
            in_progress: 'In Progress',
            blocked: 'Blocked',
            not_started: 'Not Started',
        };
        return text[status] || status;
    };
    const renderOverview = () => (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "metric-card p-4 rounded-lg transition-shadow", style: { backgroundColor: token.colorBgLayout }, onMouseEnter: (e) => {
                            e.currentTarget.style.boxShadow = token.boxShadow;
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.boxShadow = 'none';
                        }, children: [_jsx(Text, { type: "secondary", children: "Progress" }), _jsxs("div", { className: "mt-2", children: [_jsx(Progress, { percent: metrics.progress, size: "small", strokeColor: {
                                            '0%': '#108ee9',
                                            '100%': '#87d068',
                                        }, className: "progress-bar-animated" }), _jsxs(Text, { className: "text-xs", children: [metrics.doneTasks, "/", metrics.totalTasks, " tasks completed"] })] })] }), _jsxs("div", { className: "metric-card p-4 rounded-lg transition-shadow", style: { backgroundColor: token.colorBgLayout }, onMouseEnter: (e) => {
                            e.currentTarget.style.boxShadow = token.boxShadow;
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.boxShadow = 'none';
                        }, children: [_jsx(Text, { type: "secondary", children: "Timeline" }), _jsx("div", { className: "mt-2", children: _jsxs(Text, { strong: true, children: [project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set', " \u2192", ' ', project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'] }) })] })] }), project.description && (_jsxs("div", { children: [_jsx(Title, { level: 5, children: "Description" }), _jsx(Paragraph, { children: project.description })] })), project.tags && project.tags.length > 0 && (_jsxs("div", { children: [_jsx(Title, { level: 5, children: "Tags" }), _jsx(Space, { wrap: true, children: project.tags.map((tag) => (_jsx(Tag, { children: tag }, tag))) })] })), _jsxs("div", { children: [_jsx(Title, { level: 5, children: "Quick Stats" }), _jsxs(Descriptions, { column: 2, size: "small", children: [_jsx(Descriptions.Item, { label: "Status", children: _jsx(Tag, { color: getStatusColor(project.status), children: getStatusText(project.status) }) }), _jsx(Descriptions.Item, { label: "Owner", children: project.owner || 'Unassigned' }), _jsx(Descriptions.Item, { label: "Total Tasks", children: metrics.totalTasks }), _jsx(Descriptions.Item, { label: "Completed", children: metrics.doneTasks }), _jsx(Descriptions.Item, { label: "Blocked", children: metrics.blockerCount > 0 ? (_jsx(Tag, { color: "red", children: metrics.blockerCount })) : (_jsx("span", { style: { color: token.colorTextSecondary }, children: "None" })) }), _jsx(Descriptions.Item, { label: "Milestones", children: metrics.milestoneCount }), _jsx(Descriptions.Item, { label: "Issues", children: metrics.issueCount }), _jsx(Descriptions.Item, { label: "Next Milestone", children: metrics.nextMilestone ? (_jsx("span", { children: metrics.nextMilestone.title })) : (_jsx("span", { style: { color: token.colorTextSecondary }, children: "None" })) })] })] })] }));
    const renderWorkItems = () => (_jsx("div", { className: "space-y-4", children: workItems.length === 0 ? (_jsx(Empty, { description: "No work items yet", className: "animate-fade-in" })) : (_jsx("div", { className: "space-y-2", children: workItems.map((item, index) => (_jsxs("div", { className: "work-item-card border rounded-lg p-4 transition-all duration-200 animate-slide-in", style: { animationDelay: `${index * 50}ms` }, onMouseEnter: (e) => {
                    e.currentTarget.style.backgroundColor = token.colorBgLayout;
                    e.currentTarget.style.boxShadow = token.boxShadow;
                }, onMouseLeave: (e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                }, children: [_jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(Tag, { color: getStatusColor(item.status), className: "status-tag-animated", children: getStatusText(item.status) }), _jsx(Tag, { color: "blue", children: item.type }), _jsx(Text, { strong: true, children: item.title })] }), item.notes && (_jsx(Paragraph, { className: "mb-0 text-sm", style: { color: token.colorTextSecondary }, children: item.notes })), (item.start_date || item.end_date) && (_jsxs(Text, { className: "text-xs block mt-1", style: { color: token.colorTextSecondary }, children: [item.start_date && `Start: ${new Date(item.start_date).toLocaleDateString()}`, item.start_date && item.end_date && ' | ', item.end_date && `End: ${new Date(item.end_date).toLocaleDateString()}`] }))] }) }), item.children && item.children.length > 0 && (_jsx("div", { className: "ml-4 mt-2 space-y-2", children: item.children.map((child, childIndex) => (_jsx("div", { className: "border-l-2 pl-3 py-1 transition-colors rounded animate-fade-in", style: { animationDelay: `${(index * 50) + (childIndex * 25) + 100}ms` }, onMouseEnter: (e) => {
                                e.currentTarget.style.backgroundColor = token.colorBgLayout;
                            }, onMouseLeave: (e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Tag, { color: getStatusColor(child.status), children: getStatusText(child.status) }), _jsx(Text, { className: "text-sm", children: child.title })] }) }, child.id))) }))] }, item.id))) })) }));
    const renderTimeline = () => (_jsx("div", { children: _jsx(Empty, { description: "Timeline view will be integrated here" }) }));
    const items = [
        {
            key: 'overview',
            label: 'Overview',
            children: loading ? _jsx(Spin, { size: "large", className: "animate-spin-slow" }) : renderOverview(),
        },
        {
            key: 'workitems',
            label: `Work Items (${workItems.length})`,
            children: loading ? _jsx(Spin, { size: "large", className: "animate-spin-slow" }) : renderWorkItems(),
        },
        {
            key: 'timeline',
            label: 'Timeline',
            children: renderTimeline(),
        },
    ];
    return (_jsx(Drawer, { title: _jsxs("div", { className: "flex items-center justify-between animate-fade-in", children: [_jsxs("div", { children: [_jsx(Title, { level: 4, className: "mb-0", children: project.name }), _jsx(Text, { type: "secondary", className: "text-sm", children: "Project Details" })] }), _jsxs(Space, { children: [onEdit && (_jsx(Button, { icon: _jsx(EditOutlined, {}), onClick: () => onEdit(project), children: "Edit" })), onDelete && (_jsx(Button, { danger: true, icon: _jsx(DeleteOutlined, {}), onClick: () => onDelete(project.id), children: "Delete" }))] })] }), placement: "right", width: 720, open: open, onClose: onClose, closeIcon: _jsx(CloseOutlined, {}), styles: DRAWER_STYLES, destroyOnClose: true, maskClosable: true, keyboard: true, className: "project-detail-drawer", children: _jsx("div", { className: `drawer-content ${contentVisible ? 'content-visible' : ''}`, style: {
                opacity: contentVisible ? 1 : 0,
                transform: contentVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
            }, children: _jsx(Tabs, { activeKey: activeTabKey, onChange: (key) => {
                    setActiveTabKey(key);
                    setActiveTab(key);
                }, items: items, animated: TAB_ANIMATION_CONFIG }) }) }));
}
