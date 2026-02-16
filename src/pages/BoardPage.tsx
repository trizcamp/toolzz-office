import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { mockTasks, statusLabels, priorityLabels, typeLabels, type Task, type TaskStatus } from "@/data/mockTasks";
import KanbanColumn from "@/components/board/KanbanColumn";
import TaskFilters from "@/components/board/TaskFilters";
import PriorityPokerCard from "@/components/board/PriorityPokerCard";
import BoardReport from "@/components/board/BoardReport";
import NewTaskDialog from "@/components/board/NewTaskDialog";
import TaskDetailPanel from "@/components/board/TaskDetailPanel";
import { AnimatePresence } from "framer-motion";

const allStatuses: TaskStatus[] = ["backlog", "todo", "in_progress", "review", "done"];

const priorityColors: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive",
  high: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]",
  medium: "bg-primary/20 text-primary",
  low: "bg-muted text-muted-foreground",
};

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const assignees = useMemo(() => [...new Set(tasks.map((t) => t.assignee.name))], [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (assigneeFilter !== "all" && t.assignee.name !== assigneeFilter) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      return true;
    });
  }, [tasks, assigneeFilter, typeFilter]);

  const moveTask = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const moveTaskDirection = (taskId: string, direction: "left" | "right") => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const idx = allStatuses.indexOf(t.status);
        const newIdx = direction === "left" ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= allStatuses.length) return t;
        return { ...t, status: allStatuses[newIdx] };
      })
    );
  };

  const handleCreateTask = (partial: Partial<Task>) => {
    const newTask: Task = {
      id: `TOZ-${111 + tasks.length}`,
      title: partial.title || "Nova tarefa",
      description: partial.description || "",
      status: partial.status || "todo",
      priority: "medium",
      assignee: partial.assignee || { id: "1", name: "Beatriz F." },
      type: "task",
      points: 0,
      votes: [],
      createdAt: new Date().toISOString().split("T")[0],
    };
    setTasks([newTask, ...tasks]);
  };

  const handleUpdateTask = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <h1 className="text-lg font-semibold text-foreground">Esteira</h1>
          <Button size="sm" className="gap-1.5 btn-gradient" onClick={() => setNewTaskOpen(true)}>
            <Plus className="w-4 h-4" /> Nova Tarefa
          </Button>
        </div>

        <Tabs defaultValue="kanban" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-3 shrink-0">
            <TabsList>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="list">Lista</TabsTrigger>
              <TabsTrigger value="report">Relatório</TabsTrigger>
              <TabsTrigger value="priority">Poker</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="kanban" className="flex-1 overflow-x-auto px-6 py-4">
            <div className="flex gap-4 min-w-max">
              {allStatuses.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={tasks.filter((t) => t.status === status)}
                  onMoveTask={moveTaskDirection}
                  onDropTask={moveTask}
                  onSelectTask={setSelectedTask}
                  allStatuses={allStatuses}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list" className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <TaskFilters
              assigneeFilter={assigneeFilter}
              typeFilter={typeFilter}
              onAssigneeChange={setAssigneeFilter}
              onTypeChange={setTypeFilter}
              assignees={assignees}
            />
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Título</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Prioridade</TableHead>
                    <TableHead className="text-xs">Responsável</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow
                      key={task.id}
                      className="cursor-pointer hover:bg-surface-hover"
                      onClick={() => setSelectedTask(task)}
                    >
                      <TableCell className="text-xs font-mono text-muted-foreground">{task.id}</TableCell>
                      <TableCell className="text-sm">{task.title}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{statusLabels[task.status]}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={cn("text-[10px] border-0", priorityColors[task.priority])}>{priorityLabels[task.priority]}</Badge></TableCell>
                      <TableCell className="text-sm">{task.assignee.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{typeLabels[task.type]}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{task.createdAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="report" className="flex-1 overflow-y-auto px-6 py-4">
            <BoardReport tasks={tasks} />
          </TabsContent>

          <TabsContent value="priority" className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <PriorityPokerCard
                  key={task.id}
                  task={task}
                  onDelete={() => handleDeleteTask(task.id)}
                  onUpdate={handleUpdateTask}
                  onSelect={() => setSelectedTask(task)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Task detail panel */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailPanel
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdate={handleUpdateTask}
          />
        )}
      </AnimatePresence>

      <NewTaskDialog
        open={newTaskOpen}
        onOpenChange={setNewTaskOpen}
        onCreateTask={handleCreateTask}
        existingTasks={tasks}
      />
    </div>
  );
}
