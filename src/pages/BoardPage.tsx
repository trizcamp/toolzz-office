import { useState, useMemo } from "react";
import { Plus, LayoutGrid, ArrowLeft, Mic, MessageSquare, Sparkles, Pencil, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { mockTasks, statusLabels, priorityLabels, defaultTypeLabels, defaultTypeColors, type Task, type TaskStatus } from "@/data/mockTasks";
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

interface BoardDef {
  id: string;
  name: string;
  sector: string;
  icon: string;
}

const defaultBoards: BoardDef[] = [
  { id: "board-produto", name: "Produto", sector: "Produto", icon: "🚀" },
  { id: "board-marketing", name: "Marketing", sector: "Marketing", icon: "📢" },
  { id: "board-comercial", name: "Comercial", sector: "Comercial", icon: "💼" },
];

const sectorTemplates = [
  { sector: "Produto", icon: "🚀", description: "Kanban para equipes de produto com foco em features e bugs." },
  { sector: "Marketing", icon: "📢", description: "Gestão de campanhas, conteúdo e ações de marketing." },
  { sector: "Comercial", icon: "💼", description: "Pipeline de vendas, leads e acompanhamento comercial." },
];

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [boards, setBoards] = useState<BoardDef[]>(defaultBoards);
  const [newBoardOpen, setNewBoardOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardSector, setNewBoardSector] = useState("");
  const [typeLabelsState, setTypeLabelsState] = useState<Record<string, string>>({ ...defaultTypeLabels });
  const [typeColorsState, setTypeColorsState] = useState<Record<string, string>>({ ...defaultTypeColors });
  const [fullscreenDoc, setFullscreenDoc] = useState(false);
  const [editingBoard, setEditingBoard] = useState<string | null>(null);
  const [editBoardName, setEditBoardName] = useState("");
  const [deleteBoardId, setDeleteBoardId] = useState<string | null>(null);

  const assignees = useMemo(() => {
    const names = new Set<string>();
    tasks.forEach((t) => t.assignees.forEach((a) => names.add(a.name)));
    return [...names];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (assigneeFilter !== "all" && !t.assignees.some((a) => a.name === assigneeFilter)) return false;
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
      assignees: partial.assignees || [{ id: "1", name: "Beatriz F." }],
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

  const handleCreateBoard = () => {
    if (!newBoardName.trim() || !newBoardSector) return;
    const template = sectorTemplates.find((s) => s.sector === newBoardSector);
    const newBoard: BoardDef = {
      id: `board-${Date.now()}`,
      name: newBoardName,
      sector: newBoardSector,
      icon: template?.icon || "📋",
    };
    setBoards([...boards, newBoard]);
    setNewBoardOpen(false);
    setNewBoardName("");
    setNewBoardSector("");
    setSelectedBoard(newBoard.id);
  };

  const handleAddType = (name: string, color: string) => {
    const key = name.toLowerCase().replace(/\s+/g, "_");
    setTypeLabelsState((prev) => ({ ...prev, [key]: name }));
    setTypeColorsState((prev) => ({ ...prev, [key]: color }));
  };

  const handleRenameBoard = (boardId: string) => {
    if (!editBoardName.trim()) return;
    setBoards((prev) => prev.map((b) => b.id === boardId ? { ...b, name: editBoardName.trim() } : b));
    setEditingBoard(null);
    setEditBoardName("");
  };

  const handleDeleteBoard = (boardId: string) => {
    setBoards((prev) => prev.filter((b) => b.id !== boardId));
    setDeleteBoardId(null);
  };

  // Board overview
  if (!selectedBoard) {
    const currentBoard = boards.find((b) => b.id === "board-produto");
    return (
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <h1 className="text-lg font-semibold text-foreground">Central de Tarefas</h1>
          <Button size="sm" className="gap-1.5 btn-gradient" onClick={() => setNewBoardOpen(true)}>
            <Plus className="w-4 h-4" /> Nova Central
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => {
              const boardTasks = tasks;
              const done = boardTasks.filter((t) => t.status === "done").length;
              const progress = boardTasks.length > 0 ? Math.round((done / boardTasks.length) * 100) : 0;

              return (
                <div
                  key={board.id}
                  className="bg-card border border-border rounded-xl p-5 space-y-3 text-left hover:border-muted-foreground/30 transition-all relative group/card"
                >
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingBoard(board.id); setEditBoardName(board.name); }}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-hover text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteBoardId(board.id); }}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedBoard(board.id)}
                    className="w-full text-left space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{board.icon}</span>
                      <div>
                        {editingBoard === board.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editBoardName}
                              onChange={(e) => setEditBoardName(e.target.value)}
                              className="h-6 text-sm px-1 w-32"
                              autoFocus
                              onKeyDown={(e) => { if (e.key === "Enter") handleRenameBoard(board.id); if (e.key === "Escape") setEditingBoard(null); }}
                            />
                            <Button size="sm" variant="ghost" className="h-6 px-1 text-xs" onClick={() => handleRenameBoard(board.id)}>OK</Button>
                          </div>
                        ) : (
                          <h3 className="text-sm font-semibold text-foreground">{board.name}</h3>
                        )}
                        <p className="text-[10px] text-muted-foreground">{board.sector}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{boardTasks.length} tarefas</span>
                        <span>{progress}% concluído</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* New Board Dialog */}
        <Dialog open={newBoardOpen} onOpenChange={setNewBoardOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Nova Central de Tarefas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome da Central</Label>
                <Input
                  placeholder="Ex: Sprint Q1 2025"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo por Setor</Label>
                <div className="grid gap-2">
                  {sectorTemplates.map((t) => (
                    <button
                      key={t.sector}
                      onClick={() => setNewBoardSector(t.sector)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                        newBoardSector === t.sector
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-surface-hover"
                      )}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.sector}</p>
                        <p className="text-[10px] text-muted-foreground">{t.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full btn-gradient" onClick={handleCreateBoard} disabled={!newBoardName.trim() || !newBoardSector}>
                Criar Central
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Board Confirmation */}
        <AlertDialog open={!!deleteBoardId} onOpenChange={(open) => !open && setDeleteBoardId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar Central de Tarefas</AlertDialogTitle>
              <AlertDialogDescription>
                <span className="text-destructive font-semibold">Atenção: esta ação não pode ser desfeita!</span>
                <br />
                Todas as tarefas vinculadas a esta central serão perdidas permanentemente. Tem certeza que deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteBoardId && handleDeleteBoard(deleteBoardId)}
              >
                Apagar permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedBoard(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">
              {boards.find((b) => b.id === selectedBoard)?.name || "Central de Tarefas"}
            </h1>
          </div>
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
                    <TableHead className="text-xs">Responsáveis</TableHead>
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
                      <TableCell className="text-sm">{task.assignees.map((a) => a.name).join(", ")}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{typeLabelsState[task.type] || task.type}</Badge></TableCell>
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
            onClose={() => { setSelectedTask(null); setFullscreenDoc(false); }}
            onUpdate={handleUpdateTask}
            fullscreenDoc={fullscreenDoc}
            onToggleFullscreen={() => setFullscreenDoc(!fullscreenDoc)}
            typeLabels={typeLabelsState}
            typeColors={typeColorsState}
            onAddType={handleAddType}
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
