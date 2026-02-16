import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript, meetingId, boardId, userId } = await req.json();
    if (!transcript) throw new Error("transcript is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const systemPrompt = `Você é um assistente que analisa transcrições de reuniões. Dado o texto da transcrição, você deve:
1. Gerar um resumo conciso da reunião
2. Identificar tarefas que foram mencionadas ou decididas

Use a ferramenta extract_meeting_data para retornar os dados estruturados.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "extract_meeting_data",
          description: "Extrai resumo e tarefas da transcrição da reunião",
          parameters: {
            type: "object",
            properties: {
              summary: { type: "string", description: "Resumo conciso da reunião" },
              tasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                  },
                  required: ["title", "priority"],
                  additionalProperties: false,
                },
              },
            },
            required: ["summary", "tasks"],
            additionalProperties: false,
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Transcrição da reunião:\n\n${transcript}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "extract_meeting_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(JSON.stringify({ summary: "Não foi possível analisar a transcrição.", tasks: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);
    const createdTasks: any[] = [];

    // Update meeting summary
    if (meetingId) {
      await supabase.from("meetings").update({ summary: extracted.summary }).eq("id", meetingId);
    }

    // Create tasks from the meeting
    if (boardId && extracted.tasks?.length > 0) {
      for (const taskData of extracted.tasks) {
        const { data: task, error } = await supabase
          .from("tasks")
          .insert({
            title: taskData.title,
            description: taskData.description || "",
            priority: taskData.priority || "medium",
            status: "backlog",
            type: "task",
            board_id: boardId,
            created_by: userId,
          })
          .select()
          .single();

        if (!error && task) {
          // Generate document for each task
          const taskCreatedUrl = `${supabaseUrl}/functions/v1/task-created`;
          await fetch(taskCreatedUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ taskId: task.id }),
          });

          if (meetingId) {
            await supabase.from("meeting_tasks").insert({ meeting_id: meetingId, task_id: task.id });
          }

          createdTasks.push(task);
        }
      }
    }

    return new Response(JSON.stringify({
      summary: extracted.summary,
      tasks: createdTasks,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-analyze-meeting error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
