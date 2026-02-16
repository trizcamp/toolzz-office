import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoomItem from "./RoomItem";
import RoomFormDialog from "./RoomFormDialog";
import type { Room, RoomType } from "@/contexts/VoiceConnectionContext";

interface RoomListProps {
  rooms: Room[];
  activeRoomId: string | null;
  onSelectRoom: (room: Room) => void;
  onRoomsChange: (rooms: Room[]) => void;
}

export default function RoomList({ rooms, activeRoomId, onSelectRoom, onRoomsChange }: RoomListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, Room[]>();
    rooms.forEach((r) => {
      const list = map.get(r.category) || [];
      list.push(r);
      map.set(r.category, list);
    });
    return map;
  }, [rooms]);

  const categories = useMemo(() => [...new Set(rooms.map((r) => r.category))], [rooms]);

  const handleSubmit = (data: { name: string; category: string; type: RoomType }) => {
    if (editingRoom) {
      onRoomsChange(rooms.map((r) => r.id === editingRoom.id ? { ...r, ...data } : r));
    } else {
      const newRoom: Room = {
        id: `r${Date.now()}`,
        name: data.name,
        category: data.category,
        type: data.type,
        connectedUsers: [],
      };
      onRoomsChange([...rooms, newRoom]);
    }
    setEditingRoom(null);
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingRoom(null);
    setDialogOpen(true);
  };

  return (
    <div className="w-[220px] shrink-0 border-r border-border bg-sidebar overflow-y-auto flex flex-col">
      <div className="px-3 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-xs font-semibold text-foreground">Salas</h2>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNew}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
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
                  onEdit={handleEdit}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <RoomFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        room={editingRoom}
        onSubmit={handleSubmit}
        categories={categories}
      />
    </div>
  );
}
