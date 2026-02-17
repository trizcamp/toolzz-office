import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DbMeeting {
  id: string;
  title: string;
  room_id: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  summary: string | null;
  created_by: string | null;
  created_at: string;
  meeting_code: string | null;
  status: string;
  description: string | null;
}

export function useMeetings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data as unknown as DbMeeting[];
    },
    enabled: !!user,
  });

  const createMeeting = useMutation({
    mutationFn: async (meeting: { title: string; room_id?: string; date: string; start_time?: string; end_time?: string; description?: string }) => {
      const { data, error } = await supabase
        .from("meetings")
        .insert({ ...meeting, created_by: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as DbMeeting;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meetings"] }),
  });

  return { meetings: query.data || [], isLoading: query.isLoading, createMeeting };
}
