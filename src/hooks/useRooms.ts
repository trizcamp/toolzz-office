import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export type RoomType = "voice" | "text" | "hybrid";

export interface DbRoom {
  id: string;
  name: string;
  category: string;
  type: RoomType;
  created_by: string | null;
  created_at: string;
}

export function useRooms() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("category", { ascending: true });
      if (error) throw error;
      return data as DbRoom[];
    },
    enabled: !!user,
  });

  // Realtime for room changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("rooms-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, () => {
        queryClient.invalidateQueries({ queryKey: ["rooms"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const createRoom = useMutation({
    mutationFn: async (room: { name: string; category: string; type: RoomType }) => {
      const { data, error } = await supabase
        .from("rooms")
        .insert({ ...room, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });

  const updateRoom = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; category?: string; type?: RoomType }) => {
      const { error } = await supabase.from("rooms").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });

  const deleteRoom = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });

  return { rooms: query.data || [], isLoading: query.isLoading, createRoom, updateRoom, deleteRoom };
}
