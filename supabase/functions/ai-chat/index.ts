import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, boardId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Extract user from auth header
    let userId: string | null = null;
    if (authHeader) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await userClient.auth.getUser();
      userId = data.user?.id || null;
    }

    const systemPrompt = `Você é um assistente de gerenciamento de projetos da Toolzz Office. Você ajuda a criar tarefas, organizar o backlog e responder dúvidas sobre o projeto.

Quando o usuário pedir para criar uma tarefa, use a ferramenta create_task. Extraia título, descrição, prioridade e status da conversa.

Responda sempre em português brasileiro. Seja conciso e profissional.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "create_task",
          description: "Cria uma nova tarefa no board. Use quando o usuário pedir para criar, adicionar ou registrar uma tarefa.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Título da tarefa" },
              description: { type: "string", description: "Descrição detalhada da tarefa" },
              priority: { type: "string", enum: ["critical", "high", "medium", "low"], description: "Prioridade" },
              status: { type: "string", enum: ["backlog", "todo", "in_progress"], description: "Status inicial" },
              type: { type: "string", enum: ["feature", "bug", "improvement", "task"], description: "Tipo da tarefa" },
            },
            required: ["title"],
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
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const choice = aiResult.choices?.[0];
    const createdTasks: any[] = [];

    // Handle tool calls
    if (choice?.message?.tool_calls) {
      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.function.name === "create_task") {
          const args = JSON.parse(toolCall.function.arguments);
          
          const targetBoardId = boardId;
          if (!targetBoardId) continue;

          const { data: task, error: taskError } = await supabase
            .from("tasks")
            .insert({
              title: args.title,
              description: args.description || "",
              priority: args.priority || "medium",
              status: args.status || "backlog",
              type: args.type || "task",
              board_id: targetBoardId,
              created_by: userId,
            })
            .select()
            .single();

          if (!taskError && task) {
            // Trigger task-created event to generate document
            const taskCreatedUrl = `${supabaseUrl}/functions/v1/task-created`;
            await fetch(taskCreatedUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${serviceKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ taskId: task.id, boardId: targetBoardId }),
            });
            createdTasks.push(task);
          }
        }
      }

      // Get follow-up response with tool results
      const followUpMessages = [
        ...messages,
        choice.message,
        ...choice.message.tool_calls.map((tc: any, i: number) => ({
          role: "tool",
          tool_call_id: tc.id,
          content: createdTasks[i]
            ? JSON.stringify({ success: true, task_id: createdTasks[i].display_id, title: createdTasks[i].title })
            : JSON.stringify({ success: false, error: "Failed to create task" }),
        })),
      ];

      const followUp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: systemPrompt }, ...followUpMessages],
        }),
      });

      const followUpResult = await followUp.json();
      return new Response(JSON.stringify({
        message: followUpResult.choices?.[0]?.message?.content || "Tarefa criada com sucesso!",
        createdTasks,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      message: choice?.message?.content || "Desculpe, não consegui processar sua mensagem.",
      createdTasks: [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
