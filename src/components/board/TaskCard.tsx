import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Task } from "@/data/mockTasks";

const priorityColors: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive",
  high: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]",
  medium: "bg-primary/20 text-primary",
  low: "bg-muted text-muted-foreground",
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
    <div className="bg-card border border-border rounded-lg p-3 space-y-2.5 hover:border-muted-foreground/30 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground font-mono">{task.id}</span>
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border-0", typeColors[task.type])}>
          {task.type}
        </Badge>
      </div>
      <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border-0", priorityColors[task.priority])}>
          {task.priority}
        </Badge>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground">
            {task.assignee.name.charAt(0)}
          </div>
        </div>
      </div>
      {showMoveButtons && (
        <div className="flex gap-1 pt-1">
          {onMoveLeft && (
            <button onClick={onMoveLeft} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">← Mover</button>
          )}
          {onMoveRight && (
            <button onClick={onMoveRight} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors ml-auto">Mover →</button>
          )}
        </div>
      )}
    </div>
  );
}
