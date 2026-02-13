import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Typography, Button, Space } from 'antd';
import { Calendar, BarChart3, AlertCircle } from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import { ProjectGanttChart } from './ProjectGanttChart';
const { Title, Text } = Typography;
export function TimelineView() {
    const { projects } = useProjectStore();
    const { workItems } = useWorkItemStore();
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    // 计算项目统计数据
    const projectStats = useMemo(() => {
        return projects.map(project => {
            const projectWorkItems = workItems.filter(w => w.project_id === project.id);
            const completed = projectWorkItems.filter(w => w.status === 'done').length;
            const inProgress = projectWorkItems.filter(w => w.status === 'in_progress').length;
            const blocked = projectWorkItems.filter(w => w.status === 'blocked').length;
            return {
                ...project,
                totalTasks: projectWorkItems.length,
                completed,
                inProgress,
                blocked,
                progress: projectWorkItems.length > 0
                    ? Math.round((completed / projectWorkItems.length) * 100)
                    : 0,
                startDate: project.start_date ? new Date(project.start_date) : new Date(),
                endDate: project.end_date ? new Date(project.end_date) : new Date(),
            };
        });
    }, [projects, workItems]);
    // 全局统计
    const globalStats = useMemo(() => {
        return {
            totalProjects: projects.length,
            activeProjects: projects.filter(p => p.status === 'in_progress').length,
            totalTasks: workItems.length,
            completedTasks: workItems.filter(w => w.status === 'done').length,
            blockedTasks: workItems.filter(w => w.status === 'blocked').length,
        };
    }, [projects, workItems]);
    const getStatusColor = (status) => {
        const colors = {
            done: 'success',
            in_progress: 'processing',
            blocked: 'error',
            not_started: 'default',
        };
        return colors[status] || 'default';
    };
    const getStatusText = (status) => {
        const texts = {
            done: '完成',
            in_progress: '进行中',
            blocked: '阻塞',
            not_started: '未开始',
        };
        return texts[status] || status;
    };
    // 如果选中了项目，显示项目 Gantt Chart
    if (selectedProjectId) {
        const selectedProject = projectStats.find(p => p.id === selectedProjectId);
        if (selectedProject) {
            return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsxs("div", { className: "mb-4", children: [_jsx(Button, { onClick: () => setSelectedProjectId(null), className: "mb-4", children: "\u2190 \u8FD4\u56DE\u65F6\u95F4\u7EBF\u89C6\u56FE" }), _jsx(Title, { level: 3, children: selectedProject.name }), _jsxs(Text, { type: "secondary", children: [selectedProject.startDate.toLocaleDateString(), " - ", selectedProject.endDate.toLocaleDateString()] })] }), _jsx(ProjectGanttChart, { projectId: selectedProject.id, projectName: selectedProject.name })] }));
        }
    }
    return (_jsxs("div", { className: "p-6 space-y-6 h-full overflow-auto", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs(Title, { level: 2, className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "h-6 w-6" }), "\u9879\u76EE\u65F6\u95F4\u7EBF"] }), _jsx(Text, { type: "secondary", children: "\u67E5\u770B\u6240\u6709\u9879\u76EE\u7684\u65F6\u95F4\u5B89\u6392\u548C\u8FDB\u5EA6" })] }), _jsx(Space, { children: _jsx(Button, { icon: _jsx(BarChart3, { className: "h-4 w-4" }), children: "\u5207\u6362\u5230\u7518\u7279\u56FE" }) })] }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u603B\u9879\u76EE\u6570", value: globalStats.totalProjects, prefix: _jsx(BarChart3, { className: "h-4 w-4" }), valueStyle: { color: '#1677ff' } }) }) }), _jsx(Col, { span: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u6D3B\u8DC3\u9879\u76EE", value: globalStats.activeProjects, valueStyle: { color: '#52c41a' } }) }) }), _jsx(Col, { span: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u603B\u4EFB\u52A1\u6570", value: globalStats.totalTasks, valueStyle: { color: '#1677ff' } }) }) }), _jsx(Col, { span: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5DF2\u5B8C\u6210\u4EFB\u52A1", value: globalStats.completedTasks, valueStyle: { color: '#52c41a' }, suffix: `/ ${globalStats.totalTasks}` }) }) })] }), _jsx(Card, { title: _jsx(Title, { level: 4, className: "mb-0", children: "\u9879\u76EE\u65F6\u95F4\u7EBF" }), children: _jsx("div", { className: "space-y-4", children: projectStats.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Calendar, { className: "h-12 w-12 text-theme-tertiary mx-auto mb-4" }), _jsx(Text, { type: "secondary", children: "\u6682\u65E0\u9879\u76EE" })] })) : (projectStats.map(project => (_jsx(Card, { className: "cursor-pointer hover:border-primary transition-colors", onClick: () => setSelectedProjectId(project.id), styles: {
                            body: { padding: '16px' }
                        }, children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(Title, { level: 5, className: "mb-0", children: project.name }), _jsx(Tag, { color: getStatusColor(project.status), children: getStatusText(project.status) }), project.blocked > 0 && (_jsxs(Tag, { color: "error", icon: _jsx(AlertCircle, { className: "h-3 w-3" }), children: [project.blocked, " \u963B\u585E"] }))] }), _jsxs(Text, { type: "secondary", className: "text-sm", children: [project.startDate.toLocaleDateString(), " - ", project.endDate.toLocaleDateString(), project.owner && ` • 负责人: ${project.owner}`] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "text-2xl font-semibold text-primary", children: [project.progress, "%"] }), _jsxs(Text, { type: "secondary", className: "text-xs", children: [project.completed, "/", project.totalTasks, " \u4EFB\u52A1"] })] })] }), _jsx("div", { children: _jsx(Progress, { percent: project.progress, status: project.blocked > 0 ? 'exception' : 'active', strokeColor: {
                                            '0%': '#1677ff',
                                            '100%': '#52c41a',
                                        }, size: "small" }) }), _jsxs(Row, { gutter: 8, children: [_jsx(Col, { span: 6, children: _jsxs("div", { className: "text-sm", children: [_jsx("span", { className: "text-theme-secondary", children: "\u8FDB\u884C\u4E2D: " }), _jsx("span", { className: "font-medium", children: project.inProgress })] }) }), _jsx(Col, { span: 6, children: _jsxs("div", { className: "text-sm", children: [_jsx("span", { className: "text-theme-secondary", children: "\u5DF2\u5B8C\u6210: " }), _jsx("span", { className: "font-medium text-success", children: project.completed })] }) }), _jsx(Col, { span: 6, children: _jsxs("div", { className: "text-sm", children: [_jsx("span", { className: "text-theme-secondary", children: "\u963B\u585E: " }), _jsx("span", { className: "font-medium text-error", children: project.blocked })] }) }), _jsx(Col, { span: 6, children: _jsx("div", { className: "text-sm text-theme-tertiary", children: "\u70B9\u51FB\u67E5\u770B\u8BE6\u60C5 \u2192" }) })] })] }) }, project.id)))) }) })] }));
}
