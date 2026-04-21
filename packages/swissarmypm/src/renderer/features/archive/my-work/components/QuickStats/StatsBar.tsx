/**
 * StatsBar - Top metrics bar showing quick stats
 */

import {
  CheckCircle2,
  Clock,
  Timer,
  FolderKanban,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from './StatCard';
import { useMyWorkStore } from '@/stores/useMyWorkStore';

export function StatsBar() {
  const stats = useMyWorkStore((state) => state.stats);

  if (!stats) {
    return (
      <div className="flex gap-4 mb-6">
        <div className="text-sm text-muted-foreground">Loading stats...</div>
      </div>
    );
  }

  // Determine daily progress variant
  const progressVariant =
    stats.dailyProgress >= 100
      ? 'success'
      : stats.dailyProgress >= 75
      ? 'warning'
      : 'default';

  // Determine overdue variant
  const overdueVariant = stats.overdueTasks > 0 ? 'danger' : 'default';

  return (
    <div className="flex gap-4 px-6 py-4 overflow-x-auto">
      <StatCard
        icon={CheckCircle2}
        label="Today's Tasks"
        value={stats.todayTasks}
        variant="default"
      />

      <StatCard
        icon={Clock}
        label="Hours Logged"
        value={stats.todayHours}
        subtext={`Target: ${(stats.dailyTarget / 60).toFixed(1)}h`}
        variant="default"
      />

      <StatCard
        icon={Timer}
        label="Pomodoros"
        value={stats.todayPomodoros}
        variant="default"
      />

      <StatCard
        icon={FolderKanban}
        label="Active Projects"
        value={stats.activeProjects}
        variant="default"
      />

      <StatCard
        icon={AlertCircle}
        label="Overdue"
        value={stats.overdueTasks}
        variant={overdueVariant}
      />

      <StatCard
        icon={TrendingUp}
        label="Daily Progress"
        value={`${stats.dailyProgress}%`}
        variant={progressVariant}
      />
    </div>
  );
}
