import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mic, MicOff, Volume2, Square, CheckCircle2, Send, Keyboard, RotateCcw } from "lucide-react";
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
  const [createdTasks, setCreatedTasks] = useState<{ title: string; display_id: string }[]>([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const boardIdRef = useRef(boardId);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { boardIdRef.current = boardId; }, [boardId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      stopRecording();
      window.speechSynthesis?.cancel();
      setStatus("idle");
    }
  }, [open]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  const stripMarkdown = (text: string): string => {
    return text
      .replace(/#{1,6}\s?/g, "")           // headings
      .replace(/\*\*\*(.*?)\*\*\*/g, "$1") // bold+italic
      .replace(/\*\*(.*?)\*\*/g, "$1")     // bold
      .replace(/\*(.*?)\*/g, "$1")         // italic
      .replace(/~~(.*?)~~/g, "$1")         // strikethrough
      .replace(/`{1,3}[^`]*`{1,3}/g, "")  // inline/block code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
      .replace(/^[-*+]\s/gm, "")           // list bullets
      .replace(/^\d+\.\s/gm, "")           // numbered lists
      .replace(/^>\s?/gm, "")              // blockquotes
      .replace(/---+/g, "")                // horizontal rules
      .replace(/\n{2,}/g, ". ")            // double newlines to pause
      .replace(/\n/g, " ")                 // single newlines
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

  const transcribeAndSend = useCallback(async (audioBlob: Blob) => {
    setStatus("processing");

    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: { audioBase64: base64, mimeType: audioBlob.type || "audio/webm" },
      });

      if (error) throw error;

      const transcript = data?.transcript?.trim();
      if (!transcript) {
        toast.error("Não foi possível entender o áudio. Tente novamente.");
        setStatus("idle");
        return;
      }

      await sendToAI(transcript);
    } catch (e: any) {
      console.error("Transcription error:", e);
      toast.error("Erro ao transcrever o áudio. Tente novamente.");
      setStatus("idle");
    }
  }, [sendToAI]);

  const startListening = useCallback(async () => {
    window.speechSynthesis?.cancel();
    stopRecording();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        // Stop mic tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }

        if (audioBlob.size > 0) {
          transcribeAndSend(audioBlob);
        } else {
          setStatus("idle");
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus("listening");
    } catch (e: any) {
      console.error("Microphone error:", e);
      toast.error("Não foi possível acessar o microfone. Use o modo texto.");
      setShowTextInput(true);
      setStatus("idle");
    }
  }, [stopRecording, transcribeAndSend]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setStatus("idle");
  }, []);

  const handleTextSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const text = textInput.trim();
    if (!text || status === "processing") return;
    setTextInput("");
    sendToAI(text);
  }, [textInput, status, sendToAI]);

  const resetChat = useCallback(() => {
    stopRecording();
    window.speechSynthesis?.cancel();
    setMessages([]);
    messagesRef.current = [];
    setCreatedTasks([]);
    setStatus("idle");
    setTextInput("");
  }, [stopRecording]);

  const statusLabel: Record<Status, string> = {
    idle: "Toque no microfone para falar",
    listening: "Ouvindo... toque para parar",
    processing: "Processando...",
    speaking: "Falando...",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-center flex-1">Agente de Voz IA</DialogTitle>
          {messages.length > 0 && (
            <button
              onClick={resetChat}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors mr-6"
              title="Nova conversa"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Nova conversa
            </button>
          )}
        </DialogHeader>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[40vh] px-1">
          {messages.length === 0 && (
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
