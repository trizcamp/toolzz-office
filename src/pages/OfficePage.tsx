import { useState, useCallback, useEffect, useRef } from "react";
import { Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoomList from "@/components/office/RoomList";
import ChatArea from "@/components/office/ChatArea";
import MemberList from "@/components/office/MemberList";
import VoiceParticipants from "@/components/office/VoiceParticipants";
import { useRooms, type DbRoom } from "@/hooks/useRooms";
import { useVoiceConnection } from "@/contexts/VoiceConnectionContext";
import { useBoards } from "@/hooks/useBoards";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function OfficePage() {
  const { rooms, isLoading, createRoom, updateRoom, deleteRoom } = useRooms();
  const { connect, connectedRoom } = useVoiceConnection();
  const { boards } = useBoards();
  const { toast } = useToast();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcriptionEntries, setTranscriptionEntries] = useState<{ id: string; speaker: string; text: string; time: string; created_at: string }[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isVoiceActiveRef = useRef(false);
  const aiSpeakingRef = useRef(false);
  const aiStoppedSpeakingAtRef = useRef(0);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0] || null;
  const boardId = boards?.[0]?.id || null;
  const isVoiceRoom = selectedRoom?.type !== "text";

  // Keep ref in sync
  useEffect(() => { isVoiceActiveRef.current = isListening; }, [isListening]);
  useEffect(() => {
    aiSpeakingRef.current = aiSpeaking;
    // Mute/unmute mic tracks while AI is speaking to prevent echo capture
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !aiSpeaking;
      });
    }
    // Track when AI stopped speaking to add buffer period
    if (!aiSpeaking && aiStoppedSpeakingAtRef.current === 0) {
      aiStoppedSpeakingAtRef.current = Date.now();
    }
    if (aiSpeaking) {
      aiStoppedSpeakingAtRef.current = 0;
    }
  }, [aiSpeaking]);

  // Reset when room changes
  useEffect(() => {
    stopTranscription();
    setTranscriptionEntries([]);
    setIsListening(false);
  }, [selectedRoomId]);

  // Auto-start mic when entering a voice room
  useEffect(() => {
    if (isVoiceRoom && selectedRoom && connectedRoom?.id === selectedRoom.id) {
      startTranscription();
    } else {
      stopTranscription();
    }
    return () => { stopTranscription(); };
  }, [isVoiceRoom, selectedRoom?.id, connectedRoom?.id]);

  const stopTranscription = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    mediaRecorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    chunksRef.current = [];
    setIsListening(false);
  }, []);

  const transcribeChunk = useCallback(async (blob: Blob) => {
    // Skip transcription while AI is speaking or within 2s buffer after
    if (aiSpeakingRef.current) return;
    if (aiStoppedSpeakingAtRef.current > 0 && (Date.now() - aiStoppedSpeakingAtRef.current) < 2000) return;
    if (blob.size < 2000) return; // skip very small chunks (likely silence)
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const base64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: { audioBase64: base64, mimeType: blob.type || "audio/webm" },
      });

      if (error) {
        console.error("Transcription error:", error);
        return;
      }

      const text = data?.transcript?.trim();
      // Reject English text (likely TV/background media)
      const isEnglish = /\b(the|is|it's|of|on|and|that|this|with|for|are|was|were|have|has|had|not|but|what|all|can|her|his|from|they|been|one|our|will|would|there|their|about|right|now|just|kind|weird|smell|air|want|more|stuff)\b/i.test(text || "");
      // Strict filter
      if (
        text &&
        text.length >= 10 &&
        !isEnglish &&
        !text.includes("__SILENCE__") &&
        !text.includes("SILENCE") &&
        text.includes(" ") &&
        !/^[.\s,…!?-]+$/.test(text)
      ) {
        const now = new Date();
        const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        setTranscriptionEntries((prev) => [
          ...prev,
          { id: `t-${Date.now()}`, speaker: "Você", text, time, created_at: now.toISOString() },
        ]);
      }
    } catch (e) {
      console.error("Failed to transcribe chunk:", e);
    }
  }, []);

  const startTranscription = useCallback(async () => {
    if (streamRef.current) return; // already started
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";

      const createRecorder = () => {
        const recorder = new MediaRecorder(stream, { mimeType });
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          if (chunksRef.current.length > 0) {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            chunksRef.current = [];
            transcribeChunk(blob);
          }
        };
        return recorder;
      };

      mediaRecorderRef.current = createRecorder();
      mediaRecorderRef.current.start();
      setIsListening(true);

      intervalRef.current = setInterval(() => {
        if (!isVoiceActiveRef.current) return;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          setTimeout(() => {
            if (streamRef.current && streamRef.current.active) {
              try {
                mediaRecorderRef.current = createRecorder();
                mediaRecorderRef.current.start();
              } catch {}
            }
          }, 100);
        }
      }, 5000);

    } catch (e) {
      console.error("Failed to access microphone:", e);
      toast({ title: "Microfone bloqueado", description: "Permita o acesso ao microfone.", variant: "destructive" });
      setIsListening(false);
    }
  }, [transcribeChunk, toast]);

  const handleSelectRoom = (room: DbRoom) => {
    setSelectedRoomId(room.id);
    if (room.type !== "text") {
      connect({ id: room.id, name: room.name, category: room.category, type: room.type, connectedUsers: [] });
    }
  };

  const handleRoomSubmit = (data: { name: string; category: string; type: "voice" | "text" | "hybrid" }, editingRoom: any) => {
    if (editingRoom) {
      updateRoom.mutate({ id: editingRoom.id, ...data });
    } else {
      createRoom.mutate(data);
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    deleteRoom.mutate(roomId);
  };

  const handleToggleAI = useCallback(() => {
    if (aiEnabled) {
      setAiEnabled(false);
      setAiSpeaking(false);
      toast({ title: "IA desabilitada", description: "Reunião salva em 'Reuniões'" });
    } else {
      setAiEnabled(true);
    }
  }, [aiEnabled, toast]);

  const handleClearHistory = useCallback(() => {
    setTranscriptionEntries([]);
  }, []);

  if (isLoading || !selectedRoom) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Carregando salas...</div>;
  }

  return (
    <div className="flex h-full">
      <RoomList
        rooms={rooms.map((r) => ({ ...r, connectedUsers: [] }))}
        activeRoomId={selectedRoom.id}
        onSelectRoom={(r) => handleSelectRoom(rooms.find((rm) => rm.id === r.id)!)}
        onRoomsChange={() => {}}
        onSubmitRoom={handleRoomSubmit}
        onDeleteRoom={handleDeleteRoom}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {isVoiceRoom && (
          <VoiceParticipants
            room={{ ...selectedRoom, connectedUsers: [] }}
            aiEnabled={aiEnabled}
            aiSpeaking={aiSpeaking}
            isListening={isListening}
            onToggleAI={handleToggleAI}
          />
        )}
        <div className="flex-1 flex min-w-0">
          <ChatArea
            roomId={selectedRoom.id}
            roomName={selectedRoom.name}
            aiEnabled={aiEnabled}
            boardId={boardId}
            isListening={isListening}
            transcriptionEntries={transcriptionEntries}
            onAiSpeakingChange={setAiSpeaking}
            onClearHistory={handleClearHistory}
          />
        </div>
      </div>
      {showMembers && <MemberList room={{ ...selectedRoom, connectedUsers: [] }} />}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 self-start mt-3 mr-1 shrink-0"
        onClick={() => setShowMembers(!showMembers)}
      >
        {showMembers ? <ChevronRight className="w-4 h-4" /> : <Users className="w-4 h-4" />}
      </Button>
    </div>
  );
}
