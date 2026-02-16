import { useState } from "react";
import { Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoomList from "@/components/office/RoomList";
import ChatArea from "@/components/office/ChatArea";
import MemberList from "@/components/office/MemberList";
import VoiceParticipants from "@/components/office/VoiceParticipants";
import { useRooms, type DbRoom } from "@/hooks/useRooms";
import { useVoiceConnection } from "@/contexts/VoiceConnectionContext";

export default function OfficePage() {
  const { rooms, isLoading, createRoom, updateRoom, deleteRoom } = useRooms();
  const { connect, connectedRoom } = useVoiceConnection();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0] || null;

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

  const isVoiceRoom = selectedRoom?.type !== "text";

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
        {isVoiceRoom && <VoiceParticipants room={{ ...selectedRoom, connectedUsers: [] }} />}
        <ChatArea roomId={selectedRoom.id} roomName={selectedRoom.name} />
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
