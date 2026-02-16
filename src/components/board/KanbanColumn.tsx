import TaskCard from "./TaskCard";
import type { Task, TaskStatus } from "@/data/mockTasks";
import { statusLabels } from "@/data/mockTasks";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onMoveTask: (taskId: string, direction: "left" | "right") => void;
  allStatuses: TaskStatus[];
}

export default function KanbanColumn({ status, tasks, onMoveTask, allStatuses }: KanbanColumnProps) {
  const idx = allStatuses.indexOf(status);

  return (
    <div className="flex-1 min-w-[220px] max-w-[280px]">
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
          />
        ))}
      </div>
    </div>
  );
}
