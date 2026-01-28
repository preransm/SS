import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom, JoinRequest } from '@/hooks/useRoom';

export default function ViewerWaitingPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { room, fetchRoom, requestJoin, joinRequests, loading } = useRoom();
  const [myRequest, setMyRequest] = useState<JoinRequest | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const viewerName = sessionStorage.getItem(`name_${roomCode}`) || 'Viewer';

  // Fetch room on mount
  useEffect(() => {
    if (roomCode) {
      fetchRoom(roomCode).then((result) => {
        if (!result) {
          setError('Room not found or has ended.');
        }
      }).catch((err) => {
        setError('Failed to fetch room: ' + err.message);
        console.error('Failed to fetch room:', err);
      });
    }
  }, [roomCode, fetchRoom]);

  // Submit join request when room is loaded
  useEffect(() => {
    const submitRequest = async () => {
      if (room && !myRequest && !isRequesting) {
        setIsRequesting(true);
        try {
          const result = await requestJoin(viewerName);
          if (result) {
            setMyRequest(result.request);
            setViewerId(result.viewerId);
            sessionStorage.setItem(`viewer_${roomCode}`, result.viewerId);
          } else {
            setError('Failed to submit join request.');
            console.error('Failed to submit join request: result is null');
          }
        } catch (err: any) {
          setError('Failed to submit join request: ' + err.message);
          console.error('Failed to submit join request:', err);
        }
        setIsRequesting(false);
      }
    };

    submitRequest();
  }, [room, myRequest, isRequesting, requestJoin, viewerName, roomCode]);

  // Watch for status changes in join requests
  useEffect(() => {
    if (viewerId && joinRequests) {
      const myUpdatedRequest = joinRequests.find(r => r.viewer_id === viewerId);
      if (myUpdatedRequest) {
        setMyRequest(myUpdatedRequest);

        if (myUpdatedRequest.status === 'approved') {
          // Navigate to viewer room
          navigate(`/room/${roomCode}/viewer`);
        } else if (myUpdatedRequest.status === 'rejected') {
          // Stay on this page and show rejection
        }
      }
    }
  }, [joinRequests, viewerId, roomCode, navigate]);

  // Check if room is still active
  useEffect(() => {
    if (room && !room.is_active) {
      navigate(`/room/${roomCode}/end`);
    }
  }, [room, roomCode, navigate]);

  const handleCancel = useCallback(() => {
    sessionStorage.removeItem(`name_${roomCode}`);
    sessionStorage.removeItem(`viewer_${roomCode}`);
    navigate('/');
  }, [roomCode, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <svg className="w-8 h-8 animate-spin text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-muted-foreground">Loading...</p>
          {error && <p className="text-destructive mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Room Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This room doesn't exist or has ended.
          </p>
          {error && <p className="text-destructive mt-2">{error}</p>}
          <button
            onClick={() => navigate('/')}
            className="h-11 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isRejected = myRequest?.status === 'rejected';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {isRejected ? (
          <>
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Request Denied</h1>
            <p className="text-muted-foreground mb-8">
              The host has denied your request to join this room.
            </p>
            <button
              onClick={handleCancel}
              className="h-11 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Back to Home
            </button>
          </>
        ) : (
          <>
            {/* Animated waiting indicator */}
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
              <div className="absolute inset-2 rounded-full bg-primary/30 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
              <div className="absolute inset-4 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold mb-2">Waiting for Approval</h1>
            <p className="text-muted-foreground mb-2">
              Waiting for <span className="font-medium text-foreground">{room.host_name}</span> to approve your request...
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              You'll be automatically redirected once approved.
            </p>

            <div className="p-4 rounded-lg bg-muted mb-8">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Room Code</p>
              <p className="text-xl font-mono font-bold tracking-widest">{roomCode}</p>
            </div>

            <button
              onClick={handleCancel}
              className="h-11 px-6 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancel Request
            </button>
          </>
        )}
      </div>
    </div>
  );
}
