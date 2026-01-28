-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  host_id TEXT NOT NULL,
  host_name TEXT NOT NULL DEFAULT 'Host',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_sharing BOOLEAN NOT NULL DEFAULT false,
  is_paused BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create join_requests table
CREATE TABLE public.join_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  viewer_id TEXT NOT NULL,
  viewer_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for rooms - public access since we're not using auth
CREATE POLICY "Anyone can view active rooms" ON public.rooms
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create rooms" ON public.rooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Host can update their room" ON public.rooms
  FOR UPDATE USING (true);

-- RLS policies for join_requests
CREATE POLICY "Anyone can view join requests" ON public.join_requests
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create join requests" ON public.join_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update join requests" ON public.join_requests
  FOR UPDATE USING (true);

-- RLS policies for chat_messages
CREATE POLICY "Anyone can view messages in room" ON public.chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Anyone can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.join_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for join_requests timestamp
CREATE TRIGGER update_join_requests_updated_at
  BEFORE UPDATE ON public.join_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();