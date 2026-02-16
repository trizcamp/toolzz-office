import { Volume2, Hash, Headphones, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceConnection, type Room, type MockUser } from "@/contexts/VoiceConnectionContext";

const typeIcons = {
  voice: Volume2,
  text: Hash,
  hybrid: Headphones,
};

interface RoomItemProps {
  room: Room;
  isActive: boolean;
  onSelect: (room: Room) => void;
  onEdit?: (room: Room) => void;
}

export default function RoomItem({ room, isActive, onSelect, onEdit }: RoomItemProps) {
  const { connectedRoom } = useVoiceConnection();
  const Icon = typeIcons[room.type];
  const userCount = room.connectedUsers.length;
  const isConnected = connectedRoom?.id === room.id;

  return (
    <div>
      <button
        onClick={() => onSelect(room)}
        className={cn(
          "group flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors",
          isActive
            ? "bg-accent/20 text-accent-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate flex-1 text-left">{room.name}</span>
        {isConnected && (
          <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse shrink-0" />
        )}
        {userCount > 0 && room.type !== "text" && (
          <span className="text-[10px] bg-muted rounded-full px-1.5 py-0.5 text-muted-foreground">
            {userCount}
          </span>
        )}
        {onEdit && (
          <Settings
            className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); onEdit(room); }}
          />
        )}
      </button>
      {/* Inline participants for voice rooms */}
      {room.type !== "text" && room.connectedUsers.length > 0 && (
        <div className="ml-6 mt-0.5 mb-1 space-y-0.5">
          {room.connectedUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-1.5 px-1 py-0.5">
              <div
                className={cn(
                  "w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-medium text-muted-foreground",
                  user.isSpeaking && "ring-1 ring-[hsl(var(--success))] animate-pulse"
                )}
              >
                {user.name.charAt(0)}
              </div>
              <span className="text-[10px] text-muted-foreground truncate">{user.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
