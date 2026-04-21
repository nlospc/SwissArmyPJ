/**
 * Time formatting utilities for My Work feature
 */

import { isToday } from './dateHelpers';

/**
 * Format minutes to compact time string
 * Examples: 30 → "30m", 90 → "1.5h", 120 → "2h"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = minutes / 60;

  // If it's a whole number, show just hours
  if (hours % 1 === 0) {
    return `${hours}h`;
  }

  // Otherwise show decimal
  return `${hours.toFixed(1)}h`;
}

/**
 * Format minutes to human-readable string
 * Alias for formatDuration for consistency
 * Examples: 30 → "30m", 90 → "1.5h", 120 → "2h"
 */
export function formatMinutes(minutes: number): string {
  return formatDuration(minutes);
}

/**
 * Format date for weekly chart display
 * Shows "Mon", "Tue", etc. or "Today" if it's the current day
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  
  // If it's today, show "Today"
  if (isToday(dateString)) {
    return 'Today';
  }
  
  // Otherwise show abbreviated day name
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Format minutes to HH:MM format
 * Examples: 30 → "00:30", 90 → "01:30", 150 → "02:30"
 */
export function formatDurationHHMM(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Format minutes to HH:MM:SS format
 * Examples: 90 → "01:30:00", 150 → "02:30:00"
 */
export function formatDurationHHMMSS(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
}

/**
 * Format seconds to MM:SS format (for Pomodoro countdown)
 * Examples: 90 → "01:30", 1500 → "25:00"
 */
export function formatSecondsMMSS(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format time range for display
 * Examples: "09:00 AM - 10:30 AM" (2024-01-01T09:00:00, 2024-01-01T10:30:00)
 */
export function formatTimeRange(startTime: string, endTime: string | null): string {
  const start = new Date(startTime);

  const startFormatted = start.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (!endTime) {
    return `${startFormatted} - Now`;
  }

  const end = new Date(endTime);
  const endFormatted = end.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Calculate duration between two timestamps in minutes
 */
export function calculateDuration(startTime: string, endTime: string | null): number {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();

  return Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
}

/**
 * Parse time input string to minutes
 * Examples: "1h" → 60, "30m" → 30, "1.5h" → 90, "90" → 90
 */
export function parseTimeInput(input: string): number | null {
  const trimmed = input.trim().toLowerCase();

  // Check for hour format (1h, 1.5h)
  const hourMatch = trimmed.match(/^(\d+(?:\.\d+)?)h$/);
  if (hourMatch) {
    return Math.round(parseFloat(hourMatch[1]) * 60);
  }

  // Check for minute format (30m)
  const minuteMatch = trimmed.match(/^(\d+)m$/);
  if (minuteMatch) {
    return parseInt(minuteMatch[1], 10);
  }

  // Check for plain number (assume minutes)
  const numberMatch = trimmed.match(/^(\d+)$/);
  if (numberMatch) {
    return parseInt(numberMatch[1], 10);
  }

  return null;
}

/**
 * Format duration for display with context
 * Examples:
 * - logged: "2.5h logged"
 * - estimated: "3h estimated"
 * - remaining: "1.5h remaining"
 */
export function formatDurationWithLabel(
  minutes: number,
  label: 'logged' | 'estimated' | 'remaining'
): string {
  return `${formatDuration(minutes)} ${label}`;
}
