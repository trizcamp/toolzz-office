import { useMemo } from "react";
import RoomItem from "./RoomItem";
import type { Room } from "@/contexts/VoiceConnectionContext";

interface RoomListProps {
  rooms: Room[];
  activeRoomId: string | null;
  onSelectRoom: (room: Room) => void;
}

export default function RoomList({ rooms, activeRoomId, onSelectRoom }: RoomListProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, Room[]>();
    rooms.forEach((r) => {
      const list = map.get(r.category) || [];
      list.push(r);
      map.set(r.category, list);
    });
    return map;
  }, [rooms]);

  return (
    <div className="w-[220px] shrink-0 border-r border-border bg-sidebar overflow-y-auto flex flex-col">
      <div className="px-3 py-3 border-b border-border">
        <h2 className="text-xs font-semibold text-foreground">Salas</h2>
      </div>
      <div className="flex-1 px-2 py-2 space-y-3">
        {Array.from(grouped.entries()).map(([category, categoryRooms]) => (
          <div key={category}>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 mb-1">
              {category}
            </p>
            <div className="space-y-0.5">
              {categoryRooms.map((room) => (
                <RoomItem
                  key={room.id}
                  room={room}
                  isActive={room.id === activeRoomId}
                  onSelect={onSelectRoom}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
