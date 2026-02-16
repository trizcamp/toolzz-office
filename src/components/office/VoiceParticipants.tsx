import { useState } from "react";
import { Bot, Sparkles, MicOff, Mic, Volume2, VolumeX, PhoneOff } from "lucide-react";
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
  const { connectedRoom, currentUser, isMuted, isDeafened, toggleMute, toggleDeafen, disconnect } = useVoiceConnection();
  const { toast } = useToast();
  const [aiEnabled, setAiEnabled] = useState(false);
  const isConnectedHere = connectedRoom?.id === room.id;

  const members: MockUser[] = isConnectedHere
    ? [...room.connectedUsers, { ...currentUser, isSpeaking: false }]
    : room.connectedUsers;

  const handleToggleAI = () => {
    if (aiEnabled) {
      setAiEnabled(false);
      toast({
        title: "IA desabilitada",
        description: "Reunião salva em 'Reuniões'",
      });
    } else {
      setAiEnabled(true);
      toast({
        title: "IA habilitada",
        description: "A IA está transcrevendo esta reunião em tempo real.",
      });
    }
  };

  if (members.length === 0 && !isConnectedHere) return null;

  return (
    <div className="flex-1 bg-surface/50 flex flex-col items-center justify-center relative min-h-[300px]">
      {/* AI Button - top right */}
      <div className="absolute top-4 right-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={aiEnabled ? "default" : "outline"}
              className="h-8 gap-1.5 text-xs"
              onClick={handleToggleAI}
            >
              {aiEnabled ? <Sparkles className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              {aiEnabled ? "Parar IA" : "Habilitar IA"}
              {aiEnabled && <Badge variant="secondary" className="ml-1 text-[9px] px-1 py-0">Transcrevendo</Badge>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {aiEnabled
              ? "Clique para parar a transcrição e salvar a reunião"
              : "Habilite a IA para transcrever automaticamente esta reunião"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Large avatars grid */}
      <div className="flex flex-wrap items-center justify-center gap-8 px-8">
        {members.map((user) => (
          <div key={user.id} className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "w-24 h-24 rounded-full bg-muted flex items-center justify-center text-2xl font-semibold text-muted-foreground transition-all",
                user.isSpeaking && "ring-4 ring-[hsl(var(--success))]/50 shadow-[0_0_20px_hsl(var(--success)/0.3)]"
              )}
            >
              {user.name.charAt(0)}
            </div>
            <span className="text-xs text-secondary-foreground">{user.name}</span>
            {user.isSpeaking && (
              <div className="flex items-center gap-1">
                <span className="w-1 h-3 bg-[hsl(var(--success))] rounded-full animate-pulse" />
                <span className="w-1 h-4 bg-[hsl(var(--success))] rounded-full animate-pulse" style={{ animationDelay: "0.1s" }} />
                <span className="w-1 h-2 bg-[hsl(var(--success))] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Inline voice controls below participants */}
      {isConnectedHere && (
        <div className="mt-6 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-muted"
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="w-4 h-4 text-destructive" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-muted"
            onClick={toggleDeafen}
          >
            {isDeafened ? <VolumeX className="w-4 h-4 text-destructive" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"
            onClick={disconnect}
          >
            <PhoneOff className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
