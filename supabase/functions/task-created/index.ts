import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Parse markdown text into document blocks
function parseMarkdownToBlocks(markdown: string, docId: string) {
  const lines = markdown.split("\n");
  const blocks: any[] = [];
  let position = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Heading 1: # or bold **text** at start that looks like a title
    if (/^# (.+)/.test(trimmed)) {
      blocks.push({ document_id: docId, type: "heading1", content: trimmed.replace(/^# /, ""), position: position++ });
      continue;
    }

    // Heading 2: ##
    if (/^## (.+)/.test(trimmed)) {
      blocks.push({ document_id: docId, type: "heading2", content: trimmed.replace(/^## /, ""), position: position++ });
      continue;
    }

    // Heading 3: ###
    if (/^### (.+)/.test(trimmed)) {
      blocks.push({ document_id: docId, type: "heading3", content: trimmed.replace(/^### /, ""), position: position++ });
      continue;
    }

    // Divider: --- or ***
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ document_id: docId, type: "divider", content: "", position: position++ });
      continue;
    }

    // Checkbox / todo: - [ ] or - [x]
    if (/^[-*]\s*\[( |x|X)\]\s*(.+)/.test(trimmed)) {
      const match = trimmed.match(/^[-*]\s*\[( |x|X)\]\s*(.+)/);
      if (match) {
        blocks.push({
          document_id: docId,
          type: "todoList",
          content: match[2].trim(),
          position: position++,
          checked: match[1] !== " ",
        });
      }
      continue;
    }

    // Numbered list: 1. text
    if (/^\d+\.\s+(.+)/.test(trimmed)) {
      const match = trimmed.match(/^\d+\.\s+(.+)/);
      if (match) {
        blocks.push({ document_id: docId, type: "numberedList", content: match[1].trim(), position: position++ });
      }
      continue;
    }

    // Bullet list: - text or * text
    if (/^[-*]\s+(.+)/.test(trimmed)) {
      const match = trimmed.match(/^[-*]\s+(.+)/);
      if (match) {
        blocks.push({ document_id: docId, type: "bulletList", content: match[1].trim(), position: position++ });
      }
      continue;
    }

    // Code block: ```
    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ document_id: docId, type: "code", content: codeLines.join("\n"), position: position++ });
      continue;
    }

    // Blockquote: > text
    if (/^>\s*(.+)/.test(trimmed)) {
      const match = trimmed.match(/^>\s*(.+)/);
      if (match) {
        blocks.push({ document_id: docId, type: "quote", content: match[1].trim(), position: position++ });
      }
      continue;
    }

    // Bold-only lines as heading2 (common in AI responses like **Critérios de Aceite**)
    if (/^\*\*(.+)\*\*$/.test(trimmed)) {
      const match = trimmed.match(/^\*\*(.+)\*\*$/);
      if (match) {
        blocks.push({ document_id: docId, type: "heading2", content: match[1].trim(), position: position++ });
        continue;
      }
    }

    // Regular paragraph
    blocks.push({ document_id: docId, type: "paragraph", content: trimmed, position: position++ });
  }

  return blocks;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { taskId, boardId, markdownContent } = await req.json();
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

    // Build blocks: parse markdown if available, otherwise use default template
    let blocks: any[];

    if (markdownContent && markdownContent.trim().length > 0) {
      blocks = parseMarkdownToBlocks(markdownContent, doc.id);
      // If parsing produced no blocks, fall back to template
      if (blocks.length === 0) {
        blocks = getDefaultBlocks(doc.id, task);
      }
    } else {
      blocks = getDefaultBlocks(doc.id, task);
    }

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

function getDefaultBlocks(docId: string, task: any) {
  return [
    { document_id: docId, type: "heading1", content: task.title, position: 0 },
    { document_id: docId, type: "paragraph", content: task.description || "Descreva o objetivo desta tarefa...", position: 1 },
    { document_id: docId, type: "heading2", content: "Critérios de Aceite", position: 2 },
    { document_id: docId, type: "todoList", content: "Critério 1", position: 3, checked: false },
    { document_id: docId, type: "todoList", content: "Critério 2", position: 4, checked: false },
    { document_id: docId, type: "todoList", content: "Critério 3", position: 5, checked: false },
    { document_id: docId, type: "divider", content: "", position: 6 },
    { document_id: docId, type: "heading2", content: "Notas Técnicas", position: 7 },
    { document_id: docId, type: "paragraph", content: "", position: 8 },
  ];
}
