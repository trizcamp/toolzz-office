import { Bot, Sparkles, MicOff, Mic, Volume2, VolumeX, PhoneOff, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useVoiceConnection, type MockUser, type Room } from "@/contexts/VoiceConnectionContext";
import { useState } from "react";

interface VoiceParticipantsProps {
  room: Room;
  aiEnabled: boolean;
  aiSpeaking?: boolean;
  isListening?: boolean;
  onToggleAI: () => void;
}

export default function VoiceParticipants({ room, aiEnabled, aiSpeaking, isListening, onToggleAI }: VoiceParticipantsProps) {
  const { connectedRoom, currentUser, isMuted, isDeafened, toggleMute, toggleDeafen, disconnect } = useVoiceConnection();
  const [inputDevice, setInputDevice] = useState("default");
  const [outputDevice, setOutputDevice] = useState("default");
  const isConnectedHere = connectedRoom?.id === room.id;

  const members: MockUser[] = isConnectedHere
    ? [...room.connectedUsers, { ...currentUser, isSpeaking: false }]
    : room.connectedUsers;

  const allParticipants = aiEnabled
    ? [...members, { id: "ai-agent", name: "Toolzz IA", avatar: "", isSpeaking: aiSpeaking }]
    : members;

  if (allParticipants.length === 0 && !isConnectedHere) return null;

  return (
    <div className="flex-1 bg-surface/50 flex flex-col items-center justify-center relative min-h-[300px]">
      {/* Top right button */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant={aiEnabled ? "default" : "outline"} className="h-8 gap-1.5 text-xs" onClick={onToggleAI}>
              {aiEnabled ? <Sparkles className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              {aiEnabled ? "Parar IA" : "Habilitar IA"}
              {aiEnabled && (
                <span className="ml-1 text-[9px] px-1.5 py-0 rounded-full font-medium bg-muted text-muted-foreground">
                  Na call
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {aiEnabled ? "Remover a IA da sala" : "Adicionar agente de IA à sala"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Large avatars grid */}
      <div className="flex flex-wrap items-center justify-center gap-8 px-8">
        {allParticipants.map((user) => (
          <div key={user.id} className="flex flex-col items-center gap-2">
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center text-2xl font-semibold transition-all",
              user.id === "ai-agent"
                ? "bg-primary/15 text-primary border-2 border-primary/30"
                : "bg-muted text-muted-foreground",
              user.isSpeaking && user.id === "ai-agent" && "ring-4 ring-primary/40 shadow-[0_0_20px_hsl(var(--primary)/0.3)] animate-pulse",
              user.isSpeaking && user.id !== "ai-agent" && "ring-4 ring-[hsl(var(--success))]/50 shadow-[0_0_20px_hsl(var(--success)/0.3)]"
            )}>
              {user.id === "ai-agent" ? (
                <Bot className="w-10 h-10" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <span className={cn(
              "text-xs",
              user.id === "ai-agent" ? "text-primary font-medium" : "text-secondary-foreground"
            )}>
              {user.name}
            </span>
            {user.isSpeaking && (
              <div className="flex items-center gap-1">
                {user.id === "ai-agent" ? (
                  <>
                    <span className="w-1 h-3 bg-primary rounded-full animate-pulse" />
                    <span className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.1s" }} />
                    <span className="w-1 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                  </>
                ) : (
                  <>
                    <span className="w-1 h-3 bg-[hsl(var(--success))] rounded-full animate-pulse" />
                    <span className="w-1 h-4 bg-[hsl(var(--success))] rounded-full animate-pulse" style={{ animationDelay: "0.1s" }} />
                    <span className="w-1 h-2 bg-[hsl(var(--success))] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Inline voice controls */}
      {isConnectedHere && (
        <div className="mt-6 flex items-center gap-2">
          <Button variant="ghost" size="icon" className={cn(
            "h-9 w-9 rounded-full",
            isListening ? "bg-[hsl(var(--success))]/15 ring-2 ring-[hsl(var(--success))]/40" : "bg-muted"
          )} onClick={toggleMute}>
            {isMuted ? (
              <MicOff className="w-4 h-4 text-destructive" />
            ) : (
              <Mic className={cn("w-4 h-4", isListening && "text-[hsl(var(--success))]")} />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-muted" onClick={toggleDeafen}>
            {isDeafened ? <VolumeX className="w-4 h-4 text-destructive" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20" onClick={disconnect}>
            <PhoneOff className="w-4 h-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-muted">
                <Settings className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 space-y-4">
              <p className="text-sm font-semibold text-foreground">Configurações de Áudio</p>
              <div className="space-y-2">
                <Label className="text-xs">Dispositivo de Entrada (Microfone)</Label>
                <Select value={inputDevice} onValueChange={setInputDevice}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Microfone Padrão</SelectItem>
                    <SelectItem value="headset">Headset USB</SelectItem>
                    <SelectItem value="webcam">Microfone da Webcam</SelectItem>
                    <SelectItem value="bluetooth">Bluetooth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Dispositivo de Saída (Áudio)</Label>
                <Select value={outputDevice} onValueChange={setOutputDevice}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Alto-falantes</SelectItem>
                    <SelectItem value="headphones">Fones de ouvido</SelectItem>
                    <SelectItem value="headset">Headset USB</SelectItem>
                    <SelectItem value="bluetooth">Bluetooth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
