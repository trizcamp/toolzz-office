import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessages } from "@/hooks/useMessages";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ChatAreaProps {
  roomId: string | null;
  roomName: string;
  aiEnabled?: boolean;
  boardId?: string | null;
  onAiSpeakingChange?: (speaking: boolean) => void;
}

type AiMessage = {
  id: string;
  role: "assistant";
  content: string;
  created_at: string;
};

type CreatedTask = { title: string; display_id: string };

export default function ChatArea({ roomId, roomName, aiEnabled, boardId, onAiSpeakingChange }: ChatAreaProps) {
  const { messages, sendMessage } = useMessages(roomId);
  const { members } = useMembers();
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // AI state
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiConversationHistory, setAiConversationHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [createdTasks, setCreatedTasks] = useState<CreatedTask[]>([]);
  const aiHistoryRef = useRef(aiConversationHistory);

  useEffect(() => { aiHistoryRef.current = aiConversationHistory; }, [aiConversationHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiMessages]);

  // Reset AI state when disabled
  useEffect(() => {
    if (!aiEnabled) {
      setAiMessages([]);
      setAiConversationHistory([]);
      setCreatedTasks([]);
      setAiProcessing(false);
      window.speechSynthesis?.cancel();
      onAiSpeakingChange?.(false);
    }
  }, [aiEnabled, onAiSpeakingChange]);

  const stripMarkdown = (text: string): string => {
    return text
      .replace(/#{1,6}\s?/g, "")
      .replace(/\*\*\*(.*?)\*\*\*/g, "$1")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/~~(.*?)~~/g, "$1")
      .replace(/`{1,3}[^`]*`{1,3}/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^[-*+]\s/gm, "")
      .replace(/^\d+\.\s/gm, "")
      .replace(/^>\s?/gm, "")
      .replace(/---+/g, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .trim();
  };

  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = stripMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "pt-BR";
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang.startsWith("pt"));
    if (ptVoice) utterance.voice = ptVoice;
    utterance.onstart = () => onAiSpeakingChange?.(true);
    utterance.onend = () => onAiSpeakingChange?.(false);
    utterance.onerror = () => onAiSpeakingChange?.(false);
    window.speechSynthesis.speak(utterance);
  }, [onAiSpeakingChange]);

  const sendToAI = useCallback(async (userText: string) => {
    const userEntry = { role: "user" as const, content: userText };
    const newHistory = [...aiHistoryRef.current, userEntry];
    setAiConversationHistory(newHistory);
    aiHistoryRef.current = newHistory;
    setAiProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { messages: newHistory, boardId },
      });

      if (error) throw error;

      const aiContent = data?.message || "Desculpe, não consegui processar.";
      const aiMsg: AiMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: aiContent,
        created_at: new Date().toISOString(),
      };
      setAiMessages((prev) => [...prev, aiMsg]);

      const assistantEntry = { role: "assistant" as const, content: aiContent };
      setAiConversationHistory((prev) => {
        const updated = [...prev, assistantEntry];
        aiHistoryRef.current = updated;
        return updated;
      });

      if (data?.createdTasks?.length) {
        setCreatedTasks((prev) => [
          ...prev,
          ...data.createdTasks.map((t: any) => ({ title: t.title, display_id: t.display_id })),
        ]);
      }

      speakText(aiContent);
    } catch (e: any) {
      console.error("AI error:", e);
      toast.error("Erro ao comunicar com a IA");
    } finally {
      setAiProcessing(false);
    }
  }, [boardId, speakText]);

  const handleSend = () => {
    if (!draft.trim() || !roomId) return;
    const text = draft.trim();
    sendMessage.mutate({ roomId, text });
    setDraft("");

    // If AI is enabled, also send to AI
    if (aiEnabled) {
      sendToAI(text);
    }
  };

  const getMemberName = (userId: string) => {
    if (userId === user?.id) return "Você";
    const member = members.find((m) => m.id === userId);
    return member ? `${member.name} ${member.surname?.charAt(0) || ""}.` : "Anônimo";
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  // Merge room messages and AI messages, sorted by time
  const allMessages = [
    ...messages.map((m) => ({ ...m, isAi: false })),
    ...aiMessages.map((m) => ({ id: m.id, user_id: "ai-agent", text: m.content, created_at: m.created_at, room_id: roomId || "", isAi: true })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-border shrink-0">
        <h3 className="text-sm font-medium text-foreground">{roomName}</h3>
        {aiEnabled && (
          <div className="ml-2 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-primary font-medium">IA ouvindo</span>
            {aiProcessing && (
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {allMessages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">Nenhuma mensagem ainda. Comece a conversa!</p>
        )}
        {allMessages.map((msg) => (
          <div key={msg.id} className="flex gap-2.5">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium",
              msg.isAi
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            )}>
              {msg.isAi ? <Bot className="w-4 h-4" /> : getMemberName(msg.user_id).charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-sm font-medium",
                  msg.isAi ? "text-primary" : "text-foreground"
                )}>
                  {msg.isAi ? "Toolzz IA" : getMemberName(msg.user_id)}
                </span>
                <span className="text-[10px] text-muted-foreground">{formatTime(msg.created_at)}</span>
              </div>
              {msg.isAi ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 text-sm text-secondary-foreground">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-secondary-foreground">{msg.text}</p>
              )}
            </div>
          </div>
        ))}

        {/* Created tasks inline */}
        {createdTasks.length > 0 && (
          <div className="space-y-1 pt-1">
            {createdTasks.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-medium text-foreground">{t.display_id}</span>
                <span className="truncate">{t.title}</span>
              </div>
            ))}
          </div>
        )}

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
