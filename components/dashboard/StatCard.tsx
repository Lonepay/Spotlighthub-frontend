import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  variant = 'default',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  variant?: 'default' | 'alert';
}) {
  const isAlert = variant === 'alert';

  return (
    <Card
      className={cn(
        'p-5 shadow-none flex flex-col gap-3 min-w-0',
        isAlert && 'bg-destructive/10 border-destructive/30'
      )}
    >
      <span className={cn('text-sm font-medium text-muted-foreground flex items-center gap-2', isAlert && 'text-destructive')}>
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </span>
      <div className={cn('font-display font-bold text-[1.75rem] leading-9 sm:text-[2.25rem] sm:leading-[2.75rem] tabular-nums truncate', isAlert && 'text-destructive')}>
        {value}
      </div>
      {hint && <p className={cn('text-xs text-muted-foreground', isAlert && 'text-destructive/80')}>{hint}</p>}
    </Card>
  );
}
