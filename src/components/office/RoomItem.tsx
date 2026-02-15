import { Volume2, Hash, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Room } from "@/contexts/VoiceConnectionContext";

const typeIcons = {
  voice: Volume2,
  text: Hash,
  hybrid: Headphones,
};

interface RoomItemProps {
  room: Room;
  isActive: boolean;
  onSelect: (room: Room) => void;
}

export default function RoomItem({ room, isActive, onSelect }: RoomItemProps) {
  const Icon = typeIcons[room.type];
  const userCount = room.connectedUsers.length;

  return (
    <button
      onClick={() => onSelect(room)}
      className={cn(
        "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors",
        isActive
          ? "bg-accent/20 text-accent-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate flex-1 text-left">{room.name}</span>
      {userCount > 0 && room.type !== "text" && (
        <span className="text-[10px] bg-muted rounded-full px-1.5 py-0.5 text-muted-foreground">
          {userCount}
        </span>
      )}
    </button>
  );
}
