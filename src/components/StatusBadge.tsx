import { cn } from '@/lib/utils';

type StatusType = 
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'active'
  | 'paused'
  | 'stopped'
  | 'error'
  | 'pending'
  | 'approved'
  | 'rejected';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusConfig: Record<StatusType, { color: string; label: string }> = {
  idle: { color: 'bg-muted text-muted-foreground', label: 'Idle' },
  connecting: { color: 'bg-warning/20 text-warning', label: 'Connecting' },
  connected: { color: 'bg-success/20 text-success', label: 'Connected' },
  active: { color: 'bg-success/20 text-success', label: 'Live' },
  paused: { color: 'bg-warning/20 text-warning', label: 'Paused' },
  stopped: { color: 'bg-muted text-muted-foreground', label: 'Stopped' },
  error: { color: 'bg-destructive/20 text-destructive', label: 'Error' },
  pending: { color: 'bg-warning/20 text-warning', label: 'Pending' },
  approved: { color: 'bg-success/20 text-success', label: 'Approved' },
  rejected: { color: 'bg-destructive/20 text-destructive', label: 'Rejected' },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      config.color,
      className
    )}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        status === 'active' || status === 'connected' ? 'bg-success animate-pulse' :
        status === 'connecting' || status === 'pending' || status === 'paused' ? 'bg-warning' :
        status === 'error' || status === 'rejected' ? 'bg-destructive' :
        'bg-muted-foreground'
      )} />
      {label || config.label}
    </span>
  );
}
