import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Task } from "@/data/mockTasks";
import { priorityLabels } from "@/data/mockTasks";

const priorityIcons: Record<string, { color: string; icon: string }> = {
  critical: { color: "text-destructive", icon: "🔴" },
  high: { color: "text-[hsl(var(--warning))]", icon: "🟠" },
  medium: { color: "text-primary", icon: "🔵" },
  low: { color: "text-muted-foreground", icon: "⚪" },
};

const typeColors: Record<string, string> = {
  feature: "bg-primary/15 text-primary",
  bug: "bg-destructive/15 text-destructive",
  improvement: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
  task: "bg-muted text-muted-foreground",
};

interface TaskCardProps {
  task: Task;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  showMoveButtons?: boolean;
}

export default function TaskCard({ task, onMoveLeft, onMoveRight, showMoveButtons = true }: TaskCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 space-y-2 hover:border-muted-foreground/30 transition-colors cursor-pointer">
      {/* Header: ID + Type badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border-0", typeColors[task.type])}>
            {task.type === "feature" ? "🚀" : task.type === "bug" ? "🐛" : task.type === "improvement" ? "⚡" : "📋"} {task.id}
          </Badge>
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>

      {/* Footer: priority + date + assignee */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs">{priorityIcons[task.priority].icon}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground">
            {priorityLabels[task.priority]}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Calendar className="w-2.5 h-2.5" /> {task.createdAt}
          </span>
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground">
            {task.assignee.name.charAt(0)}
          </div>
        </div>
      </div>

      {/* Move buttons */}
      {showMoveButtons && (onMoveLeft || onMoveRight) && (
        <div className="flex gap-1 pt-0.5 border-t border-border/50">
          {onMoveLeft && (
            <button onClick={(e) => { e.stopPropagation(); onMoveLeft(); }} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">← Mover</button>
          )}
          {onMoveRight && (
            <button onClick={(e) => { e.stopPropagation(); onMoveRight(); }} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors ml-auto">Mover →</button>
          )}
        </div>
      )}
    </div>
  );
}
