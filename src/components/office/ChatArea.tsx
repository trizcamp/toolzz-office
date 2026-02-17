import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, CheckCircle2, RotateCcw, Download, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessages } from "@/hooks/useMessages";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface TranscriptionEntry {
  id: string;
  speaker: string;
  text: string;
  time: string;
  created_at: string;
}

interface ChatAreaProps {
  roomId: string | null;
  roomName: string;
  aiEnabled?: boolean;
  boardId?: string | null;
  isListening?: boolean;
  isSpeechDetected?: boolean;
  transcriptionEntries?: TranscriptionEntry[];
  onAiSpeakingChange?: (speaking: boolean) => void;
  onClearHistory?: () => void;
  onAiResponse?: (text: string) => void;
}

type AiMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  created_at: string;
};

type CreatedTask = { title: string; display_id: string };

export default function ChatArea({ roomId, roomName, aiEnabled, boardId, isListening, isSpeechDetected, transcriptionEntries = [], onAiSpeakingChange, onClearHistory, onAiResponse }: ChatAreaProps) {
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
  }, [messages, aiMessages, transcriptionEntries]);

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
    // Signal AI speaking BEFORE synthesis starts to mute mic immediately
    onAiSpeakingChange?.(true);
    const cleanText = stripMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "pt-BR";
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang.startsWith("pt"));
    if (ptVoice) utterance.voice = ptVoice;
    utterance.onend = () => onAiSpeakingChange?.(false);
    utterance.onerror = () => onAiSpeakingChange?.(false);
    window.speechSynthesis.speak(utterance);
  }, [onAiSpeakingChange]);

  // Reset AI state when disabled, greet when enabled
  const prevAiEnabledRef = useRef(false);
  useEffect(() => {
    if (!aiEnabled) {
      setAiMessages([]);
      setAiConversationHistory([]);
      setCreatedTasks([]);
      setAiProcessing(false);
      window.speechSynthesis?.cancel();
      onAiSpeakingChange?.(false);
      prevAiEnabledRef.current = false;
    } else if (!prevAiEnabledRef.current) {
      prevAiEnabledRef.current = true;
      const greeting = "Olá! 👋 Sou o Toolzz AI, seu assistente de tarefas. Qual tarefa você quer criar?";
      const greetMsg: AiMessage = {
        id: `ai-greet-${Date.now()}`,
        role: "assistant",
        content: greeting,
        created_at: new Date().toISOString(),
      };
      setAiMessages([greetMsg]);
      const assistantEntry = { role: "assistant" as const, content: greeting };
      setAiConversationHistory([assistantEntry]);
      aiHistoryRef.current = [assistantEntry];
      onAiResponse?.(greeting);
      setTimeout(() => speakText(greeting.replace(/👋/g, "")), 500);
    }
  }, [aiEnabled, onAiSpeakingChange, speakText]);

  // Auto-send new transcriptions to AI when enabled
  const lastProcessedTranscriptionRef = useRef(0);
  const sendToAIRef = useRef<((text: string) => void) | null>(null);
  const pendingTextRef = useRef<string | null>(null);

  // When transcription entries arrive, queue them
  useEffect(() => {
    if (!aiEnabled || transcriptionEntries.length === 0) return;
    
    const newEntries = transcriptionEntries.slice(lastProcessedTranscriptionRef.current);
    if (newEntries.length === 0) return;
    
    lastProcessedTranscriptionRef.current = transcriptionEntries.length;
    const combinedText = newEntries.map(e => e.text).join(" ").trim();
    if (!combinedText) return;

    if (aiProcessing) {
      // Queue for later
      pendingTextRef.current = pendingTextRef.current ? `${pendingTextRef.current} ${combinedText}` : combinedText;
    } else if (sendToAIRef.current) {
      sendToAIRef.current(combinedText);
    }
  }, [transcriptionEntries, aiEnabled, aiProcessing]);

  // Flush pending text when AI finishes processing
  useEffect(() => {
    if (!aiProcessing && pendingTextRef.current && sendToAIRef.current) {
      const text = pendingTextRef.current;
      pendingTextRef.current = null;
      sendToAIRef.current(text);
    }
  }, [aiProcessing]);

  // Reset counter when AI is disabled
  useEffect(() => {
    if (!aiEnabled) lastProcessedTranscriptionRef.current = 0;
  }, [aiEnabled]);

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
      onAiResponse?.(aiContent);

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

  // Keep ref in sync for transcription auto-send
  useEffect(() => { sendToAIRef.current = sendToAI; }, [sendToAI]);

  const handleSend = () => {
    if (!draft.trim()) return;
    const text = draft.trim();
    setDraft("");

    if (aiEnabled) {
      // When AI is active, only use AI chat (don't save to room to avoid duplicates)
      setAiMessages((prev) => [...prev, {
        id: `user-input-${Date.now()}`,
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      }]);
      sendToAI(text);
    } else if (roomId) {
      sendMessage.mutate({ roomId, text });
    }
  };

  const handleSaveConversation = () => {
    const lines: string[] = [];
    lines.push(`Conversa em ${roomName} — ${new Date().toLocaleDateString("pt-BR")}`);
    lines.push("=".repeat(50));
    lines.push("");

    allMessages.forEach((msg) => {
      const name = msg.isAi ? "Toolzz IA" : msg.isTranscription ? `🎙️ ${msg.speaker}` : getMemberName(msg.user_id);
      const time = formatTime(msg.created_at);
      lines.push(`[${time}] ${name}: ${msg.text}`);
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversa-${roomName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Conversa salva!");
  };

  const handleClearHistory = () => {
    setAiMessages([]);
    setAiConversationHistory([]);
    aiHistoryRef.current = [];
    setCreatedTasks([]);
    onClearHistory?.();
    toast.success("Histórico limpo!");
  };

  const getMemberName = (userId: string) => {
    if (userId === user?.id) return "Você";
    const member = members.find((m) => m.id === userId);
    return member ? `${member.name} ${member.surname?.charAt(0) || ""}.` : "Anônimo";
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  // Only show messages from current session (AI messages + transcriptions, no persisted room messages)
  const allMessages = [
    ...aiMessages.map((m) => ({
      id: m.id,
      user_id: m.role === "user" ? (user?.id || "user") : "ai-agent",
      text: m.content,
      created_at: m.created_at,
      room_id: roomId || "",
      isAi: m.role === "assistant",
      isUserAi: m.role === "user",
      isTranscription: false,
      speaker: "",
    })),
    ...transcriptionEntries.map((t) => ({ id: t.id, user_id: "transcription", text: t.text, created_at: t.created_at, room_id: roomId || "", isAi: false, isUserAi: false, isTranscription: false, speaker: t.speaker })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const hasContent = allMessages.length > 0;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-border shrink-0">
        <h3 className="text-sm font-medium text-foreground flex-1">{roomName}</h3>
        <div className="flex items-center gap-1.5">
          {isListening && (
            <div className="flex items-center gap-1.5 mr-2">
              <Mic className={cn("w-3 h-3", isSpeechDetected ? "text-[hsl(var(--success))]" : "text-muted-foreground")} />
              <span className={cn("text-[10px] font-medium", isSpeechDetected ? "text-[hsl(var(--success))]" : "text-muted-foreground")}>
                {isSpeechDetected ? "Captando" : "Mic ligado"}
              </span>
              {isSpeechDetected && <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />}
            </div>
          )}
          {aiEnabled && (
            <div className="flex items-center gap-1.5 mr-2">
              <Bot className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] text-primary font-medium">IA ativa</span>
              {aiProcessing && (
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          )}
          {hasContent && (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveConversation} title="Salvar conversa">
                <Download className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClearHistory} title="Limpar histórico">
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
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
                : msg.isTranscription
                  ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]"
                  : "bg-muted text-muted-foreground"
            )}>
              {msg.isAi ? (
                <Bot className="w-4 h-4" />
              ) : msg.isTranscription ? (
                <Mic className="w-4 h-4" />
              ) : (
                getMemberName(msg.user_id).charAt(0)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-sm font-medium",
                  msg.isAi ? "text-primary" : msg.isTranscription ? "text-[hsl(var(--success))]" : "text-foreground"
                )}>
                  {msg.isAi ? "Toolzz IA" : msg.isTranscription ? `🎙️ ${msg.speaker}` : getMemberName(msg.user_id)}
                </span>
                <span className="text-[10px] text-muted-foreground">{formatTime(msg.created_at)}</span>
                {msg.isTranscription && (
                  <span className="text-[9px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">transcrição</span>
                )}
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
