import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, boardId, markdownContent, githubRepo } = await req.json();
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

    const systemPrompt = `Você é o assistente de tarefas da Toolzz Office. Seu ÚNICO objetivo é coletar informações para criar tarefas no board.

REGRAS ESTRITAS:
1. NÃO responda perguntas gerais, NÃO converse sobre outros assuntos, NÃO dê explicações longas.
2. Se o usuário falar algo que não é sobre criar tarefa, redirecione educadamente: "Posso te ajudar a criar uma tarefa sobre isso. Qual seria o título?"
3. Para cada tarefa, colete estas informações fazendo perguntas curtas e diretas:
   - Título da tarefa (obrigatório)
   - Descrição breve (opcional - pergunte)
   - Tipo: feature, bug, improvement ou task (pergunte)
   - Prioridade: critical, high, medium ou low (pergunte)
4. Assim que tiver pelo menos o título, crie a tarefa imediatamente usando create_task.
5. Após criar, pergunte: "Tarefa criada! Quer criar outra?"

No campo "documentation" da ferramenta create_task, gere:
- User Story: "Como [persona], quero [ação], para [benefício]"
- Critérios de Aceite: lista de critérios específicos
- Notas Técnicas: observações extraídas da conversa

Responda SEMPRE em português brasileiro. Seja ULTRA conciso (máximo 2 frases). Sem markdown, sem formatação — texto corrido apenas.`;

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
              documentation: { type: "string", description: "Documentação completa em markdown com User Story, Critérios de Aceite e Notas Técnicas" },
            },
            required: ["title", "documentation"],
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
        model: "google/gemini-2.5-flash",
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
      // Resolve board ID - use provided, fetch first available, or create one
      let targetBoardId = boardId;
      if (!targetBoardId && userId) {
        const { data: firstBoard } = await supabase
          .from("boards")
          .select("id")
          .limit(1)
          .maybeSingle();
        if (firstBoard) {
          targetBoardId = firstBoard.id;
        } else {
          // Auto-create a default board
          const { data: newBoard } = await supabase
            .from("boards")
            .insert({ name: "Meu Board", icon: "📋", created_by: userId })
            .select("id")
            .single();
          targetBoardId = newBoard?.id || null;
        }
      }
      if (!targetBoardId) {
        return new Response(JSON.stringify({
          message: "Não foi possível criar o board. Tente novamente.",
          createdTasks: [],
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.function.name === "create_task") {
          const args = JSON.parse(toolCall.function.arguments);

          const taskType = args.type || "task";
          const { data: task, error: taskError } = await supabase
            .from("tasks")
            .insert({
              title: args.title,
              description: args.description || "",
              priority: args.priority || "medium",
              status: args.status || "backlog",
              type: taskType,
              board_id: targetBoardId,
              created_by: userId,
              github_repo: githubRepo || null,
            })
            .select()
            .single();

          if (!taskError && task) {
            // Use AI-generated documentation or fallback to markdownContent
            const docContent = args.documentation || markdownContent || "";
            
            // Trigger task-created event to generate document with documentation
            const taskCreatedUrl = `${supabaseUrl}/functions/v1/task-created`;
            await fetch(taskCreatedUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${serviceKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ taskId: task.id, boardId: targetBoardId, markdownContent: docContent }),
            });

            // Auto-create GitHub issue for bug/improvement types with a repo
            if (githubRepo && (taskType === "bug" || taskType === "improvement")) {
              try {
                const label = taskType === "bug" ? "bug" : "enhancement";
                const issueBody = `**${task.display_id}** — Criado via Toolzz Office\n\n${args.description || "Sem descrição."}`;
                const githubApiUrl = `${supabaseUrl}/functions/v1/github-api`;
                
                // Get user's GitHub token
                const { data: ghIntegration } = await supabase
                  .from("github_integrations")
                  .select("access_token")
                  .eq("user_id", userId!)
                  .maybeSingle();

                if (ghIntegration?.access_token) {
                  const [owner, repo] = githubRepo.split("/");
                  const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${ghIntegration.access_token}`,
                      "User-Agent": "Toolzz-Office",
                      Accept: "application/vnd.github.v3+json",
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      title: `[${task.display_id}] ${task.title}`,
                      body: issueBody,
                      labels: [label],
                    }),
                  });
                  if (ghRes.ok) {
                    const issue = await ghRes.json();
                    await supabase.from("tasks").update({
                      github_issue_url: issue.html_url,
                      github_issue_number: issue.number,
                    }).eq("id", task.id);
                  }
                }
              } catch (e) {
                console.error("Failed to create GitHub issue from AI chat:", e);
              }
            }

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
          model: "google/gemini-2.5-flash",
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
