/**
 * StatCard - Individual metric card for Quick Stats bar
 */

import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/components/ui/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  variant = 'default',
  className,
}: StatCardProps) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-500/30 bg-green-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    danger: 'border-red-500/30 bg-red-500/5',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    success: 'text-green-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  };

  return (
    <Card className={cn('flex-1 min-w-[140px]', variantStyles[variant], className)}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn('p-2 rounded-lg bg-background', iconStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-semibold">{value}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
          {subtext && (
            <span className="text-[10px] text-muted-foreground/70">{subtext}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
