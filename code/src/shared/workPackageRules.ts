import type { WorkPackageStatus } from './types';

export function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.max(0, Math.min(100, Math.round(progress)));
}

export function progressFromStatus(status: WorkPackageStatus, currentProgress: number): number {
  if (status === 'done') return 100;
  if (status === 'todo') return 0;
  return clampProgress(currentProgress);
}

// UI helper: auto-updates status from progress, but keeps `blocked` unless it reaches 0/100.
export function statusFromProgress(progress: number, currentStatus: WorkPackageStatus): WorkPackageStatus {
  const p = clampProgress(progress);
  if (p === 0) return currentStatus === 'blocked' ? 'blocked' : 'todo';
  if (p === 100) return currentStatus === 'blocked' ? 'blocked' : 'done';
  if (currentStatus === 'todo' || currentStatus === 'done') return 'in_progress';
  return currentStatus;
}

