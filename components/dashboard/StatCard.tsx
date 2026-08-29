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
        'p-5 shadow-none transition-all hover:shadow-lg hover:-translate-y-0.5',
        isAlert && 'bg-destructive text-destructive-foreground border-transparent'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={cn('text-sm font-medium text-muted-foreground', isAlert && 'text-destructive-foreground/80')}>
          {label}
        </span>
        <div className={cn('w-9 h-9 rounded-lg bg-muted flex items-center justify-center', isAlert && 'bg-white/20')}>
          <Icon className={cn('w-4 h-4 text-foreground', isAlert && 'text-destructive-foreground')} />
        </div>
      </div>
      <div className="text-2xl font-display font-bold">{value}</div>
      {hint && (
        <p className={cn('text-xs text-muted-foreground mt-1', isAlert && 'text-destructive-foreground/80')}>{hint}</p>
      )}
    </Card>
  );
}
