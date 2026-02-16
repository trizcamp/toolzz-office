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
  const queryClient = useQueryClient();

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

  const allRolesQuery = useQuery({
    queryKey: ["all-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "member" }) => {
      // Delete existing roles then insert new one
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    },
  });

  const deleteMember = useMutation({
    mutationFn: async (userId: string) => {
      // Delete role first, then member
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("members").delete().eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["all-user-roles"] });
    },
  });

  const inviteMember = useMutation({
    mutationFn: async ({ email, name, role }: { email: string; name: string; role: "admin" | "member" }) => {
      const { data, error } = await supabase.functions.invoke("invite-member", {
        body: { email, name, role },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["all-user-roles"] });
    },
  });

  const isAdmin = query.data?.some((r) => r.role === "admin") || false;
  const allRoles = allRolesQuery.data || [];

  const getRoleForUser = (userId: string): "admin" | "member" => {
    const userRole = allRoles.find((r) => r.user_id === userId);
    return (userRole?.role as "admin" | "member") || "member";
  };

  return { roles: query.data || [], isAdmin, allRoles, getRoleForUser, updateRole, deleteMember, inviteMember };
}
