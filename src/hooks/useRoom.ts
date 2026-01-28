import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Room {
  id: string;
  room_code: string;
  host_id: string;
  host_name: string;
  is_active: boolean;
  is_sharing: boolean;
  is_paused: boolean;
  created_at: string;
  ended_at: string | null;
}

export interface JoinRequest {
  id: string;
  room_id: string;
  viewer_id: string;
  viewer_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export interface Viewer {
  id: string;
  name: string;
  online: boolean;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateUserId(): string {
  return crypto.randomUUID();
}

export function useRoom(roomCode?: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create a new room (for host)
  const createRoom = useCallback(async (hostName: string = 'Host') => {
    const hostId = generateUserId();
    const newRoomCode = generateRoomCode();

    const { data, error: createError } = await supabase
      .from('rooms')
      .insert({
        room_code: newRoomCode,
        host_id: hostId,
        host_name: hostName,
      })
      .select()
      .single();

    if (createError) {
      setError(createError.message);
      return null;
    }

    return { room: data as Room, hostId };
  }, []);

  // Fetch room by code
  const fetchRoom = useCallback(async (code: string) => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', code)
      .eq('is_active', true)
      .single();

    if (fetchError) {
      setError('Room not found or has ended');
      setLoading(false);
      return null;
    }

    const roomData = data as Room;
    setRoom(roomData);
    
    // Fetch initial join requests for this room
    const { data: requestsData } = await supabase
      .from('join_requests')
      .select('*')
      .eq('room_id', roomData.id);
    
    if (requestsData) {
      setJoinRequests(requestsData as JoinRequest[]);
    }
    
    setLoading(false);
    return roomData;
  }, []);

  // Update room sharing state
  const updateSharingState = useCallback(async (isSharing: boolean, isPaused: boolean = false) => {
    if (!room) return;

    await supabase
      .from('rooms')
      .update({ is_sharing: isSharing, is_paused: isPaused })
      .eq('id', room.id);
  }, [room]);

  // End room
  const endRoom = useCallback(async () => {
    if (!room) return;

    await supabase
      .from('rooms')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('id', room.id);
  }, [room]);

  // Request to join room
  const requestJoin = useCallback(async (viewerName: string) => {
    if (!room) return null;

    const viewerId = generateUserId();

    const { data, error: joinError } = await supabase
      .from('join_requests')
      .insert({
        room_id: room.id,
        viewer_id: viewerId,
        viewer_name: viewerName,
      })
      .select()
      .single();

    if (joinError) {
      setError(joinError.message);
      return null;
    }

    return { request: data as JoinRequest, viewerId };
  }, [room]);

  // Approve or reject join request
  const handleJoinRequest = useCallback(async (requestId: string, approved: boolean) => {
    await supabase
      .from('join_requests')
      .update({ status: approved ? 'approved' : 'rejected' })
      .eq('id', requestId);
  }, []);

  // Send chat message
  const sendMessage = useCallback(async (senderId: string, senderName: string, message: string) => {
    if (!room) return;

    await supabase
      .from('chat_messages')
      .insert({
        room_id: room.id,
        sender_id: senderId,
        sender_name: senderName,
        message,
      });
  }, [room]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!room) return;

    // Subscribe to room changes
    const roomChannel = supabase
      .channel(`room-changes:${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setRoom(payload.new as Room);
          }
        }
      )
      .subscribe();

    // Subscribe to join requests
    const requestsChannel = supabase
      .channel(`requests:${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'join_requests', filter: `room_id=eq.${room.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setJoinRequests(prev => [...prev, payload.new as JoinRequest]);
          } else if (payload.eventType === 'UPDATE') {
            setJoinRequests(prev => 
              prev.map(r => r.id === payload.new.id ? payload.new as JoinRequest : r)
            );
          }
        }
      )
      .subscribe();

    // Subscribe to messages
    const messagesChannel = supabase
      .channel(`messages:${room.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${room.id}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    // Initial fetch of join requests and messages
    const fetchInitialData = async () => {
      const [requestsRes, messagesRes] = await Promise.all([
        supabase.from('join_requests').select('*').eq('room_id', room.id),
        supabase.from('chat_messages').select('*').eq('room_id', room.id).order('created_at', { ascending: true }),
      ]);

      if (requestsRes.data) {
        setJoinRequests(requestsRes.data as JoinRequest[]);
      }
      if (messagesRes.data) {
        setMessages(messagesRes.data as ChatMessage[]);
      }
    };

    fetchInitialData();

    return () => {
      supabase.removeChannel(roomChannel);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [room?.id]);

  // Set up presence for viewers
  useEffect(() => {
    if (!room) return;

    const presenceChannel = supabase.channel(`presence:${room.id}`);

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineViewers: Viewer[] = [];
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.id && presence.name) {
              onlineViewers.push({
                id: presence.id,
                name: presence.name,
                online: true,
              });
            }
          });
        });

        setViewers(onlineViewers);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [room?.id]);

  // Track presence
  const trackPresence = useCallback(async (userId: string, userName: string) => {
    if (!room) return;

    const channel = supabase.channel(`presence:${room.id}`);
    
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          id: userId,
          name: userName,
          online_at: new Date().toISOString(),
        });
      }
    });

    return channel;
  }, [room]);

  return {
    room,
    joinRequests,
    messages,
    viewers,
    loading,
    error,
    createRoom,
    fetchRoom,
    updateSharingState,
    endRoom,
    requestJoin,
    handleJoinRequest,
    sendMessage,
    trackPresence,
  };
}
