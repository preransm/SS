import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '@/hooks/useRoom';

export default function JoinRoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { room, fetchRoom, loading, error } = useRoom();
  const [viewerName, setViewerName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (roomCode) {
      fetchRoom(roomCode);
    }
  }, [roomCode, fetchRoom]);

  const handleJoin = () => {
    if (!viewerName.trim()) {
      setFormError('Please enter your name');
      return;
    }

    if (!room) {
      setFormError('Room not found');
      return;
    }

    // Store viewer name for the waiting room
    sessionStorage.setItem(`name_${roomCode}`, viewerName.trim());
    navigate(`/room/${roomCode}/waiting`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <svg className="w-8 h-8 animate-spin text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-muted-foreground">Loading room...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
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
            The room "{roomCode}" doesn't exist or has ended.
          </p>
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Join Room</h1>
          <p className="text-muted-foreground">
            Hosted by <span className="font-medium text-foreground">{room.host_name}</span>
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="mb-6 p-4 rounded-lg bg-muted text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Room Code</p>
            <p className="text-2xl font-mono font-bold tracking-widest">{roomCode}</p>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {formError}
            </div>
          )}

          <label className="block text-sm font-medium mb-2">Your Name</label>
          <input
            type="text"
            value={viewerName}
            onChange={(e) => setViewerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-4"
          />

          <button
            onClick={handleJoin}
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Request to Join
          </button>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 h-11 rounded-lg text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
