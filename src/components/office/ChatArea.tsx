import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessages } from "@/hooks/useMessages";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/hooks/useAuth";

interface ChatAreaProps {
  roomId: string | null;
  roomName: string;
}

export default function ChatArea({ roomId, roomName }: ChatAreaProps) {
  const { messages, sendMessage } = useMessages(roomId);
  const { members } = useMembers();
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!draft.trim() || !roomId) return;
    sendMessage.mutate({ roomId, text: draft.trim() });
    setDraft("");
  };

  const getMemberName = (userId: string) => {
    if (userId === user?.id) return "Você";
    const member = members.find((m) => m.id === userId);
    return member ? `${member.name} ${member.surname?.charAt(0) || ""}.` : "Anônimo";
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-border shrink-0">
        <h3 className="text-sm font-medium text-foreground">{roomName}</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">Nenhuma mensagem ainda. Comece a conversa!</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-medium text-muted-foreground">
              {getMemberName(msg.user_id).charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-foreground">{getMemberName(msg.user_id)}</span>
                <span className="text-[10px] text-muted-foreground">{formatTime(msg.created_at)}</span>
              </div>
              <p className="text-sm text-secondary-foreground">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Mensagem em ${roomName}...`}
            className="flex-1 bg-muted border-0"
          />
          <Button size="icon" type="submit" disabled={!draft.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
