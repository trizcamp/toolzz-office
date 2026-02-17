import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  member_name?: string;
  member_avatar?: string;
}

export function useActivityLogs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;

      // Fetch member names for user_ids
      const userIds = [...new Set((logs || []).map((l: any) => l.user_id).filter(Boolean))];
      let membersMap: Record<string, { name: string; avatar_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: members } = await supabase
          .from("members")
          .select("id, name, avatar_url")
          .in("id", userIds);
        if (members) {
          for (const m of members) {
            membersMap[m.id] = { name: m.name, avatar_url: m.avatar_url };
          }
        }
      }

      return (logs || []).map((log: any) => ({
        ...log,
        metadata: log.metadata || {},
        member_name: log.user_id ? membersMap[log.user_id]?.name || "Membro" : "Sistema",
        member_avatar: log.user_id ? membersMap[log.user_id]?.avatar_url || null : null,
      })) as ActivityLog[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("activity-logs-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "activity_logs",
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return { logs: query.data || [], isLoading: query.isLoading };
}
