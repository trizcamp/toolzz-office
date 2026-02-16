import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Bot, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ToolzzChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId?: string | null;
}

const BOT_API_URL = "https://kratos.api.toolzz.com.br/api/v1/chat/send-message/";
const BOT_ID = "c46f095b-4520-4319-b4a0-882abde69ddc";

const TASK_INDICATORS = ["User Story", "Critérios de Aceite", "Dados da Tarefa", "Prioridade"];

function looksLikeTaskResponse(text: string): boolean {
  return TASK_INDICATORS.filter((kw) => text.includes(kw)).length >= 2;
}

export default function ToolzzChatDialog({ open, onOpenChange, boardId }: ToolzzChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // 1. Send to Toolzz agent
      const res = await fetch(BOT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: BOT_ID, message: text, fileUrl: "" }),
      });

      const data = await res.json();
      const toolzzReply =
        data?.message?.content ||
        data?.response ||
        (typeof data?.message === "string" ? data.message : "Sem resposta do agente.");

      // 2. Check if response looks like a task
      if (looksLikeTaskResponse(toolzzReply) && boardId) {
        // Show a temporary "processing" message
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "⏳ Criando tarefa a partir da resposta do agente..." },
        ]);

        // 3. Send to ai-chat edge function to create task
        const { data: aiData, error: aiError } = await supabase.functions.invoke("ai-chat", {
          body: {
            messages: [
              {
                role: "user",
                content: `Com base no conteúdo abaixo, crie a tarefa no board. Extraia título, descrição, prioridade e tipo:\n\n${toolzzReply}`,
              },
            ],
            boardId,
          },
        });

        // 4. Replace processing message with confirmation
        if (aiError) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: "❌ Erro ao criar a tarefa. Tente novamente.",
            };
            return updated;
          });
        } else {
          const createdTasks = aiData?.createdTasks || [];
          const confirmationMsg =
            createdTasks.length > 0
              ? `✅ Tarefa criada com sucesso!\n\n**${createdTasks[0].title}** — ${createdTasks[0].display_id}`
              : aiData?.message || "✅ Tarefa processada com sucesso!";

          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: confirmationMsg };
            return updated;
          });

          // Invalidate tasks query to refresh lists
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }
      } else {
        // Not a task — show Toolzz reply normally
        setMessages((prev) => [...prev, { role: "assistant", content: toolzzReply }]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Erro ao se comunicar com o agente. Tente novamente." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[70vh] flex flex-col p-0 gap-0">
        <DialogTitle className="px-4 pt-4 pb-2 text-sm font-semibold flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" /> Assistente IA Toolzz
        </DialogTitle>

        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-3 py-2">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">Envie uma mensagem para começar</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && <Bot className="w-5 h-5 text-primary shrink-0 mt-1" />}
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm max-w-[80%]",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground whitespace-pre-wrap"
                      : "bg-muted text-foreground prose prose-sm prose-invert max-w-none [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-2 [&_h1]:mb-1 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-2 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-1.5 [&_h3]:mb-1 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === "user" && <User className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 items-center">
                <Bot className="w-5 h-5 text-primary shrink-0" />
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-border flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={loading}
            className="flex-1"
          />
          <Button size="icon" onClick={sendMessage} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
