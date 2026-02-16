import { useState, useMemo } from "react";
import { Plus, Phone } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { mockTasks, statusLabels, priorityLabels, typeLabels, type Task, type TaskStatus } from "@/data/mockTasks";
import KanbanColumn from "@/components/board/KanbanColumn";
import TaskFilters from "@/components/board/TaskFilters";
import PriorityPokerCard from "@/components/board/PriorityPokerCard";
import BoardReport from "@/components/board/BoardReport";

const allStatuses: TaskStatus[] = ["backlog", "todo", "in_progress", "review", "done"];

const priorityColors: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive",
  high: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]",
  medium: "bg-primary/20 text-primary",
  low: "bg-muted text-muted-foreground",
};

export default function BoardPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const assignees = useMemo(() => [...new Set(tasks.map((t) => t.assignee.name))], [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (assigneeFilter !== "all" && t.assignee.name !== assigneeFilter) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      return true;
    });
  }, [tasks, assigneeFilter, typeFilter]);

  const moveTask = (taskId: string, direction: "left" | "right") => {
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

  const handleNewTask = () => {
    setNewTaskOpen(false);
    toast({ title: "Iniciando ligação", description: "Conectando você à IA para descrever a nova tarefa..." });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
        <h1 className="text-lg font-semibold text-foreground">Esteira</h1>
        <Button size="sm" className="gap-1.5" onClick={() => setNewTaskOpen(true)}>
          <Plus className="w-4 h-4" /> Nova Tarefa
        </Button>
      </div>

      <Tabs defaultValue="kanban" className="flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-3 shrink-0">
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="report">Relatório</TabsTrigger>
            <TabsTrigger value="priority">Prioridade</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="kanban" className="flex-1 overflow-x-auto px-6 py-4">
          <div className="flex gap-4 min-w-max">
            {allStatuses.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasks.filter((t) => t.status === status)}
                onMoveTask={moveTask}
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
                  <TableRow key={task.id}>
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
              <PriorityPokerCard key={task.id} task={task} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
            <DialogDescription>
              Você será direcionado para uma ligação de voz com IA para descrever a tarefa. A IA criará a tarefa automaticamente com base na sua descrição.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewTaskOpen(false)}>Cancelar</Button>
            <Button onClick={handleNewTask} className="gap-1.5">
              <Phone className="w-4 h-4" /> Iniciar Ligação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
