import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useBoards() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["boards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boards")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createBoard = useMutation({
    mutationFn: async (board: { name: string; description?: string; sector: string; icon: string }) => {
      const { data, error } = await supabase
        .from("boards")
        .insert({ ...board, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["boards"] }),
  });

  const updateBoard = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string }) => {
      const { error } = await supabase.from("boards").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["boards"] }),
  });

  const deleteBoard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("boards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["boards"] }),
  });

  return { boards: query.data || [], isLoading: query.isLoading, createBoard, updateBoard, deleteBoard };
}
