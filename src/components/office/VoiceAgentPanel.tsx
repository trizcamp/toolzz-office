import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Send, Square, Volume2, CheckCircle2, RotateCcw, Bot, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface VoiceAgentPanelProps {
  boardId: string | null;
  onSpeakingChange?: (speaking: boolean) => void;
  onClose?: () => void;
}

type Message = { role: "user" | "assistant"; content: string };
type Status = "idle" | "listening" | "processing" | "speaking";

export default function VoiceAgentPanel({ boardId, onSpeakingChange, onClose }: VoiceAgentPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [createdTasks, setCreatedTasks] = useState<{ title: string; display_id: string }[]>([]);
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

  useEffect(() => {
    onSpeakingChange?.(status === "speaking");
  }, [status, onSpeakingChange]);

  // Proactive greeting when AI panel opens
  const hasGreetedRef = useRef(false);
  useEffect(() => {
    if (hasGreetedRef.current) return;
    hasGreetedRef.current = true;
    const greeting = "Olá! 👋 Sou seu assistente de tarefas. Vamos criar algumas tarefas? Me diga o título da primeira!";
    const aiMsg: Message = { role: "assistant", content: greeting };
    setMessages([aiMsg]);
    messagesRef.current = [aiMsg];
    // Speak the greeting after a short delay
    const timer = setTimeout(() => {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(greeting.replace(/👋/g, ""));
      utterance.lang = "pt-BR";
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find((v) => v.lang.startsWith("pt"));
      if (ptVoice) utterance.voice = ptVoice;
      utterance.onstart = () => setStatus("speaking");
      utterance.onend = () => setStatus("idle");
      utterance.onerror = () => setStatus("idle");
      window.speechSynthesis.speak(utterance);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      window.speechSynthesis?.cancel();
    };
  }, []);

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

  const transcribeAndSend = useCallback(async (audioBlob: Blob) => {
    setStatus("processing");
    try {
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
      toast.error("Erro ao transcrever o áudio.");
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
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        if (audioBlob.size > 0) transcribeAndSend(audioBlob);
        else setStatus("idle");
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus("listening");
    } catch {
      toast.error("Não foi possível acessar o microfone.");
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
    idle: "Toque para falar com a IA",
    listening: "Ouvindo...",
    processing: "Processando...",
    speaking: "IA falando...",
  };

  return (
    <div className="flex flex-col h-full border-l border-border bg-card">
      {/* Header */}
      <div className="h-12 px-4 flex items-center gap-2 border-b border-border shrink-0">
        <Bot className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground flex-1">Agente IA</h3>
        {messages.length > 0 && (
          <button
            onClick={resetChat}
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Limpar
          </button>
        )}
        {onClose && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Fale ou digite para interagir com a IA
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[90%] rounded-xl px-3 py-2 text-sm",
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
        <div className="px-3 space-y-1">
          {createdTasks.map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-medium text-foreground">{t.display_id}</span>
              <span className="truncate">{t.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Status + mic controls */}
      <div className="px-3 py-2 space-y-2 border-t border-border">
        <p className={cn(
          "text-[10px] text-center",
          status === "listening" ? "text-primary font-medium" : "text-muted-foreground"
        )}>
          {statusLabel[status]}
        </p>

        <div className="flex items-center gap-2">
          {/* Voice button */}
          {status === "speaking" ? (
            <button
              onClick={stopSpeaking}
              className="w-9 h-9 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center hover:bg-destructive/20 transition-all shrink-0"
            >
              <Square className="w-3.5 h-3.5 text-destructive" />
            </button>
          ) : status === "listening" ? (
            <div className="relative flex items-center justify-center shrink-0">
              <span className="absolute w-11 h-11 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: "1.5s" }} />
              <button
                onClick={stopListening}
                className="relative z-10 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
              >
                <MicOff className="w-3.5 h-3.5 text-primary-foreground" />
              </button>
            </div>
          ) : (
            <button
              onClick={startListening}
              disabled={status === "processing"}
              className={cn(
                "w-9 h-9 rounded-full border flex items-center justify-center transition-all shrink-0",
                status === "processing"
                  ? "bg-muted border-border cursor-wait"
                  : "bg-primary/10 border-primary/30 hover:bg-primary/20"
              )}
            >
              {status === "processing" ? (
                <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Mic className="w-4 h-4 text-primary" />
              )}
            </button>
          )}

          {/* Text input */}
          <form onSubmit={handleTextSubmit} className="flex flex-1 gap-1.5">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Mensagem para IA..."
              disabled={status === "processing"}
              className="flex-1 h-9 text-xs bg-muted border-0"
            />
            <Button
              size="icon"
              type="submit"
              disabled={!textInput.trim() || status === "processing"}
              className="h-9 w-9 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>

        {status === "speaking" && (
          <div className="flex items-center justify-center gap-1">
            <Volume2 className="w-3 h-3 text-primary animate-pulse" />
            <div className="flex items-end gap-0.5 h-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-0.5 bg-primary rounded-full animate-bounce"
                  style={{ height: `${6 + Math.random() * 6}px`, animationDelay: `${i * 0.15}s`, animationDuration: "0.6s" }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
