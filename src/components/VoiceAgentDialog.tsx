import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mic, MicOff, Volume2, Square, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface VoiceAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string | null;
}

type Message = { role: "user" | "assistant"; content: string };
type Status = "idle" | "listening" | "processing" | "speaking";

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export default function VoiceAgentDialog({ open, onOpenChange, boardId }: VoiceAgentDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [interimText, setInterimText] = useState("");
  const [createdTasks, setCreatedTasks] = useState<{ title: string; display_id: string }[]>([]);

  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, interimText]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      stopListening();
      window.speechSynthesis?.cancel();
      setStatus("idle");
      setInterimText("");
    }
  }, [open]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
  }, []);

  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";

    // Try to pick a pt-BR voice
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang.startsWith("pt"));
    if (ptVoice) utterance.voice = ptVoice;

    utterance.onstart = () => setStatus("speaking");
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");
    window.speechSynthesis.speak(utterance);
  }, []);

  const sendToAI = useCallback(
    async (userText: string) => {
      const userMsg: Message = { role: "user", content: userText };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setStatus("processing");

      try {
        const { data, error } = await supabase.functions.invoke("ai-chat", {
          body: { messages: newMessages, boardId },
        });

        if (error) throw error;

        const aiContent = data?.message || "Desculpe, não consegui processar.";
        const aiMsg: Message = { role: "assistant", content: aiContent };
        setMessages((prev) => [...prev, aiMsg]);

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
        setStatus("idle");
      }
    },
    [messages, boardId, speakText]
  );

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      toast.error("Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.");
      return;
    }

    window.speechSynthesis?.cancel();
    stopListening();

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setStatus("listening");

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      setInterimText(interim);
      if (final) {
        setInterimText("");
        sendToAI(final.trim());
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "aborted") {
        console.error("Speech recognition error:", event.error);
        toast.error("Erro no reconhecimento de voz");
      }
      setStatus("idle");
      setInterimText("");
    };

    recognition.onend = () => {
      if (status === "listening") setStatus("idle");
      setInterimText("");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [stopListening, sendToAI, status]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setStatus("idle");
  }, []);

  const statusLabel: Record<Status, string> = {
    idle: "Toque no microfone para falar",
    listening: "Ouvindo...",
    processing: "Processando...",
    speaking: "Falando...",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center">Agente de Voz IA</DialogTitle>
        </DialogHeader>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[40vh] px-1">
          {messages.length === 0 && !interimText && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Diga algo como: "Cria uma tarefa para corrigir o bug de login"
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {interimText && (
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-primary/50 text-primary-foreground italic">
                {interimText}
              </div>
            </div>
          )}
        </div>

        {/* Created tasks */}
        {createdTasks.length > 0 && (
          <div className="space-y-1 px-1">
            {createdTasks.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                <span className="font-medium text-foreground">{t.display_id}</span>
                <span className="truncate">{t.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* Status */}
        <p className={cn(
          "text-xs text-center",
          status === "listening" ? "text-primary font-medium" : "text-muted-foreground"
        )}>
          {statusLabel[status]}
        </p>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 pb-1">
          {status === "speaking" ? (
            <button
              onClick={stopSpeaking}
              className="w-14 h-14 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center hover:bg-destructive/20 transition-all"
            >
              <Square className="w-6 h-6 text-destructive" />
            </button>
          ) : status === "listening" ? (
            <button
              onClick={stopListening}
              className="w-14 h-14 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center hover:bg-destructive/20 transition-all animate-pulse"
            >
              <MicOff className="w-6 h-6 text-destructive" />
            </button>
          ) : (
            <button
              onClick={startListening}
              disabled={status === "processing"}
              className={cn(
                "w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all",
                status === "processing"
                  ? "bg-muted border-border cursor-wait"
                  : "bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary/50"
              )}
            >
              {status === "processing" ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Mic className="w-6 h-6 text-primary" />
              )}
            </button>
          )}

          {status === "speaking" && (
            <Volume2 className="w-5 h-5 text-primary animate-pulse" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
