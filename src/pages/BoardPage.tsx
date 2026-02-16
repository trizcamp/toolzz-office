import { useState, useMemo } from "react";
import { Plus, LayoutGrid, ArrowLeft, Mic, MessageSquare, Sparkles, Pencil, Trash2, Package, Building2, Wrench } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { statusLabels, priorityLabels, defaultTypeLabels, defaultTypeColors } from "@/data/mockTasks";
import type { TaskStatus } from "@/hooks/useTasks";
import { useBoards } from "@/hooks/useBoards";
import { useTasks } from "@/hooks/useTasks";
import KanbanColumn from "@/components/board/KanbanColumn";
import TaskFilters from "@/components/board/TaskFilters";
import PriorityPokerCard from "@/components/board/PriorityPokerCard";
import BoardReport from "@/components/board/BoardReport";
import NewTaskDialog from "@/components/board/NewTaskDialog";
import TaskDetailPanel from "@/components/board/TaskDetailPanel";
import { AnimatePresence } from "framer-motion";
import { useMembers, useUserRoles } from "@/hooks/useMembers";
import { Skeleton } from "@/components/ui/skeleton";

const allStatuses: TaskStatus[] = ["backlog", "todo", "in_progress", "review", "done"];

const priorityColors: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive",
  high: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]",
  medium: "bg-primary/20 text-primary",
  low: "bg-muted text-muted-foreground",
};

const sectorIcons: Record<string, any> = {
  Produto: Package,
  Departamento: Building2,
  Serviço: Wrench,
};

const sectorTemplates = [
  { sector: "Produto", description: "Kanban para equipes de produto com foco em features e bugs.", comingSoon: false },
  { sector: "Departamento", description: "Gestão de tarefas e demandas por departamento.", comingSoon: true },
  { sector: "Serviço", description: "Acompanhamento de entregas e prestação de serviços.", comingSoon: true },
];

