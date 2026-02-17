import { FileText, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface TranscriptionEntry {
  id: string;
  speaker: string;
  text: string;
  time: string;
}

interface TranscriptionPanelProps {
  entries: TranscriptionEntry[];
  onClose: () => void;
}

export default function TranscriptionPanel({ entries, onClose }: TranscriptionPanelProps) {
  return (
    <div className="flex flex-col h-full border-l border-border bg-card w-full">
      {/* Header */}
      <div className="h-12 px-4 flex items-center gap-2 border-b border-border shrink-0">
        <FileText className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground flex-1">Transcrição</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Transcript content */}
      <ScrollArea className="flex-1 px-4 py-3">
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            A transcrição aparecerá aqui quando alguém falar na sala.
          </p>
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
