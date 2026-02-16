import { useState } from "react";
import TaskCard from "./TaskCard";
import type { Task, TaskStatus } from "@/data/mockTasks";
import { statusLabels } from "@/data/mockTasks";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onMoveTask: (taskId: string, direction: "left" | "right") => void;
  onDropTask: (taskId: string, newStatus: TaskStatus) => void;
  onSelectTask: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  allStatuses: TaskStatus[];
  isAdmin?: boolean;
  typeLabels?: Record<string, string>;
  typeColors?: Record<string, string>;
}

export default function KanbanColumn({ status, tasks, onMoveTask, onDropTask, onSelectTask, onDeleteTask, allStatuses, isAdmin, typeLabels, typeColors }: KanbanColumnProps) {
  const idx = allStatuses.indexOf(status);
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={cn(
        "flex-1 min-w-[220px] max-w-[280px] rounded-lg transition-colors p-1",
        isDragOver && "bg-primary/5 ring-1 ring-primary/20"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const taskId = e.dataTransfer.getData("taskId");
        if (taskId) onDropTask(taskId, status);
      }}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <h3 className="text-xs font-semibold text-foreground">{statusLabels[status]}</h3>
        <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onMoveLeft={idx > 0 ? () => onMoveTask(task.id, "left") : undefined}
            onMoveRight={idx < allStatuses.length - 1 ? () => onMoveTask(task.id, "right") : undefined}
            onClick={() => onSelectTask(task)}
            onDelete={onDeleteTask ? () => onDeleteTask(task.id) : undefined}
            isAdmin={isAdmin}
            typeLabels={typeLabels}
            typeColors={typeColors}
          />
        ))}
      </div>
    </div>
  );
}
