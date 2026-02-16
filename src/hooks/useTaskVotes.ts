import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export interface TaskVote {
  id: string;
  task_id: string;
  user_id: string;
  points: number;
  created_at: string;
  member_name?: string;
}

export function useTaskVotes(boardId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["task-votes", boardId],
    queryFn: async () => {
      // Get all task ids for this board first
      const { data: tasks, error: tasksErr } = await supabase
        .from("tasks")
        .select("id")
        .eq("board_id", boardId!);
      if (tasksErr) throw tasksErr;
      if (!tasks || tasks.length === 0) return [];

      const taskIds = tasks.map((t) => t.id);
      const { data, error } = await supabase
        .from("task_votes")
        .select("*, members!task_votes_user_id_fkey(name, surname)")
        .in("task_id", taskIds);

      if (error) {
        // Fallback without join if FK doesn't exist
        const { data: fallback, error: fbErr } = await supabase
          .from("task_votes")
          .select("*")
          .in("task_id", taskIds);
        if (fbErr) throw fbErr;
        return (fallback || []) as TaskVote[];
      }

      return (data || []).map((v: any) => ({
        ...v,
        member_name: v.members
          ? `${v.members.name}${v.members.surname ? ` ${v.members.surname.charAt(0)}.` : ""}`
          : undefined,
      })) as TaskVote[];
    },
    enabled: !!user && !!boardId,
  });

  // Realtime
  useEffect(() => {
    if (!user || !boardId) return;
    const channel = supabase
      .channel("task-votes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "task_votes" }, () => {
        queryClient.invalidateQueries({ queryKey: ["task-votes", boardId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, boardId, queryClient]);

  const castVote = useMutation({
    mutationFn: async ({ taskId, points }: { taskId: string; points: number }) => {
      const { error } = await supabase
        .from("task_votes")
        .upsert(
          { task_id: taskId, user_id: user!.id, points },
          { onConflict: "task_id,user_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task-votes", boardId] }),
  });

  return { votes: query.data || [], isLoading: query.isLoading, castVote };
}
