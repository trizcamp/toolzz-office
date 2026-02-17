import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mic, MicOff, Volume2, Square, CheckCircle2, Send, Keyboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Input } from "@/components/ui/input";

interface VoiceAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string | null;
}

type Message = { role: "user" | "assistant"; content: string };
type Status = "idle" | "listening" | "processing" | "speaking";

export default function VoiceAgentDialog({ open, onOpenChange, boardId }: VoiceAgentDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [interimText, setInterimText] = useState("");
  const [createdTasks, setCreatedTasks] = useState<{ title: string; display_id: string }[]>([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");

  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const boardIdRef = useRef(boardId);

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

      // Speak only if not in text mode
      if (!showTextInput) {
        speakText(aiContent);
      } else {
        setStatus("idle");
      }
    } catch (e: any) {
      console.error("AI error:", e);
      toast.error("Erro ao comunicar com a IA");
      setStatus("idle");
    }
  }, [speakText, showTextInput]);

  const startListening = useCallback(async () => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error("Reconhecimento de voz não suportado neste navegador. Use o modo texto.");
      setShowTextInput(true);
      return;
    }

    // Request mic permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      toast.error("Permissão de microfone negada. Use o modo texto.");
      setShowTextInput(true);
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

    recognition.onstart = () => setStatus("listening");

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
      if (event.error === "not-allowed") {
        toast.error("Microfone bloqueado. Alternando para modo texto.");
        setShowTextInput(true);
      } else if (event.error !== "aborted" && event.error !== "no-speech") {
        toast.error(`Erro no reconhecimento: ${event.error}`);
      }
      setStatus("idle");
      setInterimText("");
    };

    recognition.onend = () => {
      setInterimText("");
      setStatus((prev) => prev === "processing" || prev === "speaking" ? prev : "idle");
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      toast.error("Não foi possível iniciar o microfone. Use o modo texto.");
      setShowTextInput(true);
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

  const handleTextSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const text = textInput.trim();
    if (!text || status === "processing") return;
    setTextInput("");
    sendToAI(text);
  }, [textInput, status, sendToAI]);

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
              {showTextInput
                ? 'Digite algo como: "Cria uma tarefa para corrigir o bug de login"'
                : 'Toque no microfone e diga: "Cria uma tarefa para corrigir o bug de login"'}
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
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
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
          {showTextInput && status === "idle" ? "Modo texto ativo" : statusLabel[status]}
        </p>

        {/* Text input (fallback) */}
        {showTextInput && (
          <form onSubmit={handleTextSubmit} className="flex w-full gap-2 px-1">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={status === "processing"}
              className="flex-1 text-sm"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || status === "processing"}
              className={cn(
                "w-10 h-10 rounded-lg border flex items-center justify-center transition-all shrink-0",
                textInput.trim() && status !== "processing"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground border-border"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Controls */}
        <div className="flex flex-col items-center gap-3 pb-1">
          <div className="flex items-center gap-3">
            {status === "speaking" ? (
              <button
                onClick={stopSpeaking}
                className="w-14 h-14 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center hover:bg-destructive/20 transition-all"
              >
                <Square className="w-5 h-5 text-destructive" />
              </button>
            ) : status === "listening" ? (
              <div className="relative flex items-center justify-center">
                {/* Pulsing sound wave rings */}
                <span className="absolute w-20 h-20 rounded-full border-2 border-primary/40 animate-ping" style={{ animationDuration: "1.5s" }} />
                <span className="absolute w-16 h-16 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.3s" }} />
                <span className="absolute w-24 h-24 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.6s" }} />
                <span className="absolute w-14 h-14 rounded-full bg-primary/10 animate-pulse" />
                <button
                  onClick={stopListening}
                  className="relative z-10 w-14 h-14 rounded-full bg-primary border-2 border-primary flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/30"
                >
                  <MicOff className="w-5 h-5 text-primary-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={startListening}
                disabled={status === "processing"}
                className={cn(
                  "w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all",
                  status === "processing"
                    ? "bg-muted border-border cursor-wait"
                    : "bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary/50 hover:scale-105"
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
              <div className="flex items-center gap-1">
                <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                <div className="flex items-end gap-0.5 h-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-0.5 bg-primary rounded-full animate-bounce"
                      style={{
                        height: `${8 + Math.random() * 8}px`,
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: "0.6s",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Toggle text mode */}
          <button
            onClick={() => setShowTextInput(!showTextInput)}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <Keyboard className="w-3 h-3" />
            {showTextInput ? "Voltar ao microfone" : "Usar modo texto"}
          </button>

          {/* Processing spinner */}
          {status === "processing" && (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
