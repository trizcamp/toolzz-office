import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useBoardMembers(boardId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["board-members", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("board_members")
        .select("*, members(id, name, surname, email, avatar_url)")
        .eq("board_id", boardId!);
      if (error) throw error;
      return data;
    },
    enabled: !!boardId,
  });

  const addMember = useMutation({
    mutationFn: async ({ boardId, userId }: { boardId: string; userId: string }) => {
      const { error } = await supabase.from("board_members").insert({ board_id: boardId, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board-members"] }),
  });

  const removeMember = useMutation({
    mutationFn: async ({ boardId, userId }: { boardId: string; userId: string }) => {
      const { error } = await supabase.from("board_members").delete().eq("board_id", boardId).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board-members"] }),
  });

  return { boardMembers: query.data || [], isLoading: query.isLoading, addMember, removeMember };
}
