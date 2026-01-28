import { useSearchParams, useNavigate, useParams } from 'react-router-dom';

export default function EndSessionPage() {
  const [searchParams] = useSearchParams();
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const role = searchParams.get('role') || 'viewer';
  const isHost = role === 'host';

  const handleNewSession = () => {
    // Clear session storage for this room
    sessionStorage.removeItem(`host_${roomCode}`);
    sessionStorage.removeItem(`viewer_${roomCode}`);
    sessionStorage.removeItem(`name_${roomCode}`);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Session Ended</h1>
        <p className="text-muted-foreground mb-8">
          {isHost 
            ? 'Your screen sharing session has ended. All viewers have been disconnected.'
            : 'The host has ended the screen sharing session.'}
        </p>

        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Room Code</p>
          <p className="text-xl font-mono font-bold tracking-widest mb-4">{roomCode}</p>
          <p className="text-sm text-muted-foreground">
            {isHost 
              ? 'Thank you for using ScreenShare!'
              : 'Thank you for joining!'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {isHost && (
            <button
              onClick={handleNewSession}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Start New Session
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="w-full h-11 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
