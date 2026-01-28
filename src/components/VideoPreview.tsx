import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface VideoPreviewProps {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
  showOverlay?: boolean;
  overlayText?: string;
}

export function VideoPreview({ 
  stream, 
  muted = true, 
  className,
  showOverlay = false,
  overlayText = 'Stream paused'
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <div className={cn(
      'relative w-full h-full bg-foreground/5 rounded-lg overflow-hidden',
      className
    )}>
      {stream ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className="w-full h-full object-contain"
          />
          {showOverlay && (
            <div className="absolute inset-0 bg-foreground/80 flex items-center justify-center">
              <span className="text-background text-lg font-medium">{overlayText}</span>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <svg
              className="mx-auto h-16 w-16 mb-4 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p>No screen being shared</p>
          </div>
        </div>
      )}
    </div>
  );
}
