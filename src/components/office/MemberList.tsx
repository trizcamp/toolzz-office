import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { MockUser, Room } from "@/contexts/VoiceConnectionContext";
import { useVoiceConnection } from "@/contexts/VoiceConnectionContext";

interface MemberListProps {
  room: Room;
}

export default function MemberList({ room }: MemberListProps) {
  const { connectedRoom, currentUser } = useVoiceConnection();
  const isConnectedHere = connectedRoom?.id === room.id;

  const members: MockUser[] = isConnectedHere
    ? [...room.connectedUsers, { ...currentUser, isSpeaking: false }]
    : room.connectedUsers;

  return (
    <div className="w-[220px] shrink-0 border-l border-border bg-sidebar overflow-y-auto flex flex-col">
      <div className="px-3 py-3 border-b border-border flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Membros — {members.length}
        </p>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <UserPlus className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="px-2 py-2 space-y-1">
        {members.map((user) => (
          <div key={user.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md">
            <div
              className={cn(
                "w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground shrink-0",
                user.isSpeaking && "ring-2 animate-pulse"
              )}
              style={user.isSpeaking ? { "--tw-ring-color": "hsl(var(--success))" } as React.CSSProperties : undefined}
            >
              {user.name.charAt(0)}
            </div>
            <span className="text-sm text-secondary-foreground truncate">{user.name}</span>
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-xs text-muted-foreground px-2 py-4 text-center">Nenhum membro conectado</p>
        )}
      </div>
    </div>
  );
}
