import { useState } from "react";
import RoomList from "@/components/office/RoomList";
import ChatArea from "@/components/office/ChatArea";
import MemberList from "@/components/office/MemberList";
import { useVoiceConnection, mockRooms, type Room } from "@/contexts/VoiceConnectionContext";

export default function OfficePage() {
  const { connect, connectedRoom } = useVoiceConnection();
  const [selectedRoom, setSelectedRoom] = useState<Room>(mockRooms[0]);

  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room);
    if (room.type !== "text") {
      connect(room);
    }
  };

  return (
    <div className="flex h-full">
      <RoomList
        rooms={mockRooms}
        activeRoomId={selectedRoom.id}
        onSelectRoom={handleSelectRoom}
      />
      <ChatArea room={selectedRoom} />
      <MemberList room={selectedRoom} />
    </div>
  );
}
