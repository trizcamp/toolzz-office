import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Bot, User, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  fileUrl?: string;
  fileName?: string;
}

interface ToolzzChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId?: string | null;
}

const BOT_API_URL = "https://kratos.api.toolzz.com.br/api/v1/chat/send-message/";
const BOT_ID = "c46f095b-4520-4319-b4a0-882abde69ddc";
const ACCEPTED_TYPES = "image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const TASK_INDICATORS = ["User Story", "Critérios de Aceite", "Dados da Tarefa", "Prioridade"];

function looksLikeTaskResponse(text: string): boolean {
  return TASK_INDICATORS.filter((kw) => text.includes(kw)).length >= 2;
}

function isImageFile(name: string) {
  return /\.(png|jpe?g|webp|gif)$/i.test(name);
}

export default function ToolzzChatDialog({ open, onOpenChange, boardId }: ToolzzChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("chat-attachments").upload(path, file);
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("chat-attachments").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "Arquivo muito grande", description: "Máximo de 10MB.", variant: "destructive" });
      return;
    }
    setAttachedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && !attachedFile) || loading) return;

    let fileUrl = "";
    let fileName = "";

    if (attachedFile) {
      setUploading(true);
      const url = await uploadFile(attachedFile);
      setUploading(false);
      if (!url) return;
      fileUrl = url;
      fileName = attachedFile.name;
      setAttachedFile(null);
    }

    const userMsg: Message = { role: "user", content: text || `📎 ${fileName}`, fileUrl, fileName };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(BOT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: BOT_ID, message: text || fileName, fileUrl }),
      });

      const data = await res.json();
      const toolzzReply =
        data?.message?.content ||
        data?.response ||
        (typeof data?.message === "string" ? data.message : "Sem resposta do agente.");

      if (looksLikeTaskResponse(toolzzReply) && boardId) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "⏳ Criando tarefa a partir da resposta do agente..." },
        ]);

        const { data: aiData, error: aiError } = await supabase.functions.invoke("ai-chat", {
          body: {
            messages: [
              {
                role: "user",
                content: `Com base no conteúdo abaixo, crie a tarefa no board. Extraia título, descrição, prioridade e tipo:\n\n${toolzzReply}`,
              },
            ],
            boardId,
            markdownContent: toolzzReply,
          },
        });

        if (aiError) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: "❌ Erro ao criar a tarefa. Tente novamente." };
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
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }
      } else {
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
                  {/* Show attached file preview */}
                  {msg.fileUrl && msg.fileName && isImageFile(msg.fileName) && (
                    <img src={msg.fileUrl} alt={msg.fileName} className="rounded-md max-h-40 mb-1" />
                  )}
                  {msg.fileUrl && msg.fileName && !isImageFile(msg.fileName) && (
                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs underline mb-1">
                      <FileText className="w-3.5 h-3.5" /> {msg.fileName}
                    </a>
                  )}
                  {msg.role === "assistant" ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content !== `📎 ${msg.fileName}` ? msg.content : null
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

        {/* Attached file preview bar */}
        {attachedFile && (
          <div className="px-3 py-1.5 border-t border-border flex items-center gap-2 bg-muted/50">
            {isImageFile(attachedFile.name) ? (
              <ImageIcon className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-primary shrink-0" />
            )}
            <span className="text-xs text-foreground truncate flex-1">{attachedFile.name}</span>
            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setAttachedFile(null)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        <div className="p-3 border-t border-border flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || uploading}
            className="shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={loading || uploading}
            className="flex-1"
          />
          <Button size="icon" onClick={sendMessage} disabled={(loading || uploading) || (!input.trim() && !attachedFile)}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
