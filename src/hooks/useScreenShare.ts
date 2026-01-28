import { useState, useCallback, useRef, useEffect } from 'react';

export type ScreenShareState = 
  | 'idle' 
  | 'requesting' 
  | 'active' 
  | 'paused' 
  | 'stopped' 
  | 'cancelled'
  | 'denied'
  | 'error';

export interface StreamMetadata {
  resolution: { width: number; height: number };
  displaySurface: string;
  frameRate: number | null;
}

export interface UseScreenShareReturn {
  state: ScreenShareState;
  stream: MediaStream | null;
  metadata: StreamMetadata | null;
  error: string | null;
  startSharing: () => Promise<void>;
  stopSharing: () => void;
  pauseSharing: () => void;
  resumeSharing: () => void;
}

export function useScreenShare(): UseScreenShareReturn {
  const [state, setState] = useState<ScreenShareState>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [metadata, setMetadata] = useState<StreamMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    setStream(null);
    setMetadata(null);
  }, []);

  const extractMetadata = useCallback((mediaStream: MediaStream): StreamMetadata => {
    const videoTrack = mediaStream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    
    return {
      resolution: {
        width: settings.width || 0,
        height: settings.height || 0,
      },
      displaySurface: (settings as any).displaySurface || 'unknown',
      frameRate: settings.frameRate || null,
    };
  }, []);

  const startSharing = useCallback(async () => {
    // Check for API support
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError('Screen sharing is not supported in this browser');
      setState('error');
      return;
    }

    // Clean up any existing stream
    cleanup();
    setError(null);
    setState('requesting');

    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setMetadata(extractMetadata(mediaStream));
      setState('active');

      // Handle track ended (user stops from browser UI)
      const videoTrack = mediaStream.getVideoTracks()[0];
      videoTrack.onended = () => {
        cleanup();
        setState('stopped');
      };

    } catch (err: any) {
      cleanup();
      
      if (err.name === 'NotAllowedError') {
        if (err.message.includes('Permission denied')) {
          setState('denied');
          setError('Permission to share screen was denied. Please allow screen sharing in your browser settings.');
        } else {
          setState('cancelled');
          setError('Screen sharing was cancelled.');
        }
      } else if (err.name === 'NotFoundError') {
        setState('error');
        setError('No screen to share was found.');
      } else if (err.name === 'NotReadableError') {
        setState('error');
        setError('Could not read the screen. It may be in use by another application.');
      } else {
        setState('error');
        setError(err.message || 'An unknown error occurred while trying to share screen.');
      }
    }
  }, [cleanup, extractMetadata]);

  const stopSharing = useCallback(() => {
    cleanup();
    setState('stopped');
  }, [cleanup]);

  const pauseSharing = useCallback(() => {
    if (streamRef.current && state === 'active') {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = false;
      });
      setState('paused');
    }
  }, [state]);

  const resumeSharing = useCallback(() => {
    if (streamRef.current && state === 'paused') {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = true;
      });
      setState('active');
    }
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    state,
    stream,
    metadata,
    error,
    startSharing,
    stopSharing,
    pauseSharing,
    resumeSharing,
  };
}
