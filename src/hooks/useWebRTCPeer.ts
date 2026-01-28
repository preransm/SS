import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export type PeerConnectionState = 
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed';

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  payload: any;
  from: string;
  to?: string;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export interface UseWebRTCPeerReturn {
  connectionState: PeerConnectionState;
  remoteStream: MediaStream | null;
  createOffer: (viewerId: string) => Promise<void>;
  handleOffer: (offer: RTCSessionDescriptionInit, hostId: string) => Promise<void>;
  handleAnswer: (answer: RTCSessionDescriptionInit) => void;
  handleIceCandidate: (candidate: RTCIceCandidateInit) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  cleanup: () => void;
}

export function useWebRTCPeer(
  roomCode: string,
  peerId: string,
  isHost: boolean
): UseWebRTCPeerReturn {
  const [connectionState, setConnectionState] = useState<PeerConnectionState>('idle');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  const setLocalStream = useCallback((stream: MediaStream | null) => {
    localStreamRef.current = stream;
    
    // Add tracks to all existing peer connections
    peerConnectionsRef.current.forEach((pc) => {
      if (stream) {
        stream.getTracks().forEach(track => {
          const senders = pc.getSenders();
          const existingSender = senders.find(s => s.track?.kind === track.kind);
          if (existingSender) {
            existingSender.replaceTrack(track);
          } else {
            pc.addTrack(track, stream);
          }
        });
      }
    });
  }, []);

  const createPeerConnection = useCallback((remotePeerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signaling',
          payload: {
            type: 'ice-candidate',
            payload: event.candidate.toJSON(),
            from: peerId,
            to: remotePeerId,
          } as SignalingMessage,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case 'connecting':
          setConnectionState('connecting');
          break;
        case 'connected':
          setConnectionState('connected');
          break;
        case 'disconnected':
          setConnectionState('disconnected');
          break;
        case 'failed':
          setConnectionState('failed');
          break;
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    // Add local stream tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnectionsRef.current.set(remotePeerId, pc);
    return pc;
  }, [peerId]);

  const createOffer = useCallback(async (viewerId: string) => {
    const pc = createPeerConnection(viewerId);
    setConnectionState('connecting');

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signaling',
          payload: {
            type: 'offer',
            payload: offer,
            from: peerId,
            to: viewerId,
          } as SignalingMessage,
        });
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      setConnectionState('failed');
    }
  }, [createPeerConnection, peerId]);

  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, hostId: string) => {
    const pc = createPeerConnection(hostId);
    setConnectionState('connecting');

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Process any pending ICE candidates
      const pending = pendingCandidatesRef.current.get(hostId) || [];
      for (const candidate of pending) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current.delete(hostId);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signaling',
          payload: {
            type: 'answer',
            payload: answer,
            from: peerId,
            to: hostId,
          } as SignalingMessage,
        });
      }
    } catch (error) {
      console.error('Error handling offer:', error);
      setConnectionState('failed');
    }
  }, [createPeerConnection, peerId]);

  const handleAnswer = useCallback((answer: RTCSessionDescriptionInit) => {
    // Find the connection for this answer (usually from the first/only viewer as host)
    peerConnectionsRef.current.forEach(async (pc) => {
      if (pc.signalingState === 'have-local-offer') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
          console.error('Error setting remote description:', error);
        }
      }
    });
  }, []);

  const handleIceCandidate = useCallback((candidate: RTCIceCandidateInit) => {
    peerConnectionsRef.current.forEach(async (pc) => {
      if (pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });
  }, []);

  const cleanup = useCallback(() => {
    peerConnectionsRef.current.forEach((pc) => {
      pc.close();
    });
    peerConnectionsRef.current.clear();
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    setRemoteStream(null);
    setConnectionState('idle');
    pendingCandidatesRef.current.clear();
  }, []);

  // Set up signaling channel
  useEffect(() => {
    const channel = supabase.channel(`room:${roomCode}`);

    channel.on('broadcast', { event: 'signaling' }, ({ payload }) => {
      const message = payload as SignalingMessage;
      
      // Ignore messages from self or not meant for us
      if (message.from === peerId) return;
      if (message.to && message.to !== peerId) return;

      switch (message.type) {
        case 'offer':
          handleOffer(message.payload, message.from);
          break;
        case 'answer':
          handleAnswer(message.payload);
          break;
        case 'ice-candidate':
          // Store candidate if we don't have a connection yet
          const pc = peerConnectionsRef.current.get(message.from);
          if (pc?.remoteDescription) {
            handleIceCandidate(message.payload);
          } else {
            const pending = pendingCandidatesRef.current.get(message.from) || [];
            pending.push(message.payload);
            pendingCandidatesRef.current.set(message.from, pending);
          }
          break;
      }
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      cleanup();
    };
  }, [roomCode, peerId, handleOffer, handleAnswer, handleIceCandidate, cleanup]);

  return {
    connectionState,
    remoteStream,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    setLocalStream,
    cleanup,
  };
}
