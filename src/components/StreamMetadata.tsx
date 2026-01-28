import { StreamMetadata as MetadataType } from '@/hooks/useScreenShare';
import { cn } from '@/lib/utils';

interface StreamMetadataProps {
  metadata: MetadataType | null;
  className?: string;
}

const displaySurfaceLabels: Record<string, string> = {
  monitor: 'Entire Screen',
  window: 'Window',
  browser: 'Browser Tab',
  unknown: 'Screen',
};

export function StreamMetadata({ metadata, className }: StreamMetadataProps) {
  if (!metadata) return null;

  return (
    <div className={cn('flex flex-wrap gap-3 text-xs', className)}>
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted">
        <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-foreground font-medium">
          {displaySurfaceLabels[metadata.displaySurface] || metadata.displaySurface}
        </span>
      </div>
      
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted">
        <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <span className="text-foreground font-medium">
          {metadata.resolution.width} × {metadata.resolution.height}
        </span>
      </div>

      {metadata.frameRate && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted">
          <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-foreground font-medium">
            {Math.round(metadata.frameRate)} FPS
          </span>
        </div>
      )}
    </div>
  );
}
