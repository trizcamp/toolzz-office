
-- Direct message conversations (between 2 users)
CREATE TABLE public.dm_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Direct messages
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS for conversations
CREATE POLICY "Users can view own conversations"
ON public.dm_conversations FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations"
ON public.dm_conversations FOR INSERT
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update own conversations"
ON public.dm_conversations FOR UPDATE
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS for messages
CREATE POLICY "Users can view messages in own conversations"
ON public.direct_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.dm_conversations
  WHERE id = direct_messages.conversation_id
  AND (user1_id = auth.uid() OR user2_id = auth.uid())
));

CREATE POLICY "Users can send messages in own conversations"
ON public.direct_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.dm_conversations
    WHERE id = direct_messages.conversation_id
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

-- Enable realtime for direct messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Trigger to update conversation timestamp
CREATE TRIGGER update_dm_conversation_timestamp
BEFORE UPDATE ON public.dm_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
