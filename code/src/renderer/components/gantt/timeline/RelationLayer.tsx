import type { Dependency, WorkPackage } from '@shared/types';

interface RelationLayerProps {
  dependencies: Dependency[];
  workPackages: WorkPackage[];
  viewStart: Date;
  viewEnd: Date;
  rowHeight: number;
}

export function RelationLayer({ dependencies, workPackages, viewStart, viewEnd, rowHeight }: RelationLayerProps) {
  const taskMap = new Map(workPackages.map((wp) => [wp.id, wp]));
  const taskIndexMap = new Map(workPackages.map((wp, i) => [wp.id, i]));
  const fsDeps = dependencies.filter((d) => d.type === 'finish_to_start');
  const totalMs = viewEnd.getTime() - viewStart.getTime();
  if (totalMs <= 0) return null;

  const lines = fsDeps.map((dep) => {
    const pred = taskMap.get(dep.predecessor_id);
    const succ = taskMap.get(dep.successor_id);
    if (!pred || !succ) return null;
    const predIdx = taskIndexMap.get(dep.predecessor_id);
    const succIdx = taskIndexMap.get(dep.successor_id);
    if (predIdx === undefined || succIdx === undefined) return null;
    const predEnd = pred.end_date ? new Date(pred.end_date) : null;
    const succStart = succ.start_date ? new Date(succ.start_date) : null;
    if (!predEnd || !succStart) return null;

    const hasConflict = succStart.getTime() < predEnd.getTime();
    const predX = ((predEnd.getTime() - viewStart.getTime()) / totalMs) * 100;
    const succX = ((succStart.getTime() - viewStart.getTime()) / totalMs) * 100;
    const predY = (predIdx + 0.5) * rowHeight;
    const succY = (succIdx + 0.5) * rowHeight;
    const midX = (predX + succX) / 2;
    const path = `M ${predX} ${predY} L ${midX} ${predY} L ${midX} ${succY} L ${succX} ${succY}`;
    return { id: dep.id, path, hasConflict };
  }).filter(Boolean) as { id: number; path: string; hasConflict: boolean }[];

  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible" width="100%" height="100%" preserveAspectRatio="none">
      <defs>
        <marker id="arr" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#9CA3AF" />
        </marker>
        <marker id="arr-c" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#DC2626" />
        </marker>
      </defs>
      {lines.map((l) => (
        <path
          key={l.id}
          d={l.path}
          stroke={l.hasConflict ? '#DC2626' : '#9CA3AF'}
          strokeWidth="2"
          fill="none"
          markerEnd={l.hasConflict ? 'url(#arr-c)' : 'url(#arr)'}
          opacity={l.hasConflict ? 1 : 0.6}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
