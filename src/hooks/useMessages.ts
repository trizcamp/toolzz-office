import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export interface DbMessage {
  id: string;
  room_id: string;
  user_id: string;
  text: string;
  created_at: string;
  members?: { name: string; surname: string; avatar_url: string } | null;
}

export function useMessages(roomId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId!)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return data as DbMessage[];
    },
    enabled: !!roomId && !!user,
  });

  // Realtime subscription for messages
  useEffect(() => {
    if (!roomId || !user) return;
    const channel = supabase
      .channel(`messages-${roomId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `room_id=eq.${roomId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages", roomId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, user, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async ({ roomId, text }: { roomId: string; text: string }) => {
      const { error } = await supabase.from("messages").insert({
        room_id: roomId,
        user_id: user!.id,
        text,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", roomId] }),
  });

  return { messages: query.data || [], isLoading: query.isLoading, sendMessage };
}
