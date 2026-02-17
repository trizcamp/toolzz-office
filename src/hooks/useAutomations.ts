import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface AutomationStep {
  id: string;
  automation_id: string;
  position: number;
  action_type: string;
  action_config: Record<string, any>;
  created_at: string;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  trigger_type: string;
  trigger_config: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
  steps?: AutomationStep[];
}

export function useAutomations() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["automations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .order("updated_at", { ascending: false }) as any;
      if (error) throw error;
      return (data || []) as Automation[];
    },
    enabled: !!user,
  });

  const createAutomation = useMutation({
    mutationFn: async (auto: Partial<Automation>) => {
      const { data, error } = await supabase
        .from("automations")
        .insert({ ...auto, created_by: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Automation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
  });

  const updateAutomation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Automation> & { id: string }) => {
      const { error } = await supabase
        .from("automations")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
  });

  const deleteAutomation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
  });

  return { automations: query.data || [], isLoading: query.isLoading, createAutomation, updateAutomation, deleteAutomation };
}

export function useAutomationSteps(automationId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["automation_steps", automationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_steps")
        .select("*")
        .eq("automation_id", automationId!)
        .order("position", { ascending: true }) as any;
      if (error) throw error;
      return (data || []) as AutomationStep[];
    },
    enabled: !!user && !!automationId,
  });

  const addStep = useMutation({
    mutationFn: async (step: Partial<AutomationStep>) => {
      const { data, error } = await supabase
        .from("automation_steps")
        .insert(step as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as AutomationStep;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation_steps", automationId] }),
  });

  const updateStep = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AutomationStep> & { id: string }) => {
      const { error } = await supabase
        .from("automation_steps")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation_steps", automationId] }),
  });

  const deleteStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automation_steps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation_steps", automationId] }),
  });

  return { steps: query.data || [], isLoading: query.isLoading, addStep, updateStep, deleteStep };
}
