import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff, Bot, Users, Copy, MessageSquare, Calendar, Clock, Check, X, CalendarClock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useMembers";
import { useBoards } from "@/hooks/useBoards";
import ChatArea from "@/components/office/ChatArea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function MeetingRoomPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { members } = useMembers();
  const { boards } = useBoards();
  const boardId = boards?.[0]?.id || null;

  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inLobby, setInLobby] = useState(true);
  const [myParticipant, setMyParticipant] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [creatorMember, setCreatorMember] = useState<any>(null);

  // Media state
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenOn, setScreenOn] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechDetected, setIsSpeechDetected] = useState(false);
  const [transcriptionEntries, setTranscriptionEntries] = useState<any[]>([]);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Transcription refs (simplified from OfficePage)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isVoiceActiveRef = useRef(false);
  const aiSpeakingRef = useRef(false);
  const speechDetectedInChunkRef = useRef(false);
  const vadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const transcribeChunkRef = useRef<((blob: Blob) => void) | null>(null);
  const lastAiResponsesRef = useRef<string[]>([]);

  // Keep refs in sync
  useEffect(() => { isVoiceActiveRef.current = isListening; }, [isListening]);
  useEffect(() => { aiSpeakingRef.current = aiSpeaking; }, [aiSpeaking]);

  // Fetch meeting
  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data, error } = await (supabase
        .from("meetings")
        .select("*") as any)
        .eq("meeting_code", code)
        .maybeSingle();
      if (error || !data) {
        toast.error("Reunião não encontrada");
        navigate("/meetings");
        return;
      }
      setMeeting(data);

      // Find creator member
      if (data.created_by) {
        const creator = members.find(m => m.id === data.created_by);
        setCreatorMember(creator || null);
      }

      // Fetch participants
      const { data: parts } = await supabase
        .from("meeting_participants")
        .select("*")
        .eq("meeting_id", data.id) as any;
      setParticipants(parts || []);

      // Check if current user is a participant
      const myPart = (parts || []).find((p: any) => p.user_id === user?.id);
      setMyParticipant(myPart || null);

      // If current user is the creator, skip lobby
      if (data.created_by === user?.id) {
        setInLobby(false);
      }

      setLoading(false);
    })();
  }, [code, navigate, user?.id, members]);

  // Start local camera only when not in lobby
  useEffect(() => {
    if (loading || !meeting || inLobby) return;
    startCamera();
    return () => stopAllMedia();
  }, [loading, meeting, inLobby]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("[Meeting] getUserMedia error:", err);
      toast.error("Não foi possível acessar câmera/microfone. Verifique as permissões do navegador.");
    }
    // Start a SEPARATE audio-only stream for transcription (like Office page)
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = audioStream;
      startTranscription(audioStream);
    } catch (err) {
      console.error("[Meeting] Audio-only stream error:", err);
    }
  };

  const toggleMic = () => {
    const newState = !micOn;
    setMicOn(newState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = newState; });
    }
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setCamOn(prev => !prev);
    }
  };

  const toggleScreen = async () => {
    if (screenOn) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setScreenOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }
        stream.getVideoTracks()[0].onended = () => {
          setScreenOn(false);
          screenStreamRef.current = null;
        };
        setScreenOn(true);
      } catch {
        // User cancelled
      }
    }
  };

  const stopAllMedia = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    // Stop the dedicated audio stream for transcription
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    stopTranscription();
  };

  const handleLeave = async () => {
    stopAllMedia();
    // Update meeting status
    if (meeting?.id) {
      await (supabase.from("meetings").update({
        status: "ended",
        end_time: new Date().toTimeString().slice(0, 5),
      } as any) as any).eq("id", meeting.id);
    }
    navigate("/meetings");
  };

  // ---- Transcription logic (same as OfficePage) ----
  const transcribeChunk = useCallback(async (blob: Blob) => {
    if (!speechDetectedInChunkRef.current) return;
    speechDetectedInChunkRef.current = false;
    if (aiSpeakingRef.current) return;
    if (blob.size < 2000) return;
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
      const base64 = btoa(binary);
      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: { audioBase64: base64, mimeType: blob.type || "audio/webm" },
      });
      if (error) return;
      const text = data?.transcript?.trim();
      if (!text || text.length < 3) return;
      if (/^[.\s,…!?;:\-—–]+$/.test(text)) return;
      const hallucPatterns = [/silêncio/i, /silence/i, /não há fala/i, /inaudível/i];
      if (hallucPatterns.some(p => p.test(text))) return;

      const now = new Date();
      setTranscriptionEntries(prev => [
        ...prev,
        { id: `t-${Date.now()}`, speaker: "Você", text, time: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), created_at: now.toISOString() },
      ]);
    } catch { }
  }, []);

  useEffect(() => { transcribeChunkRef.current = transcribeChunk; }, [transcribeChunk]);

  const startTranscription = useCallback((stream: MediaStream) => {
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    
    // Resume AudioContext if suspended (browser autoplay policy)
    if (audioContext.state === "suspended") {
      audioContext.resume().then(() => console.log("[Meeting] AudioContext resumed"));
    }
    
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.3;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let logCounter = 0;
    vadIntervalRef.current = setInterval(() => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = (dataArray[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / dataArray.length) * 100;
      const detected = rms > 8;
      setIsSpeechDetected(detected);
      if (detected) speechDetectedInChunkRef.current = true;
      // Log every 30 ticks (~3s) for debugging
      logCounter++;
      if (logCounter % 30 === 0) {
        console.log("[Meeting] VAD rms:", rms.toFixed(2), "detected:", detected, "audioCtx state:", audioContext.state);
      }
    }, 100);

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";

    const createRecorder = () => {
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          chunksRef.current = [];
          transcribeChunkRef.current?.(blob);
        }
      };
      return recorder;
    };

    mediaRecorderRef.current = createRecorder();
    mediaRecorderRef.current.start();
    speechDetectedInChunkRef.current = false;
    setIsListening(true);

    intervalRef.current = setInterval(() => {
      if (!isVoiceActiveRef.current) return;
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
        setTimeout(() => {
          if (stream.active) {
            try {
              speechDetectedInChunkRef.current = false;
              mediaRecorderRef.current = createRecorder();
              mediaRecorderRef.current.start();
            } catch { }
          }
        }, 50);
      }
    }, 4000);
  }, [transcribeChunk]);

  const stopTranscription = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (vadIntervalRef.current) { clearInterval(vadIntervalRef.current); vadIntervalRef.current = null; }
    if (mediaRecorderRef.current?.state !== "inactive") { try { mediaRecorderRef.current?.stop(); } catch { } }
    mediaRecorderRef.current = null;
    if (audioContextRef.current) { try { audioContextRef.current.close(); } catch { } audioContextRef.current = null; }
    analyserRef.current = null;
    chunksRef.current = [];
    setIsListening(false);
    setIsSpeechDetected(false);
  }, []);

  const handleToggleAI = useCallback(() => {
    setAiEnabled(prev => !prev);
  }, []);

  const currentMember = members.find(m => m.id === user?.id);
  const memberName = currentMember ? `${currentMember.name} ${currentMember.surname?.charAt(0) || ""}.` : "Você";

  const handleAccept = async () => {
    if (myParticipant) {
      await supabase.from("meeting_participants").update({ status: "accepted", responded_at: new Date().toISOString() } as any).eq("id", myParticipant.id);
    } else if (meeting?.id && user?.id) {
      await supabase.from("meeting_participants").insert({ meeting_id: meeting.id, user_id: user.id, status: "accepted", responded_at: new Date().toISOString() } as any);
    }
    toast.success("Convite aceito!");
    setInLobby(false);
  };

  const handleDecline = async () => {
    if (myParticipant) {
      await supabase.from("meeting_participants").update({ status: "declined", responded_at: new Date().toISOString() } as any).eq("id", myParticipant.id);
    }
    toast("Convite recusado");
    navigate("/meetings");
  };

  const handleReschedule = async () => {
    if (!rescheduleDate) { toast.error("Selecione uma data"); return; }
    if (myParticipant) {
      await supabase.from("meeting_participants").update({
        status: "reschedule_requested",
        responded_at: new Date().toISOString(),
        suggested_date: rescheduleDate,
        suggested_time: rescheduleTime || null,
      } as any).eq("id", myParticipant.id);
    }
    // Notify the creator
    if (meeting?.created_by && currentMember) {
      await supabase.from("notifications").insert({
        user_id: meeting.created_by,
        type: "meeting_reschedule",
        title: "📅 Solicitação de remarcação",
        body: `${currentMember.name} pediu para remarcar "${meeting.title}" para ${rescheduleDate}${rescheduleTime ? " às " + rescheduleTime : ""}`,
        link: `/meetings/${code}`,
      } as any);
    }
    toast.success("Solicitação de remarcação enviada!");
    setRescheduleOpen(false);
    navigate("/meetings");
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ---- LOBBY SCREEN ----
  if (inLobby) {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: "Pendente", color: "text-[hsl(var(--warning))]" },
      accepted: { label: "Aceito", color: "text-[hsl(var(--success))]" },
      declined: { label: "Recusado", color: "text-destructive" },
      reschedule_requested: { label: "Remarcação", color: "text-primary" },
    };

    return (
      <div className="h-full flex items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg"
        >
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-primary/5 border-b border-border px-6 py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Video className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{meeting?.title}</h2>
                  {meeting?.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{meeting.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {meeting?.date}</span>
                {meeting?.start_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {meeting.start_time}</span>}
                {creatorMember && (
                  <span className="flex items-center gap-1">
                    Criado por {creatorMember.name}
                  </span>
                )}
              </div>
            </div>

            {/* Participants */}
            {participants.length > 0 && (
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Convidados</h3>
                <div className="space-y-2">
                  {participants.map((p: any) => {
                    const member = members.find(m => m.id === p.user_id);
                    const st = statusMap[p.status] || statusMap.pending;
                    return (
                      <div key={p.id} className="flex items-center gap-2.5">
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={member?.avatar_url || ""} />
                          <AvatarFallback className="text-[10px]">{(member?.name || "?")[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground flex-1">{member?.name} {member?.surname}</span>
                        <span className={cn("text-[10px] font-medium", st.color)}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-6 py-5 space-y-3">
              <div className="flex gap-2">
                <Button onClick={handleAccept} className="flex-1 gap-2">
                  <Check className="w-4 h-4" /> Aceitar e entrar
                </Button>
                <Button variant="destructive" onClick={handleDecline} className="gap-2">
                  <X className="w-4 h-4" /> Recusar
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  setRescheduleDate(meeting?.date || "");
                  setRescheduleTime(meeting?.start_time?.slice(0, 5) || "");
                  setRescheduleOpen(true);
                }}
              >
                <CalendarClock className="w-4 h-4" /> Sugerir remarcação
              </Button>
              {meeting?.created_by === user?.id && (
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-muted-foreground"
                  onClick={() => setInLobby(false)}
                >
                  <ArrowRight className="w-4 h-4" /> Entrar direto (criador)
                </Button>
              )}
            </div>
          </div>

          {/* Reschedule Dialog */}
          <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Sugerir nova data</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Data</Label>
                  <Input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Horário (opcional)</Label>
                  <Input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} />
                </div>
                <Button onClick={handleReschedule} className="w-full">Enviar sugestão</Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top bar */}
      <div className="h-12 px-4 flex items-center border-b border-border shrink-0">
        <h3 className="text-sm font-medium text-foreground flex-1">{meeting?.title}</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/meetings/${code}`);
              toast.success("Link copiado!");
            }}
          >
            <Copy className="w-3.5 h-3.5" /> Copiar link
          </Button>
          {aiEnabled && (
            <div className="flex items-center gap-1.5 ml-2">
              <Bot className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] text-primary font-medium">IA ativa</span>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Video area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-4 flex items-center justify-center gap-4 relative">
            {/* Screen share (main view) */}
            {screenOn ? (
              <div className="flex-1 h-full relative rounded-xl overflow-hidden bg-card border border-border">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 bg-background/80 backdrop-blur rounded-md px-2 py-1 text-[10px] text-foreground flex items-center gap-1.5">
                  <Monitor className="w-3 h-3" /> Compartilhando tela
                </div>
                {/* PiP local video */}
                <div className="absolute bottom-4 right-4 w-48 aspect-video rounded-lg overflow-hidden border-2 border-border shadow-lg">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn("w-full h-full object-cover", !camOn && "hidden")}
                  />
                  {!camOn && (
                    <div className="w-full h-full bg-card flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                        {memberName.charAt(0)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Normal camera view */
              <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden bg-card border border-border relative">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn("w-full h-full object-cover", !camOn && "hidden")}
                />
                {!camOn && (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">{memberName.charAt(0)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{memberName}</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur rounded-md px-2 py-1 text-[10px] text-foreground">
                  {memberName}
                </div>
                {isSpeechDetected && (
                  <div className="absolute inset-0 border-2 border-primary/50 rounded-xl pointer-events-none" />
                )}
              </div>
            )}
          </div>

          {/* Controls bar */}
          <div className="h-16 px-4 flex items-center justify-center gap-3 border-t border-border shrink-0">
            <Button
              variant={micOn ? "secondary" : "destructive"}
              size="icon"
              className="rounded-full w-11 h-11"
              onClick={toggleMic}
            >
              {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>

            <Button
              variant={camOn ? "secondary" : "destructive"}
              size="icon"
              className="rounded-full w-11 h-11"
              onClick={toggleCam}
            >
              {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>

            <Button
              variant={screenOn ? "default" : "secondary"}
              size="icon"
              className="rounded-full w-11 h-11"
              onClick={toggleScreen}
            >
              {screenOn ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </Button>

            <Button
              variant={aiEnabled ? "default" : "secondary"}
              size="icon"
              className="rounded-full w-11 h-11"
              onClick={handleToggleAI}
            >
              <Bot className="w-5 h-5" />
            </Button>

            <Button
              variant={showChat ? "default" : "secondary"}
              size="icon"
              className="rounded-full w-11 h-11"
              onClick={() => setShowChat(prev => !prev)}
            >
              <MessageSquare className="w-5 h-5" />
            </Button>

            <div className="w-px h-8 bg-border mx-2" />

            <Button
              variant="destructive"
              size="icon"
              className="rounded-full w-11 h-11"
              onClick={handleLeave}
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Chat sidebar */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-border shrink-0 flex flex-col min-w-0 overflow-hidden"
            >
              <ChatArea
                roomId={null}
                roomName={meeting?.title || "Reunião"}
                aiEnabled={aiEnabled}
                boardId={boardId}
                isListening={isListening}
                isSpeechDetected={isSpeechDetected}
                transcriptionEntries={transcriptionEntries}
                onAiSpeakingChange={setAiSpeaking}
                onClearHistory={() => setTranscriptionEntries([])}
                onAiResponse={(text) => {
                  lastAiResponsesRef.current = [...lastAiResponsesRef.current.slice(-4), text];
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
