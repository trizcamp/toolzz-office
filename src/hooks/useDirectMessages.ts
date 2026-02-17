import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export function useConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["dm-conversations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dm_conversations")
        .select("*")
        .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createConversation = useMutation({
    mutationFn: async (otherUserId: string) => {
      const uid = user!.id;
      // Ensure consistent ordering
      const [u1, u2] = uid < otherUserId ? [uid, otherUserId] : [otherUserId, uid];
      
      // Check if exists
      const { data: existing } = await supabase
        .from("dm_conversations")
        .select("*")
        .eq("user1_id", u1)
        .eq("user2_id", u2)
        .maybeSingle();
      
      if (existing) return existing;

      const { data, error } = await supabase
        .from("dm_conversations")
        .insert({ user1_id: u1, user2_id: u2 })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dm-conversations"] }),
  });

  return { conversations: query.data || [], isLoading: query.isLoading, createConversation };
}

export function useDirectMessages(conversationId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["direct-messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!conversationId && !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!conversationId || !user) return;
    const channel = supabase
      .channel(`dm-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["direct-messages", conversationId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase.from("direct_messages").insert({
        conversation_id: conversationId!,
        sender_id: user!.id,
        text,
      });
      if (error) throw error;
      // Update conversation timestamp
      await supabase.from("dm_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["direct-messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["dm-conversations"] });
    },
  });

  return { messages: query.data || [], isLoading: query.isLoading, sendMessage };
}
