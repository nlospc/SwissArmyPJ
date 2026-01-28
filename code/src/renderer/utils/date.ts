export const DAY_MS = 24 * 60 * 60 * 1000;

export type RenderUnit = 'day' | 'week' | 'month';

export const formatLocalISODate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const parseLocalISODate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map((v) => Number(v));
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

export const clampDateOnly = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const startOfWeekMonday = (date: Date): Date => {
  const d = clampDateOnly(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

export const endOfWeekSunday = (date: Date): Date => {
  const start = startOfWeekMonday(date);
  const d = new Date(start);
  d.setDate(d.getDate() + 6);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const startOfMonth = (date: Date): Date => {
  const d = clampDateOnly(date);
  d.setDate(1);
  return d;
};

export const endOfMonth = (date: Date): Date => {
  const d = clampDateOnly(date);
  d.setMonth(d.getMonth() + 1, 0);
  return d;
};

export const isSameDay = (a: Date, b: Date): boolean => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

export const isBetweenInclusive = (d: Date, a: Date, b: Date): boolean => {
  const t = d.getTime();
  const from = Math.min(a.getTime(), b.getTime());
  const to = Math.max(a.getTime(), b.getTime());
  return t >= from && t <= to;
};

export const snapStartForUnit = (date: Date, unit: RenderUnit): Date => {
  switch (unit) {
    case 'day':
      return clampDateOnly(date);
    case 'week':
      return startOfWeekMonday(date);
    case 'month':
      return startOfMonth(date);
  }
};

export const snapEndForUnit = (date: Date, unit: RenderUnit): Date => {
  switch (unit) {
    case 'day':
      return clampDateOnly(date);
    case 'week':
      return endOfWeekSunday(date);
    case 'month':
      return endOfMonth(date);
  }
};

export interface TimelineItem {
  label: string;
  subLabel?: string;
  start: Date;
  end: Date;
  isMajor: boolean;
}

export const generateTimeline = (viewStart: Date, viewEnd: Date, unit: RenderUnit): TimelineItem[] => {
  const timeline: TimelineItem[] = [];
  const from = clampDateOnly(viewStart);
  const to = clampDateOnly(viewEnd);
  let cursor = new Date(from);

  const push = (start: Date, end: Date, label: string, subLabel?: string) => {
    timeline.push({ start, end, label, subLabel, isMajor: true });
  };

  switch (unit) {
    case 'day': {
      while (cursor <= to) {
        const start = new Date(cursor);
        const end = new Date(cursor);
        end.setDate(end.getDate() + 1);
        const isMonthBoundary = cursor.getDate() === 1;
        const subLabel = isMonthBoundary
          ? cursor.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          : undefined;
        push(start, end, String(cursor.getDate()), subLabel);
        cursor.setDate(cursor.getDate() + 1);
      }
      break;
    }
    case 'week': {
      while (cursor <= to) {
        const start = new Date(cursor);
        const end = new Date(cursor);
        end.setDate(end.getDate() + 7);
        const weekNum = Math.ceil(
          (startOfWeekMonday(start).getTime() - new Date(start.getFullYear(), 0, 1).getTime()) /
            (DAY_MS * 7)
        );
        push(
          start,
          end,
          `W${weekNum}`,
          start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );
        cursor = end;
      }
      break;
    }
    case 'month': {
      while (cursor <= to) {
        const start = new Date(cursor);
        const end = new Date(cursor);
        end.setMonth(end.getMonth() + 1);
        push(start, end, start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
        cursor = end;
      }
      break;
    }
  }

  return timeline;
};

// Bar position calculation
export const calculateBarStyle = (
  startDate: Date | null,
  endDate: Date | null,
  viewStart: Date,
  viewEnd: Date
): { left: string; width: string; visible: boolean } => {
  if (!startDate || !endDate) {
    return { left: '0%', width: '0%', visible: false };
  }
  const startMs = startDate.getTime();
  const rawEndMs = endDate.getTime();
  const endMs = rawEndMs <= startMs ? startMs + DAY_MS : rawEndMs;
  const totalDuration = viewEnd.getTime() - viewStart.getTime();
  if (totalDuration <= 0) {
    return { left: '0%', width: '0%', visible: false };
  }
  const startOffset = Math.max(0, startMs - viewStart.getTime());
  const duration = Math.min(endMs, viewEnd.getTime()) - Math.max(startMs, viewStart.getTime());
  return {
    left: `${(startOffset / totalDuration) * 100}%`,
    width: `${Math.max(0, (duration / totalDuration) * 100)}%`,
    visible: duration > 0,
  };
};
