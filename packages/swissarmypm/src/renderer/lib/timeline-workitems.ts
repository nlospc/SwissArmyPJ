import dayjs from 'dayjs';

import type { WorkItem } from '@/shared/types';

export type TimelineScale = 'day' | 'week' | 'month';

export type TimelineRiskDelayState = {
  isLateStartRisk: boolean;
  isLateFinishDelay: boolean;
  severity: 'none' | 'risk' | 'delay';
  label: string;
};

const DEFAULT_HOLIDAYS_2026_HK = new Set([
  '2026-01-01',
  '2026-02-17',
  '2026-02-18',
  '2026-02-19',
  '2026-04-03',
  '2026-04-04',
  '2026-04-06',
  '2026-05-01',
  '2026-05-25',
  '2026-06-19',
  '2026-07-01',
  '2026-09-26',
  '2026-10-01',
  '2026-10-19',
  '2026-12-25',
  '2026-12-26',
]);

export function isDefaultWorkingDay(date: dayjs.Dayjs): boolean {
  const day = date.day();
  if (day === 0 || day === 6) return false;
  return !DEFAULT_HOLIDAYS_2026_HK.has(date.format('YYYY-MM-DD'));
}

export function calculateWorkingDays(startDate?: string | null, endDate?: string | null): number | null {
  if (!startDate || !endDate) return null;

  const start = dayjs(startDate);
  const end = dayjs(endDate);
  if (!start.isValid() || !end.isValid() || end.isBefore(start, 'day')) return null;

  let cursor = start.startOf('day');
  let days = 0;
  while (cursor.isSame(end, 'day') || cursor.isBefore(end, 'day')) {
    if (isDefaultWorkingDay(cursor)) days += 1;
    cursor = cursor.add(1, 'day');
  }

  return days;
}

export function deriveRiskDelayState(item: WorkItem): TimelineRiskDelayState {
  const isLateStartRisk = Boolean(
    item.actual_start_date &&
      item.start_date &&
      dayjs(item.actual_start_date).isAfter(dayjs(item.start_date), 'day'),
  );
  const isLateFinishDelay = Boolean(
    item.actual_end_date &&
      item.end_date &&
      dayjs(item.actual_end_date).isAfter(dayjs(item.end_date), 'day'),
  );

  if (isLateFinishDelay) {
    return { isLateStartRisk, isLateFinishDelay, severity: 'delay', label: 'Delayed' };
  }
  if (isLateStartRisk) {
    return { isLateStartRisk, isLateFinishDelay, severity: 'risk', label: 'At risk' };
  }
  return { isLateStartRisk, isLateFinishDelay, severity: 'none', label: 'On track' };
}

export function nextStatusPatch(item: WorkItem, today = dayjs().format('YYYY-MM-DD')) {
  if (item.type === 'milestone') return null;

  if (item.status === 'not_started') {
    return {
      status: 'in_progress' as const,
      actual_start_date: item.actual_start_date || today,
    };
  }

  if (item.status === 'in_progress') {
    return {
      status: 'done' as const,
      actual_end_date: item.actual_end_date || today,
    };
  }

  return null;
}
