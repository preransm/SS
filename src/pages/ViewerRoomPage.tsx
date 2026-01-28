import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebRTCPeer } from '@/hooks/useWebRTCPeer';
import { useRoom } from '@/hooks/useRoom';
import { VideoPreview } from '@/components/VideoPreview';
import { StatusBadge } from '@/components/StatusBadge';
import { ChatPanel } from '@/components/ChatPanel';
import { ViewerListCard } from '@/components/ViewerCard';

export default function ViewerRoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const viewerId = sessionStorage.getItem(`viewer_${roomCode}`) || '';
  const viewerName = sessionStorage.getItem(`name_${roomCode}`) || 'Viewer';

  const {
    room,
    joinRequests,
    messages,
    viewers,
    fetchRoom,
    sendMessage,
    trackPresence,
    loading,
  } = useRoom();

  const {
    connectionState,
    remoteStream,
  } = useWebRTCPeer(roomCode || '', viewerId, false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'viewers' | 'chat'>('chat');
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Verify viewer access
  useEffect(() => {
    if (!viewerId && roomCode) {
      navigate(`/room/${roomCode}/join`);
    }
  }, [viewerId, roomCode, navigate]);

  // Fetch room on mount
  useEffect(() => {
    if (roomCode) {
      fetchRoom(roomCode);
    }
  }, [roomCode, fetchRoom]);

  // Check if viewer is approved
  useEffect(() => {
    if (viewerId && joinRequests.length > 0) {
      const myRequest = joinRequests.find(r => r.viewer_id === viewerId);
      if (myRequest) {
        if (myRequest.status === 'pending') {
          navigate(`/room/${roomCode}/waiting`);
        } else if (myRequest.status === 'rejected') {
          navigate(`/room/${roomCode}/waiting`);
        }
      }
    }
  }, [joinRequests, viewerId, roomCode, navigate]);

  // Check if room is still active
  useEffect(() => {
    if (room && !room.is_active) {
      navigate(`/room/${roomCode}/end?role=viewer`);
    }
  }, [room, roomCode, navigate]);

  // Track viewer presence
  useEffect(() => {
    if (room && viewerId) {
      trackPresence(viewerId, viewerName);
    }
  }, [room, viewerId, viewerName, trackPresence]);

  const handleSendMessage = useCallback((message: string) => {
    sendMessage(viewerId, viewerName, message);
  }, [sendMessage, viewerId, viewerName]);

  const toggleFullscreen = useCallback(async () => {
    if (!videoContainerRef.current) return;

    if (!document.fullscreenElement) {
      try {
        await videoContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Error entering fullscreen:', err);
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const approvedViewers = joinRequests.filter(r => r.status === 'approved');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <svg className="w-8 h-8 animate-spin text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-muted-foreground">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 h-16 px-6 border-b border-border flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-semibold">Viewing</span>
          </div>
          
          <div className="h-8 w-px bg-border" />
          
          <div className="text-sm">
            <span className="text-muted-foreground">Host: </span>
            <span className="font-medium">{room?.host_name}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <StatusBadge 
            status={connectionState === 'connected' ? 'connected' : connectionState === 'connecting' ? 'connecting' : 'idle'} 
          />
          {room?.is_paused && (
            <StatusBadge status="paused" label="Host paused" />
          )}
          <button
            onClick={() => navigate('/')}
            className="h-9 px-4 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 p-6 flex flex-col">
          <div 
            ref={videoContainerRef}
            className="flex-1 rounded-xl overflow-hidden border border-border bg-card relative group"
          >
            <VideoPreview 
              stream={remoteStream}
              muted={false}
              showOverlay={room?.is_paused}
              overlayText="Host has paused sharing"
            />
            
            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className="absolute bottom-4 right-4 w-10 h-10 rounded-lg bg-foreground/10 backdrop-blur-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-foreground/20 flex items-center justify-center"
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>

            {/* Connection status overlay */}
            {connectionState === 'connecting' && !remoteStream && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-8 h-8 animate-spin text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-muted-foreground">Connecting to stream...</p>
                </div>
              </div>
            )}

            {connectionState === 'failed' && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-foreground font-medium mb-1">Connection Failed</p>
                  <p className="text-muted-foreground text-sm">Unable to connect to the stream</p>
                </div>
              </div>
            )}

            {!room?.is_sharing && !room?.is_paused && connectionState === 'connected' && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-foreground font-medium mb-1">Waiting for Host</p>
                  <p className="text-muted-foreground text-sm">The host hasn't started sharing yet</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-border bg-card flex flex-col">
          {/* Sidebar Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setSidebarTab('viewers')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                sidebarTab === 'viewers' 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Viewers ({approvedViewers.length})
              {sidebarTab === 'viewers' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setSidebarTab('chat')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                sidebarTab === 'chat' 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Chat
              {sidebarTab === 'chat' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-hidden">
            {sidebarTab === 'viewers' && (
              <div className="h-full overflow-y-auto p-4 space-y-3">
                {/* Host */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Host</p>
                  <ViewerListCard
                    viewer={{
                      id: room?.host_id || '',
                      name: room?.host_name || 'Host',
                      online: true,
                    }}
                  />
                </div>

                {/* Viewers */}
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Viewers</p>
                {approvedViewers.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No other viewers
                  </p>
                ) : (
                  approvedViewers.map((request) => {
                    const viewer = viewers.find(v => v.id === request.viewer_id);
                    return (
                      <ViewerListCard
                        key={request.id}
                        viewer={{
                          id: request.viewer_id,
                          name: request.viewer_name + (request.viewer_id === viewerId ? ' (You)' : ''),
                          online: viewer?.online ?? false,
                        }}
                      />
                    );
                  })
                )}
              </div>
            )}

            {sidebarTab === 'chat' && (
              <ChatPanel
                messages={messages}
                currentUserId={viewerId}
                onSendMessage={handleSendMessage}
                className="h-full"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