export default function BoardPage() {
  const { boards, isLoading: boardsLoading, createBoard, updateBoard, deleteBoard } = useBoards();
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const { tasks, isLoading: tasksLoading, createTask, updateTask, deleteTask: deleteTaskMut } = useTasks(selectedBoard);
  const { members } = useMembers();
  const { isAdmin } = useUserRoles();

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [newBoardOpen, setNewBoardOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardSector, setNewBoardSector] = useState("");
  const [typeLabelsState, setTypeLabelsState] = useState<Record<string, string>>({ ...defaultTypeLabels });
  const [typeColorsState, setTypeColorsState] = useState<Record<string, string>>({ ...defaultTypeColors });
  const [fullscreenDoc, setFullscreenDoc] = useState(false);
  const [editBoardOpen, setEditBoardOpen] = useState(false);
  const [editBoardId, setEditBoardId] = useState<string | null>(null);
  const [editBoardName, setEditBoardName] = useState("");
  const [editBoardDesc, setEditBoardDesc] = useState("");
  const [deleteBoardId, setDeleteBoardId] = useState<string | null>(null);

  // Convert db tasks to the format components expect
  const mappedTasks = useMemo(() => {
    return tasks.map((t) => ({
      id: t.display_id || t.id,
      _dbId: t.id,
      title: t.title,
      description: t.description || "",
      status: t.status,
      priority: t.priority,
      assignees: [] as { id: string; name: string }[],
      type: t.type || "task",
      points: t.points || 0,
      votes: [],
      createdAt: t.created_at?.split("T")[0] || "",
      deliveryDate: t.delivery_date || undefined,
    }));
  }, [tasks]);

  const assignees = useMemo(() => {
    return members.map((m) => m.name + (m.surname ? ` ${m.surname.charAt(0)}.` : ""));
  }, [members]);

  const filteredTasks = useMemo(() => {
    return mappedTasks.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      return true;
    });
  }, [mappedTasks, typeFilter, priorityFilter, statusFilter]);

  const moveTask = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.display_id === taskId || t.id === taskId);
    if (task) updateTask.mutate({ id: task.id, status: newStatus });
  };

  const moveTaskDirection = (taskId: string, direction: "left" | "right") => {
    const task = tasks.find((t) => t.display_id === taskId || t.id === taskId);
    if (!task) return;
    const idx = allStatuses.indexOf(task.status);
    const newIdx = direction === "left" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= allStatuses.length) return;
    updateTask.mutate({ id: task.id, status: allStatuses[newIdx] });
  };

  const handleCreateTask = (partial: any) => {
    if (!selectedBoard) return;
    createTask.mutate({
      title: partial.title || "Nova tarefa",
      description: partial.description || "",
      status: partial.status || "todo",
      board_id: selectedBoard,
      type: "task",
    });
  };

  const handleUpdateTask = (updated: any) => {
    const task = tasks.find((t) => t.display_id === updated.id || t.id === updated._dbId);
    if (!task) return;
    updateTask.mutate({
      id: task.id,
      title: updated.title,
      description: updated.description,
      status: updated.status,
      priority: updated.priority,
      type: updated.type,
    });
    setSelectedTask(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.display_id === taskId || t.id === taskId);
    if (task) deleteTaskMut.mutate(task.id);
  };

  const handleCreateBoard = () => {
    if (!newBoardName.trim() || !newBoardSector) return;
    const template = sectorTemplates.find((s) => s.sector === newBoardSector);
    createBoard.mutate({
      name: newBoardName,
      description: "",
      sector: newBoardSector,
      icon: newBoardSector,
    });
    setNewBoardOpen(false);
    setNewBoardName("");
    setNewBoardSector("");
  };

  const handleAddType = (name: string, color: string) => {
    const key = name.toLowerCase().replace(/\s+/g, "_");
    setTypeLabelsState((prev) => ({ ...prev, [key]: name }));
    setTypeColorsState((prev) => ({ ...prev, [key]: color }));
  };

  const openEditBoard = (board: any) => {
    setEditBoardId(board.id);
    setEditBoardName(board.name);
    setEditBoardDesc(board.description || "");
    setEditBoardOpen(true);
  };

  const handleSaveBoard = () => {
    if (!editBoardId || !editBoardName.trim()) return;
    updateBoard.mutate({ id: editBoardId, name: editBoardName.trim(), description: editBoardDesc });
    setEditBoardOpen(false);
  };

  const handleDeleteBoard = (boardId: string) => {
    deleteBoard.mutate(boardId);
    setDeleteBoardId(null);
  };

  const filterProps = {
    assigneeFilter, typeFilter, priorityFilter, statusFilter, dateFilter,
    onAssigneeChange: setAssigneeFilter, onTypeChange: setTypeFilter,
    onPriorityChange: setPriorityFilter, onStatusChange: setStatusFilter,
    onDateChange: setDateFilter, assignees,
  };

  // Board overview
  if (!selectedBoard) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <h1 className="text-lg font-semibold text-foreground">Central de Tarefas</h1>
          {isAdmin && (
            <Button size="sm" className="gap-1.5 btn-gradient" onClick={() => setNewBoardOpen(true)}>
              <Plus className="w-4 h-4" /> Nova Central
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {boardsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : boards.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-sm text-muted-foreground">Nenhuma central de tarefas criada</p>
              <Button size="sm" className="btn-gradient" onClick={() => setNewBoardOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Criar primeira central
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {boards.map((board) => (
                <div
                  key={board.id}
                  className="bg-card border border-border rounded-xl p-5 space-y-3 text-left hover:border-muted-foreground/30 transition-all relative group/card"
                >
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openEditBoard(board); }} className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-hover text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteBoardId(board.id); }} className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <button onClick={() => setSelectedBoard(board.id)} className="w-full text-left space-y-3">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const Icon = sectorIcons[board.sector || board.icon || ""] || Package;
                        return <Icon className="w-5 h-5 text-foreground" />;
                      })()}
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{board.name}</h3>
                        <p className="text-[10px] text-muted-foreground">{board.sector}</p>
                      </div>
                    </div>
                    {board.description && <p className="text-xs text-muted-foreground">{board.description}</p>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Board Dialog */}
        <Dialog open={newBoardOpen} onOpenChange={setNewBoardOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader><DialogTitle>Nova Central de Tarefas</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome da Central</Label>
                <Input placeholder="Ex: Sprint Q1 2025" value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Modelo por Setor</Label>
                <div className="grid gap-2">
                  {sectorTemplates.map((t) => (
                    <button
                      key={t.sector}
                      onClick={() => !t.comingSoon && setNewBoardSector(t.sector)}
                      disabled={t.comingSoon}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                        t.comingSoon ? "border-border opacity-50 cursor-not-allowed" :
                        newBoardSector === t.sector ? "border-primary bg-primary/5" : "border-border hover:bg-surface-hover"
                      )}
                    >
                      {(() => {
                        const Icon = sectorIcons[t.sector] || Package;
                        return <Icon className="w-5 h-5 text-foreground" />;
                      })()}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{t.sector}</p>
                          {t.comingSoon && <Badge variant="outline" className="text-[9px] px-1.5 py-0">Em breve</Badge>}
                        </div>
                        <p className="text-[10px] text-muted-foreground">{t.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full btn-gradient" onClick={handleCreateBoard} disabled={!newBoardName.trim() || !newBoardSector}>Criar Central</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Board Dialog */}
        <Dialog open={editBoardOpen} onOpenChange={setEditBoardOpen}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader><DialogTitle>Editar Central de Tarefas</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome da Central</Label>
                <Input value={editBoardName} onChange={(e) => setEditBoardName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea value={editBoardDesc} onChange={(e) => setEditBoardDesc(e.target.value)} placeholder="Descreva o propósito desta central..." rows={3} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditBoardOpen(false)}>Cancelar</Button>
                <Button className="btn-gradient" onClick={handleSaveBoard}>Salvar</Button>
              </div>
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
                Todas as tarefas vinculadas a esta central serão perdidas permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteBoardId && handleDeleteBoard(deleteBoardId)}>
                Apagar permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  const currentBoard = boards.find((b) => b.id === selectedBoard);

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedBoard(null)} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">
              {currentBoard?.name || "Central de Tarefas"}
            </h1>
          </div>
          {isAdmin && (
            <Button size="sm" className="gap-1.5 btn-gradient" onClick={() => setNewTaskOpen(true)}>
              <Plus className="w-4 h-4" /> Nova Tarefa
            </Button>
          )}
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

          <TabsContent value="kanban" className="flex-1 overflow-x-auto px-6 py-4 space-y-3">
            <TaskFilters {...filterProps} />
            <div className="flex gap-4 min-w-max">
              {allStatuses.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={filteredTasks.filter((t) => t.status === status)}
                  onMoveTask={moveTaskDirection}
                  onDropTask={moveTask}
                  onSelectTask={setSelectedTask}
                  allStatuses={allStatuses}
                  typeLabels={typeLabelsState}
                  typeColors={typeColorsState}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list" className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <TaskFilters {...filterProps} />
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Título</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Prioridade</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id} className="cursor-pointer hover:bg-surface-hover" onClick={() => setSelectedTask(task)}>
                      <TableCell className="text-xs font-mono text-muted-foreground">{task.id}</TableCell>
                      <TableCell className="text-sm">{task.title}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{statusLabels[task.status]}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={cn("text-[10px] border-0", priorityColors[task.priority])}>{priorityLabels[task.priority]}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px] border-0", typeColorsState[task.type] || "")}>
                          {typeLabelsState[task.type] || task.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{task.createdAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="report" className="flex-1 overflow-y-auto px-6 py-4">
            <BoardReport tasks={mappedTasks} />
          </TabsContent>

          <TabsContent value="priority" className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              {mappedTasks.map((task) => (
                <PriorityPokerCard key={task.id} task={task} onDelete={() => handleDeleteTask(task.id)} onUpdate={handleUpdateTask} onSelect={() => setSelectedTask(task)} />
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

      <NewTaskDialog open={newTaskOpen} onOpenChange={setNewTaskOpen} onCreateTask={handleCreateTask} existingTasks={mappedTasks} boardId={selectedBoard} />
    </div>
  );
}
