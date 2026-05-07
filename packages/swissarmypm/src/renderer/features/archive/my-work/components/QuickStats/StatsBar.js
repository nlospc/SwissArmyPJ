import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * StatsBar - Top metrics bar showing quick stats
 */
import { CheckCircle2, Clock, Timer, FolderKanban, AlertCircle, TrendingUp, } from 'lucide-react';
import { StatCard } from './StatCard';
import { useMyWorkStore } from '@/stores/useMyWorkStore';
export function StatsBar() {
    const stats = useMyWorkStore((state) => state.stats);
    if (!stats) {
        return (_jsx("div", { className: "flex gap-4 mb-6", children: _jsx("div", { className: "text-sm text-muted-foreground", children: "Loading stats..." }) }));
    }
    // Determine daily progress variant
    const progressVariant = stats.dailyProgress >= 100
        ? 'success'
        : stats.dailyProgress >= 75
            ? 'warning'
            : 'default';
    // Determine overdue variant
    const overdueVariant = stats.overdueTasks > 0 ? 'danger' : 'default';
    return (_jsxs("div", { className: "flex gap-4 px-6 py-4 overflow-x-auto", children: [_jsx(StatCard, { icon: CheckCircle2, label: "Today's Tasks", value: stats.todayTasks, variant: "default" }), _jsx(StatCard, { icon: Clock, label: "Hours Logged", value: stats.todayHours, subtext: `Target: ${(stats.dailyTarget / 60).toFixed(1)}h`, variant: "default" }), _jsx(StatCard, { icon: Timer, label: "Pomodoros", value: stats.todayPomodoros, variant: "default" }), _jsx(StatCard, { icon: FolderKanban, label: "Active Projects", value: stats.activeProjects, variant: "default" }), _jsx(StatCard, { icon: AlertCircle, label: "Overdue", value: stats.overdueTasks, variant: overdueVariant }), _jsx(StatCard, { icon: TrendingUp, label: "Daily Progress", value: `${stats.dailyProgress}%`, variant: progressVariant })] }));
}
