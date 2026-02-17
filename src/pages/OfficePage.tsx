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
  const recognitionRef = useRef<any>(null);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0] || null;
  const boardId = boards?.[0]?.id || null;

  // Reset transcription when room changes
  useEffect(() => {
    setTranscriptionEnabled(false);
    setTranscriptionEntries([]);
    setIsListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }, [selectedRoomId]);

  // Manage speech recognition when transcription toggles
  useEffect(() => {
    if (!transcriptionEnabled) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Navegador não suporta transcrição", description: "Use Chrome ou Edge para transcrição em tempo real.", variant: "destructive" });
      setTranscriptionEnabled(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          if (text) {
            const now = new Date();
            const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            setTranscriptionEntries((prev) => [
              ...prev,
              { id: `t-${Date.now()}-${i}`, speaker: "Você", text, time },
            ]);
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast({ title: "Microfone bloqueado", description: "Permita o acesso ao microfone nas configurações do navegador.", variant: "destructive" });
        setTranscriptionEnabled(false);
      }
      // For "no-speech" or "aborted", just restart
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if still enabled
      if (transcriptionEnabled && recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch {}
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
    }

    return () => {
      try { recognition.stop(); } catch {}
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };
  }, [transcriptionEnabled, toast]);

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
