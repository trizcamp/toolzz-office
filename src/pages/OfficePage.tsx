import { useState, useCallback, useEffect, useRef } from "react";
import { Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoomList from "@/components/office/RoomList";
import ChatArea from "@/components/office/ChatArea";
import MemberList from "@/components/office/MemberList";
import VoiceParticipants from "@/components/office/VoiceParticipants";
import TranscriptionPanel from "@/components/office/TranscriptionPanel";
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
  const [transcriptionEnabled, setTranscriptionEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcriptionEntries, setTranscriptionEntries] = useState<{ id: string; speaker: string; text: string; time: string }[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const transcriptionEnabledRef = useRef(false);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0] || null;
  const boardId = boards?.[0]?.id || null;

  // Keep ref in sync
  useEffect(() => { transcriptionEnabledRef.current = transcriptionEnabled; }, [transcriptionEnabled]);

  // Reset transcription when room changes
  useEffect(() => {
    stopTranscription();
    setTranscriptionEnabled(false);
    setTranscriptionEntries([]);
    setIsListening(false);
  }, [selectedRoomId]);

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
    if (blob.size < 1000) return; // skip tiny chunks
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
      if (text && text.length > 0) {
        const now = new Date();
        const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        setTranscriptionEntries((prev) => [
          ...prev,
          { id: `t-${Date.now()}`, speaker: "Você", text, time },
        ]);
      }
    } catch (e) {
      console.error("Failed to transcribe chunk:", e);
    }
  }, []);

  const startTranscription = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        // Process accumulated chunks
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          chunksRef.current = [];
          transcribeChunk(blob);
        }
      };

      // Start recording
      recorder.start();
      setIsListening(true);

      // Every 5 seconds, stop and restart to get a chunk
      intervalRef.current = setInterval(() => {
        if (!transcriptionEnabledRef.current) return;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          // Restart after a small delay
          setTimeout(() => {
            if (transcriptionEnabledRef.current && streamRef.current && streamRef.current.active) {
              try {
                const newRecorder = new MediaRecorder(streamRef.current, { mimeType });
                chunksRef.current = [];
                newRecorder.ondataavailable = (e) => {
                  if (e.data.size > 0) chunksRef.current.push(e.data);
                };
                newRecorder.onstop = () => {
                  if (chunksRef.current.length > 0) {
                    const blob = new Blob(chunksRef.current, { type: mimeType });
                    chunksRef.current = [];
                    transcribeChunk(blob);
                  }
                };
                mediaRecorderRef.current = newRecorder;
                newRecorder.start();
              } catch {}
            }
          }, 100);
        }
      }, 5000);

    } catch (e) {
      console.error("Failed to access microphone:", e);
      toast({ title: "Microfone bloqueado", description: "Permita o acesso ao microfone nas configurações do navegador.", variant: "destructive" });
      setTranscriptionEnabled(false);
      setIsListening(false);
    }
  }, [transcribeChunk, toast]);

  // Manage transcription lifecycle
  useEffect(() => {
    if (transcriptionEnabled) {
      startTranscription();
    } else {
      stopTranscription();
    }
    return () => { stopTranscription(); };
  }, [transcriptionEnabled]);

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

  const handleToggleTranscription = useCallback(() => {
    if (transcriptionEnabled) {
      setTranscriptionEnabled(false);
      toast({ title: "Transcrição pausada", description: "A transcrição foi salva." });
    } else {
      setTranscriptionEnabled(true);
      toast({ title: "Transcrição ativa", description: "O áudio da reunião está sendo transcrito." });
    }
  }, [transcriptionEnabled, toast]);

  const handleClearTranscription = useCallback(() => {
    setTranscriptionEntries([]);
    toast({ title: "Transcrição limpa" });
  }, [toast]);

  const isVoiceRoom = selectedRoom?.type !== "text";
  const showTranscriptionPanel = transcriptionEnabled && isVoiceRoom;

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
            transcriptionEnabled={transcriptionEnabled}
            isListening={isListening}
            onToggleAI={handleToggleAI}
            onToggleTranscription={handleToggleTranscription}
          />
        )}
        <div className="flex-1 flex min-w-0">
          <ChatArea
            roomId={selectedRoom.id}
            roomName={selectedRoom.name}
            aiEnabled={aiEnabled}
            boardId={boardId}
            onAiSpeakingChange={setAiSpeaking}
          />
          {showTranscriptionPanel && (
            <div className="w-[360px] shrink-0 flex flex-col">
              <TranscriptionPanel
                entries={transcriptionEntries}
                isListening={isListening}
                onClear={handleClearTranscription}
                onClose={() => {
                  setTranscriptionEnabled(false);
                  toast({ title: "Transcrição pausada" });
                }}
              />
            </div>
          )}
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
