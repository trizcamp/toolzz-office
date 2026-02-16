import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { taskId, boardId } = await req.json();
    if (!taskId) throw new Error("taskId is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch the task
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .maybeSingle();

    if (taskError || !task) {
      return new Response(JSON.stringify({ error: "Task not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create document linked to task
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        title: `Backlog: ${task.title}`,
        icon: "📋",
        type: "spec",
        task_id: taskId,
        created_by: task.created_by,
      })
      .select()
      .single();

    if (docError) throw docError;

    // Create template blocks
    const blocks = [
      { document_id: doc.id, type: "heading1", content: task.title, position: 0 },
      { document_id: doc.id, type: "paragraph", content: task.description || "Descreva o objetivo desta tarefa...", position: 1 },
      { document_id: doc.id, type: "heading2", content: "Critérios de Aceite", position: 2 },
      { document_id: doc.id, type: "todoList", content: "Critério 1", position: 3, checked: false },
      { document_id: doc.id, type: "todoList", content: "Critério 2", position: 4, checked: false },
      { document_id: doc.id, type: "todoList", content: "Critério 3", position: 5, checked: false },
      { document_id: doc.id, type: "divider", content: "", position: 6 },
      { document_id: doc.id, type: "heading2", content: "Notas Técnicas", position: 7 },
      { document_id: doc.id, type: "paragraph", content: "", position: 8 },
    ];

    const { error: blocksError } = await supabase
      .from("document_blocks")
      .insert(blocks);

    if (blocksError) throw blocksError;

    // Link document back to task
    await supabase
      .from("tasks")
      .update({ document_id: doc.id })
      .eq("id", taskId);

    return new Response(JSON.stringify({ documentId: doc.id, taskId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("task-created error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
