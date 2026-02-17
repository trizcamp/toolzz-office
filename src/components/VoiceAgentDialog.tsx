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

const getSpeechRecognitionAPI = () => {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
};

export default function VoiceAgentDialog({ open, onOpenChange, boardId }: VoiceAgentDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [interimText, setInterimText] = useState("");
  const [createdTasks, setCreatedTasks] = useState<{ title: string; display_id: string }[]>([]);

  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const boardIdRef = useRef(boardId);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { boardIdRef.current = boardId; }, [boardId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, interimText]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
        recognitionRef.current = null;
      }
      window.speechSynthesis?.cancel();
      setStatus("idle");
      setInterimText("");
    }
  }, [open]);

  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang.startsWith("pt"));
    if (ptVoice) utterance.voice = ptVoice;
    utterance.onstart = () => setStatus("speaking");
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");
    window.speechSynthesis.speak(utterance);
  }, []);

  const sendToAI = useCallback(async (userText: string) => {
    const userMsg: Message = { role: "user", content: userText };
    const newMessages = [...messagesRef.current, userMsg];
    setMessages(newMessages);
    messagesRef.current = newMessages;
    setStatus("processing");

    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { messages: newMessages, boardId: boardIdRef.current },
      });

      if (error) throw error;

      const aiContent = data?.message || "Desculpe, não consegui processar.";
      const aiMsg: Message = { role: "assistant", content: aiContent };
      setMessages((prev) => {
        const updated = [...prev, aiMsg];
        messagesRef.current = updated;
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
      setStatus("idle");
    }
  }, [speakText]);

  const startListening = useCallback(async () => {
    const SpeechRecognitionAPI = getSpeechRecognitionAPI();
    if (!SpeechRecognitionAPI) {
      toast.error("Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.");
      return;
    }

    // Request microphone permission first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      toast.error("Permissão de microfone necessária para usar o agente de voz.");
      return;
    }

    window.speechSynthesis?.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setStatus("listening");
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }
      setInterimText(interim);
      if (finalText.trim()) {
        setInterimText("");
        sendToAI(finalText.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "aborted" && event.error !== "no-speech") {
        toast.error(`Erro no reconhecimento de voz: ${event.error}`);
      }
      setStatus("idle");
      setInterimText("");
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setInterimText("");
      // Don't reset status if we're processing
      setStatus((prev) => prev === "processing" || prev === "speaking" ? prev : "idle");
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      toast.error("Não foi possível iniciar o microfone");
    }
  }, [sendToAI]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setStatus("idle");
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
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
