import type { RenderUnit } from '@/utils/date';
import { WP_STATUS_COLORS } from '@/utils/colors';
import {
  PlusIcon, DownloadIcon, MinusIcon, ArrowLeftIcon,
  ArrowsPointingOutIcon,
} from '@/icons';

interface GanttTopBarProps {
  viewMode: 'projects' | 'workpackages';
  projectName: string | null;
  scale: RenderUnit;
  windowSpanDays: number;
  selectedStatus: string | null;
  onBack: () => void;
  onSetScale: (s: RenderUnit) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onAutoZoom: () => void;
  onSetStatus: (s: string | null) => void;
  onNewTask: () => void;
  onExport: () => void;
}

export function GanttTopBar({
  viewMode, projectName, scale, windowSpanDays, selectedStatus,
  onBack, onSetScale, onZoomIn, onZoomOut, onAutoZoom, onSetStatus,
  onNewTask, onExport,
}: GanttTopBarProps) {
  return (
    <div className="flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {viewMode === 'workpackages' && (
            <button className="btn btn-secondary flex items-center gap-2" onClick={onBack}>
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Projects
            </button>
          )}
          <div>
            <h1 className="section-title mb-1">
              {viewMode === 'projects' ? 'Project Timeline' : projectName || 'Work Packages'}
            </h1>
            <p className="section-subtitle">
              {viewMode === 'projects' ? 'Click on any project to view its work packages' : 'Viewing and managing work packages'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'workpackages' && (
            <>
              <button className="btn btn-secondary" onClick={onNewTask}>
                <PlusIcon className="w-4 h-4" /> New Task
              </button>
              <button className="btn btn-secondary" onClick={onExport}>
                <DownloadIcon className="w-4 h-4" /> Export
              </button>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-tertiary">Zoom:</span>
          <button className="btn btn-ghost p-1" onClick={onZoomIn} title="Zoom In">
            <MinusIcon className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-text-secondary capitalize">{scale} · {windowSpanDays}d</span>
          <button className="btn btn-ghost p-1" onClick={onZoomOut} title="Zoom Out">
            <PlusIcon className="w-4 h-4" />
          </button>
          <button className="btn btn-ghost p-1" onClick={onAutoZoom} title="Auto-zoom to fit">
            <ArrowsPointingOutIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Scale Selector */}
          <div className="flex items-center bg-background-secondary rounded border border-border">
            {(['day', 'week', 'month'] as RenderUnit[]).map((u) => (
              <button
                key={u}
                className={`px-2 py-1 text-xs ${scale === u ? 'text-primary bg-background-hover' : 'text-text-tertiary'}`}
                onClick={() => onSetScale(u)}
              >
                {u.charAt(0).toUpperCase() + u.slice(1)}
              </button>
            ))}
          </div>

          {viewMode === 'workpackages' && (
            <div className="flex items-center gap-2">
              {(['done', 'in_progress', 'todo', 'blocked'] as const).map((s) => (
                <button
                  key={s}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                    selectedStatus === s ? 'text-text-primary bg-background-hover' : 'text-text-tertiary'
                  }`}
                  onClick={() => onSetStatus(selectedStatus === s ? null : s)}
                >
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: WP_STATUS_COLORS[s] }} />
                  {s === 'in_progress' ? 'In Progress' : s === 'todo' ? 'To Do' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
