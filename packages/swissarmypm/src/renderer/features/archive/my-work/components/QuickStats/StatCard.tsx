/**
 * StatCard - Individual metric card for Quick Stats bar
 */

import { type LucideIcon } from 'lucide-react';
import { Card } from 'antd';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: { borderColor: undefined, background: undefined, iconColor: '#6b7280' },
  success: { borderColor: '#86efac', background: '#f0fdf4', iconColor: '#16a34a' },
  warning: { borderColor: '#fcd34d', background: '#fffbeb', iconColor: '#d97706' },
  danger: { borderColor: '#fca5a5', background: '#fef2f2', iconColor: '#dc2626' },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  variant = 'default',
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card
      className={`flex-1 min-w-[140px] ${className || ''}`}
      styles={{ body: { padding: 16 } }}
      style={{ borderColor: styles.borderColor, backgroundColor: styles.background }}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-theme-container" style={{ color: styles.iconColor }}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-semibold">{value}</span>
          <span className="text-xs text-theme-secondary">{label}</span>
          {subtext && (
            <span className="text-[10px] text-theme-secondary">{subtext}</span>
          )}
        </div>
      </div>
    </Card>
  );
}
