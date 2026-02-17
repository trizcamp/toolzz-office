import { useState, useCallback } from "react";
import { Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoomList from "@/components/office/RoomList";
import ChatArea from "@/components/office/ChatArea";
import MemberList from "@/components/office/MemberList";
import VoiceParticipants from "@/components/office/VoiceParticipants";
import VoiceAgentPanel from "@/components/office/VoiceAgentPanel";
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
  const [transcriptionEntries, setTranscriptionEntries] = useState<{ id: string; speaker: string; text: string; time: string }[]>([]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0] || null;
  const boardId = boards?.[0]?.id || null;

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
      // Add mock entries to demonstrate the feature
      if (transcriptionEntries.length === 0) {
        const now = new Date();
        const fmt = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        setTranscriptionEntries([
          { id: "t1", speaker: "Beatriz F.", text: "Bom dia pessoal, vamos começar a daily?", time: fmt(new Date(now.getTime() - 120000)) },
          { id: "t2", speaker: "João S.", text: "Bom dia! Ontem terminei a integração com o GitHub e já está funcionando nos testes.", time: fmt(new Date(now.getTime() - 90000)) },
          { id: "t3", speaker: "Rafael M.", text: "Ótimo! Eu vou revisar a PR do módulo de relatórios hoje. Tive que ajustar uns componentes de gráfico.", time: fmt(new Date(now.getTime() - 60000)) },
          { id: "t4", speaker: "Amanda L.", text: "Preciso de ajuda com o layout responsivo da página de documentos, alguém pode dar uma olhada depois?", time: fmt(new Date(now.getTime() - 30000)) },
        ]);
      }
    }
  }, [transcriptionEnabled, toast, transcriptionEntries.length]);

  const isVoiceRoom = selectedRoom?.type !== "text";
  const showRightPanel = (aiEnabled && isVoiceRoom) || (transcriptionEnabled && isVoiceRoom);

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
            onToggleAI={handleToggleAI}
            onToggleTranscription={handleToggleTranscription}
          />
        )}
        <div className="flex-1 flex min-w-0">
          <ChatArea roomId={selectedRoom.id} roomName={selectedRoom.name} />
          {showRightPanel && (
            <div className="w-[360px] shrink-0 flex flex-col">
              {transcriptionEnabled && (
                <div className={aiEnabled ? "h-1/2 border-b border-border" : "flex-1"}>
                  <TranscriptionPanel
                    entries={transcriptionEntries}
                    onClose={() => {
                      setTranscriptionEnabled(false);
                      toast({ title: "Transcrição pausada" });
                    }}
                  />
                </div>
              )}
              {aiEnabled && (
                <div className={transcriptionEnabled ? "h-1/2" : "flex-1"}>
                  <VoiceAgentPanel
                    boardId={boardId}
                    onSpeakingChange={setAiSpeaking}
                    onClose={handleToggleAI}
                  />
                </div>
              )}
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
