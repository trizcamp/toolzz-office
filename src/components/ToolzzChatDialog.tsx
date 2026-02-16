import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Bot, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ToolzzChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BOT_API_URL = "https://kratos.api.toolzz.com.br/api/v1/chat/send-message/";
const BOT_ID = "ff2e284b-6b79-4af4-894a-8bee9f2fc16e";

export default function ToolzzChatDialog({ open, onOpenChange }: ToolzzChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const res = await fetch(BOT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: BOT_ID, message: text, fileUrl: "" }),
      });

      const data = await res.json();
      const reply = data?.response || data?.message || data?.answer || JSON.stringify(data);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Erro ao se comunicar com o agente. Tente novamente." }]);
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
                    "rounded-lg px-3 py-2 text-sm max-w-[80%] whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {msg.content}
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
