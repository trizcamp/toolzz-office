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
  member_avatar?: string;
}

export function useTaskVotes(boardId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["task-votes", boardId],
    queryFn: async () => {
      const { data: tasks, error: tasksErr } = await supabase
        .from("tasks")
        .select("id")
        .eq("board_id", boardId!);
      if (tasksErr) throw tasksErr;
      if (!tasks || tasks.length === 0) return [];

      const taskIds = tasks.map((t) => t.id);
      const { data: votes, error: votesErr } = await supabase
        .from("task_votes")
        .select("*")
        .in("task_id", taskIds);
      if (votesErr) throw votesErr;
      if (!votes || votes.length === 0) return [];

      // Fetch member info for all voters
      const userIds = [...new Set(votes.map((v) => v.user_id))];
      const { data: members } = await supabase
        .from("members")
        .select("id, name, surname, avatar_url")
        .in("id", userIds);

      const memberMap = new Map(
        (members || []).map((m) => [m.id, m])
      );

      return votes.map((v) => {
        const member = memberMap.get(v.user_id);
        return {
          ...v,
          member_name: member
            ? `${member.name}${member.surname ? ` ${member.surname.charAt(0)}.` : ""}`
            : undefined,
          member_avatar: member?.avatar_url || undefined,
        };
      }) as TaskVote[];
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
