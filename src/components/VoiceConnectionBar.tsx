import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceConnection } from "@/contexts/VoiceConnectionContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

interface VoiceConnectionBarProps {
  collapsed?: boolean;
}

export default function VoiceConnectionBar({ collapsed = false }: VoiceConnectionBarProps) {
  const { connectedRoom, isMuted, isDeafened, toggleMute, toggleDeafen, disconnect } =
    useVoiceConnection();

  return (
    <AnimatePresence>
      {connectedRoom && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="px-3 shrink-0"
        >
          <div className="glass rounded-lg p-2 space-y-2">
            {/* Room info */}
            {!collapsed && (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ backgroundColor: "hsl(var(--success))" }} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{connectedRoom.name}</p>
                  <p className="text-[9px] text-muted-foreground">{connectedRoom.category}</p>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className={`flex items-center ${collapsed ? "flex-col gap-1" : "gap-1 justify-center"}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <MicOff className="w-3.5 h-3.5 text-destructive" />
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={toggleDeafen}
              >
                {isDeafened ? (
                  <VolumeX className="w-3.5 h-3.5 text-destructive" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </Button>

              {!collapsed && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Settings className="w-3.5 h-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="right" align="end" className="w-64 space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Volume</p>
                      <Slider defaultValue={[75]} max={100} step={1} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Microfone</p>
                      <p className="text-sm text-foreground">Microfone padrão</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Saída de áudio</p>
                      <p className="text-sm text-foreground">Alto-falante padrão</p>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                onClick={disconnect}
              >
                <PhoneOff className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
