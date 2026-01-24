import { useState } from 'react';
import { useStore } from './store';
import { formatCurrency } from './utils';
import {
  PlusIcon,
  DownloadIcon,
  MinusIcon,
  PlusIcon as ZoomInIcon,
  MagnifyingGlassIcon,
} from './icons';
import {
  CheckCircleIcon,
  CalendarIcon,
  ChartBarIcon,
} from './icons';

interface GanttRow {
  id: string;
  name: string;
  status: string;
  progress: number;
  startDate: Date;
  endDate: Date;
  budget?: number;
  spent?: number;
}

// Generate mock timeline data
const generateGanttData = (): GanttRow[] => [
  {
    id: '1',
    name: 'Enterprise CRM Migration',
    status: 'active',
    progress: 28,
    startDate: new Date('2026-01-15'),
    endDate: new Date('2026-06-30'),
    budget: 450000,
    spent: 125000,
  },
  {
    id: '2',
    name: 'Mobile App Redesign',
    status: 'active',
    progress: 0,
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-04-30'),
    budget: 180000,
    spent: 0,
  },
  {
    id: '3',
    name: 'Infrastructure Upgrade Q1',
    status: 'active',
    progress: 67,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-03-31'),
    budget: 320000,
    spent: 215000,
  },
  {
    id: '4',
    name: 'Customer Portal Development',
    status: 'completed',
    progress: 100,
    startDate: new Date('2025-10-01'),
    endDate: new Date('2025-12-31'),
    budget: 280000,
    spent: 275000,
  },
  {
    id: '5',
    name: 'Security Audit 2026',
    status: 'active',
    progress: 0,
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-03-31'),
    budget: 150000,
    spent: 0,
  },
];

// Figma color mapping for Gantt chart
const STATUS_COLORS = {
  completed: '#00C950',
  active: '#2B7FFF',
  'on-hold': '#FE9A00',
  cancelled: '#D4D4D4',
  milestone: '#AD46FF',
} as const;

const getStatusColor = (status: string) => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.active;
};

