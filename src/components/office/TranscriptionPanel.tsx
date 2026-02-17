import { FileText, X, RotateCcw, Mic } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TranscriptionEntry {
  id: string;
  speaker: string;
  text: string;
  time: string;
}

interface TranscriptionPanelProps {
  entries: TranscriptionEntry[];
  isListening?: boolean;
  onClear?: () => void;
  onClose: () => void;
}

export default function TranscriptionPanel({ entries, isListening, onClear, onClose }: TranscriptionPanelProps) {
  return (
    <div className="flex flex-col h-full border-l border-border bg-card w-full">
      {/* Header */}
      <div className="h-12 px-4 flex items-center gap-2 border-b border-border shrink-0">
        <FileText className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground flex-1">Transcrição</h3>
        {isListening && (
          <div className="flex items-center gap-1.5 mr-2">
            <Mic className="w-3 h-3 text-[hsl(var(--success))]" />
            <span className="text-[10px] text-[hsl(var(--success))] font-medium">Ouvindo</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
          </div>
        )}
        {entries.length > 0 && onClear && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear} title="Limpar transcrição">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Transcript content */}
      <ScrollArea className="flex-1 px-4 py-3">
        {entries.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            {isListening ? (
              <>
                <div className="flex items-center justify-center gap-1 mb-3">
                  <span className="w-1 h-3 bg-[hsl(var(--success))] rounded-full animate-pulse" />
                  <span className="w-1 h-4 bg-[hsl(var(--success))] rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                  <span className="w-1 h-2 bg-[hsl(var(--success))] rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
                  <span className="w-1 h-3 bg-[hsl(var(--success))] rounded-full animate-pulse" style={{ animationDelay: "0.45s" }} />
                </div>
                <p className="text-xs text-muted-foreground">Aguardando fala...</p>
                <p className="text-[10px] text-muted-foreground/60">O áudio é transcrito a cada 5 segundos</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">A transcrição aparecerá aqui quando alguém falar na sala.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-foreground">{entry.speaker}</span>
                  <span className="text-[10px] text-muted-foreground">{entry.time}</span>
                </div>
                <p className="text-sm text-secondary-foreground leading-relaxed">{entry.text}</p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
