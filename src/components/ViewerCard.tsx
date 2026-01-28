import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { JoinRequest, Viewer } from '@/hooks/useRoom';

interface ViewerRequestCardProps {
  request: JoinRequest;
  onApprove: () => void;
  onReject: () => void;
}

export function ViewerRequestCard({ request, onApprove, onReject }: ViewerRequestCardProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-medium text-primary">
            {request.viewer_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium">{request.viewer_name}</p>
          <StatusBadge status={request.status as any} className="mt-1" />
        </div>
      </div>
      
      {request.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-success text-success-foreground hover:bg-success/90 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={onReject}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

interface ViewerListCardProps {
  viewer: Viewer;
}

export function ViewerListCard({ viewer }: ViewerListCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-medium text-primary">
            {viewer.name.charAt(0).toUpperCase()}
          </span>
        </div>
        {viewer.online && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-card" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium">{viewer.name}</p>
        <p className="text-xs text-muted-foreground">
          {viewer.online ? 'Online' : 'Offline'}
        </p>
      </div>
    </div>
  );
}
