import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DbMember {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  avatar_url: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export function useMembers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as DbMember[];
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<DbMember>) => {
      const { error } = await supabase.from("members").update(updates).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }),
  });

  const currentMember = query.data?.find((m) => m.id === user?.id);

  return { members: query.data || [], isLoading: query.isLoading, currentMember, updateProfile };
}

export function useUserRoles() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isAdmin = query.data?.some((r) => r.role === "admin") || false;
  return { roles: query.data || [], isAdmin };
}
