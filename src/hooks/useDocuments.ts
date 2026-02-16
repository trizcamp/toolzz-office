import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DbDocument {
  id: string;
  title: string;
  icon: string;
  type: "doc" | "spec" | "note";
  task_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbBlock {
  id: string;
  document_id: string;
  type: string;
  content: string;
  position: number;
  checked: boolean;
  metadata: any;
}

export interface DbComment {
  id: string;
  document_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export function useDocuments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*, tasks!documents_task_id_fkey(display_id, title)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Realtime: auto-refresh when documents are inserted/updated/deleted
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("documents-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, () => {
        queryClient.invalidateQueries({ queryKey: ["documents"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const createDocument = useMutation({
    mutationFn: async (doc: { title: string; icon?: string; type?: "doc" | "spec" | "note"; task_id?: string }) => {
      const { data, error } = await supabase
        .from("documents")
        .insert({ ...doc, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;

      // Create initial block
      await supabase.from("document_blocks").insert({
        document_id: data.id,
        type: "heading1",
        content: "",
        position: 0,
      });

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  const updateDocument = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; icon?: string }) => {
      const { error } = await supabase.from("documents").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  return { documents: query.data || [], isLoading: query.isLoading, createDocument, updateDocument, deleteDocument };
}

export function useDocumentBlocks(documentId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["document-blocks", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_blocks")
        .select("*")
        .eq("document_id", documentId!)
        .order("position");
      if (error) throw error;
      return data as DbBlock[];
    },
    enabled: !!documentId,
  });

  const saveBlocks = useMutation({
    mutationFn: async ({ documentId, blocks }: { documentId: string; blocks: DbBlock[] }) => {
      // Delete existing blocks and re-insert
      await supabase.from("document_blocks").delete().eq("document_id", documentId);
      if (blocks.length > 0) {
        const { error } = await supabase.from("document_blocks").insert(
          blocks.map((b, i) => ({
            id: b.id,
            document_id: documentId,
            type: b.type as any,
            content: b.content,
            position: i,
            checked: b.checked || false,
            metadata: b.metadata || {},
          }))
        );
        if (error) throw error;
      }
    },
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ["document-blocks", documentId] });
    },
  });

  return { blocks: query.data || [], isLoading: query.isLoading, saveBlocks };
}

export function useDocumentComments(documentId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["document-comments", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_comments")
        .select("*, members(name, surname)")
        .eq("document_id", documentId!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!documentId,
  });

  const addComment = useMutation({
    mutationFn: async ({ documentId, text }: { documentId: string; text: string }) => {
      const { error } = await supabase.from("document_comments").insert({
        document_id: documentId,
        user_id: user!.id,
        text,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["document-comments"] }),
  });

  return { comments: query.data || [], addComment };
}
