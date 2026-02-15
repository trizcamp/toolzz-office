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

export default function VoiceConnectionBar() {
  const { connectedRoom, isMuted, isDeafened, toggleMute, toggleDeafen, disconnect } =
    useVoiceConnection();

  return (
    <AnimatePresence>
      {connectedRoom && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="glass border-t border-border px-4 py-2 flex items-center gap-3 shrink-0"
        >
          {/* Room info */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ backgroundColor: "hsl(var(--success))" }} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{connectedRoom.name}</p>
              <p className="text-[10px] text-muted-foreground">{connectedRoom.category}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleMute}
            >
              {isMuted ? (
                <MicOff className="w-4 h-4 text-destructive" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleDeafen}
            >
              {isDeafened ? (
                <VolumeX className="w-4 h-4 text-destructive" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="end" className="w-64 space-y-4">
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

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={disconnect}
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          </div>

          {/* User avatar */}
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-medium text-primary-foreground shrink-0">
            V
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
