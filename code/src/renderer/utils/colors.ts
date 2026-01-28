export const STATUS_COLORS = {
  active: '#2B7FFF',
  completed: '#00C950',
  on_hold: '#FE9A00',
  cancelled: '#D4D4D4',
} as const;

export const WP_STATUS_COLORS: Record<string, string> = {
  todo: '#6B7280',
  in_progress: '#2B7FFF',
  done: '#00C950',
  blocked: '#DC2626',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: '#6B7280',
  medium: '#FE9A00',
  high: '#DC2626',
  critical: '#7C3AED',
};

export const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.active;
};
