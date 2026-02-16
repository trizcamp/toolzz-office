import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useVoiceConnection, type MockUser, type Room } from "@/contexts/VoiceConnectionContext";
import { useToast } from "@/hooks/use-toast";

interface VoiceParticipantsProps {
  room: Room;
}

export default function VoiceParticipants({ room }: VoiceParticipantsProps) {
  const { connectedRoom, currentUser } = useVoiceConnection();
  const { toast } = useToast();
  const [aiEnabled, setAiEnabled] = useState(false);
  const isConnectedHere = connectedRoom?.id === room.id;

  const members: MockUser[] = isConnectedHere
    ? [...room.connectedUsers, { ...currentUser, isSpeaking: false }]
    : room.connectedUsers;

  const handleEnableAI = () => {
    setAiEnabled(true);
    toast({
      title: "IA habilitada",
      description: "A IA está transcrevendo esta reunião em tempo real.",
    });
  };

  if (members.length === 0 && !isConnectedHere) return null;

  return (
    <div className="border-b border-border px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Participantes — {members.length}
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={aiEnabled ? "default" : "outline"}
              className="h-7 gap-1.5 text-xs"
              onClick={handleEnableAI}
              disabled={aiEnabled}
            >
              {aiEnabled ? <Sparkles className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              {aiEnabled ? "IA Ativa" : "Habilitar IA"}
              {aiEnabled && <Badge variant="secondary" className="ml-1 text-[9px] px-1 py-0">Transcrevendo</Badge>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {aiEnabled
              ? "A IA está transcrevendo a chamada em tempo real"
              : "Habilite a IA para transcrever automaticamente esta reunião"}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex flex-wrap gap-3">
        {members.map((user) => (
          <div key={user.id} className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0",
                user.isSpeaking && "ring-2 animate-pulse"
              )}
              style={user.isSpeaking ? { "--tw-ring-color": "hsl(var(--success))" } as React.CSSProperties : undefined}
            >
              {user.name.charAt(0)}
            </div>
            <span className="text-sm text-secondary-foreground">{user.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
