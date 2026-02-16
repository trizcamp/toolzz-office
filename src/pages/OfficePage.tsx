import { useState } from "react";
import { Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoomList from "@/components/office/RoomList";
import ChatArea from "@/components/office/ChatArea";
import MemberList from "@/components/office/MemberList";
import VoiceParticipants from "@/components/office/VoiceParticipants";
import { useVoiceConnection, mockRooms, type Room } from "@/contexts/VoiceConnectionContext";

export default function OfficePage() {
  const { connect, connectedRoom } = useVoiceConnection();
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [selectedRoom, setSelectedRoom] = useState<Room>(mockRooms[0]);
  const [showMembers, setShowMembers] = useState(false);

  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room);
    if (room.type !== "text") {
      connect(room);
    }
  };

  const isVoiceRoom = selectedRoom.type !== "text";

  return (
    <div className="flex h-full">
      <RoomList
        rooms={rooms}
        activeRoomId={selectedRoom.id}
        onSelectRoom={handleSelectRoom}
        onRoomsChange={setRooms}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {isVoiceRoom && <VoiceParticipants room={selectedRoom} />}
        <ChatArea room={selectedRoom} />
      </div>
      {showMembers && <MemberList room={selectedRoom} />}
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
