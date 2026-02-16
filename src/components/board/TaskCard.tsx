import { useState } from "react";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Task } from "@/data/mockTasks";
import { priorityLabels, defaultTypeLabels, defaultTypeColors } from "@/data/mockTasks";

const priorityIcons: Record<string, { color: string; icon: string }> = {
  critical: { color: "text-destructive", icon: "🔴" },
  high: { color: "text-[hsl(var(--warning))]", icon: "🟠" },
  medium: { color: "text-primary", icon: "🔵" },
  low: { color: "text-muted-foreground", icon: "⚪" },
};

interface TaskCardProps {
  task: Task;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onClick?: () => void;
  showMoveButtons?: boolean;
  typeLabels?: Record<string, string>;
  typeColors?: Record<string, string>;
}

export default function TaskCard({ task, onMoveLeft, onMoveRight, onClick, showMoveButtons = true, typeLabels = defaultTypeLabels, typeColors = defaultTypeColors }: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const typeLabel = typeLabels[task.type] || task.type;
  const typeColor = typeColors[task.type] || "bg-muted text-muted-foreground";

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("taskId", task.id); setIsDragging(true); }}
      onDragEnd={() => setIsDragging(false)}
      onClick={onClick}
      className={cn(
        "bg-card border border-border rounded-lg p-3 space-y-2 hover:border-muted-foreground/30 transition-all cursor-pointer",
        isDragging && "opacity-40"
      )}
    >
      {/* Header: ID + Type badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border-0", typeColor)}>
            {task.type === "feature" ? "🚀" : task.type === "bug" ? "🐛" : task.type === "improvement" ? "⚡" : "📋"} {typeLabel}
          </Badge>
          <span className="text-[9px] font-mono text-muted-foreground">{task.id}</span>
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
          <div className="flex -space-x-1">
            {task.assignees.slice(0, 3).map((a) => (
              <div key={a.id} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground border border-card">
                {a.name.charAt(0)}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[8px] font-medium text-muted-foreground border border-card">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