export function GanttChart() {
  const { projects } = useStore();
  const [zoom, setZoom] = useState<'day' | 'week' | 'month'>('week');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Generate timeline weeks dynamically based on task dates
  const generateTimeline = () => {
    const ganttData = generateGanttData();
    const filteredData = selectedStatus
      ? ganttData.filter((item) => item.status === selectedStatus)
      : ganttData;

    // Find min start date and max end date
    const allDates = filteredData.flatMap(item => [item.startDate, item.endDate]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    // Add padding (1 week before and after)
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    // Calculate total weeks
    const totalWeeks = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const weeks = [];

    for (let i = 0; i < totalWeeks; i++) {
      const weekStart = new Date(minDate);
      weekStart.setDate(weekStart.getDate() + i * 7);
      weeks.push({
        label: `Week ${i + 1}`,
        start: weekStart,
      });
    }

    return { weeks, minDate, maxDate };
  };

  const { weeks: timeline, minDate, maxDate } = generateTimeline();
  const ganttData = generateGanttData();

  const filteredData = selectedStatus
    ? ganttData.filter((item) => item.status === selectedStatus)
    : ganttData;

  const calculateBarWidth = (startDate: Date, endDate: Date) => {
    const startDiff = (startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
    const totalWeeks = timeline.length;
    return {
      left: `${(startDiff / totalWeeks) * 100}%`,
      width: `${(duration / totalWeeks) * 100}%`,
    };
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title mb-1">Project Timeline</h1>
          <p className="section-subtitle">
            High-level view of all projects and milestones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary">
            <PlusIcon className="w-4 h-4" />
            New Project
          </button>
          <button className="btn btn-secondary">
            <DownloadIcon className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-tertiary">Zoom:</span>
            <button
              className={`btn btn-ghost p-1 ${zoom === 'day' ? 'text-primary bg-background-hover' : ''}`}
              onClick={() => setZoom('day')}
            >
              <MinusIcon className="w-4 h-4" />
            </button>
            <button
              className="btn btn-ghost px-3 py-1 text-sm"
              onClick={() => setZoom('week')}
            >
              Week
              <MagnifyingGlassIcon className="w-4 h-4 ml-1 opacity-50" />
            </button>
            <button
              className={`btn btn-ghost p-1 ${zoom === 'month' ? 'text-primary bg-background-hover' : ''}`}
              onClick={() => setZoom('month')}
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Filters */}
          <div className="flex items-center gap-2">
            <button
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                selectedStatus === 'completed'
                  ? 'text-text-primary bg-background-hover'
                  : 'text-text-tertiary'
              }`}
              onClick={() => setSelectedStatus(selectedStatus === 'completed' ? null : 'completed')}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: STATUS_COLORS.completed }}
              />
              Completed
            </button>
            <button
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                selectedStatus === 'active'
                  ? 'text-text-primary bg-background-hover'
                  : 'text-text-tertiary'
              }`}
              onClick={() => setSelectedStatus(selectedStatus === 'active' ? null : 'active')}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: STATUS_COLORS.active }}
              />
              Active
            </button>
            <button
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                selectedStatus === 'on-hold'
                  ? 'text-text-primary bg-background-hover'
                  : 'text-text-tertiary'
              }`}
              onClick={() => setSelectedStatus(selectedStatus === 'on-hold' ? null : 'on-hold')}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: STATUS_COLORS['on-hold'] }}
              />
              On Hold
            </button>
            <button
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                selectedStatus === 'cancelled'
                  ? 'text-text-primary bg-background-hover'
                  : 'text-text-tertiary'
              }`}
              onClick={() => setSelectedStatus(selectedStatus === 'cancelled' ? null : 'cancelled')}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: STATUS_COLORS.cancelled }}
              />
              Cancelled
            </button>
            <button
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                selectedStatus === 'milestone'
                  ? 'text-text-primary bg-background-hover'
                  : 'text-text-tertiary'
              }`}
              onClick={() => setSelectedStatus(selectedStatus === 'milestone' ? null : 'milestone')}
            >
              <div className="w-3 h-3 rounded-sm bg-border border-2 border-white shadow-sm" />
              Milestone
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-4 p-3 bg-badge-active border border-border-light rounded-lg flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm">💡</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary mb-0.5">
            Click any project bar or name to view detailed work packages
          </p>
          <p className="text-xs text-text-secondary">
            This is the project-level view. Drill down to see tasks and dependencies.
          </p>
        </div>
        <button className="btn btn-ghost text-xs py-1 px-2">Got it</button>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1 overflow-auto border border-border rounded-lg bg-white">
        {/* Timeline Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-border-light">
          <div className="flex min-w-max">
            <div className="w-[320px] p-3.5 text-xs font-medium text-text-secondary uppercase tracking-wide border-r border-border">
              Project Name
            </div>
            <div className="flex-1 flex">
              {timeline.map((week) => (
                <div
                  key={week.label}
                  className="flex-1 p-3.5 text-center border-r border-border-light"
                >
                  <div className="text-xs font-medium text-text-secondary">
                    {week.label} ({week.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gantt Rows */}
        <div className="min-w-max">
          {filteredData.map((row) => {
            const barStyle = calculateBarWidth(row.startDate, row.endDate);
            const statusColor = getStatusColor(row.status);
            const isCompleted = row.status === 'completed';

            return (
              <div
                key={row.id}
                className="flex border-b border-border-light hover:bg-background-hover transition-colors"
              >
                {/* Project Info */}
                <div className="w-[320px] p-3 border-r border-border-light flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary mb-1">
                      {row.name}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      isCompleted
                        ? 'bg-badge-completed text-badge-completed-text'
                        : 'bg-badge-active text-badge-active-text'
                    }`}
                  >
                    {row.status === 'completed' ? 'Completed' : 'Active'}
                  </span>
                </div>

                {/* Timeline Bar */}
                <div className="flex-1 relative h-[56px] p-3">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-8 rounded bg-primary/30 border-2 border-primary flex items-center justify-between px-3"
                    style={{
                      left: barStyle.left,
                      width: barStyle.width,
                      backgroundColor: isCompleted ? `${statusColor}20` : '',
                      borderColor: statusColor,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center"
                        style={{ backgroundColor: statusColor }}
                      >
                        <span className="text-[10px] font-bold text-white">
                          {row.progress}%
                        </span>
                      </div>
                      <span className="text-xs font-medium text-text-primary">
                        {row.name}
                      </span>
                    </div>
                  </div>

                  {/* Milestones/Events */}
                  {row.status !== 'completed' && (
                    <>
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                        style={{
                          left: `calc(${barStyle.left} + ${parseFloat(barStyle.width) * 0.3}%)`,
                          backgroundColor: STATUS_COLORS.milestone,
                        }}
                      >
                        <ChartBarIcon className="w-4 h-4 text-white" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
