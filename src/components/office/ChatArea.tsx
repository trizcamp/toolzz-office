import { useRef, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockMessages } from "@/contexts/VoiceConnectionContext";
import type { Room } from "@/contexts/VoiceConnectionContext";

interface ChatAreaProps {
  room: Room;
}

export default function ChatArea({ room }: ChatAreaProps) {
  const [messages, setMessages] = useState(mockMessages);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!draft.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `m${Date.now()}`,
        userId: "me",
        userName: "Você",
        text: draft.trim(),
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setDraft("");
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-border shrink-0">
        <h3 className="text-sm font-medium text-foreground">{room.name}</h3>
        <span className="ml-2 text-xs text-muted-foreground">{room.category}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-medium text-muted-foreground">
              {msg.userName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-foreground">{msg.userName}</span>
                <span className="text-[10px] text-muted-foreground">{msg.time}</span>
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
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Mensagem em ${room.name}...`}
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
