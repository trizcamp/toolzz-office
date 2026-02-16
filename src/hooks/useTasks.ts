import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "critical" | "high" | "medium" | "low";

export interface DbTask {
  id: string;
  display_id: string;
  board_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: string;
  points: number | null;
  delivery_date: string | null;
  parent_id: string | null;
  document_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useTasks(boardId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tasks", boardId],
    queryFn: async () => {
      const q = supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (boardId) q.eq("board_id", boardId);
      
      const { data, error } = await q;
      if (error) throw error;
      return data as DbTask[];
    },
    enabled: !!user,
  });

  // Realtime subscription for tasks
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const createTask = useMutation({
    mutationFn: async (task: {
      title: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      type?: string;
      board_id: string;
      delivery_date?: string;
      parent_id?: string;
    }) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...task, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;

      // Fire task-created event to auto-generate document
      try {
        await supabase.functions.invoke("task-created", {
          body: { taskId: data.id, boardId: task.board_id },
        });
      } catch (e) {
        console.error("Failed to trigger task-created event:", e);
      }

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbTask> & { id: string }) => {
      const { error } = await supabase.from("tasks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  return { tasks: query.data || [], isLoading: query.isLoading, createTask, updateTask, deleteTask };
}

export function useTaskAssignees(taskId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["task-assignees", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_assignees")
        .select("*, members(id, name, surname, email, avatar_url)")
        .eq("task_id", taskId!);
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });

  const addAssignee = useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      const { error } = await supabase.from("task_assignees").insert({ task_id: taskId, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task-assignees"] }),
  });

  const removeAssignee = useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      const { error } = await supabase.from("task_assignees").delete().eq("task_id", taskId).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task-assignees"] }),
  });

  return { assignees: query.data || [], addAssignee, removeAssignee };
}
