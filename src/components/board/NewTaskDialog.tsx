import { useState } from "react";
import { FileText, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMembers } from "@/hooks/useMembers";
import ToolzzChatDialog from "@/components/ToolzzChatDialog";
import type { TaskStatus } from "@/hooks/useTasks";

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (task: any) => void;
  existingTasks: any[];
  boardId?: string | null;
}

type Mode = "select" | "manual" | "ai-chat";

export default function NewTaskDialog({ open, onOpenChange, onCreateTask, existingTasks, boardId }: NewTaskDialogProps) {
  const { toast } = useToast();
  const { members } = useMembers();
  const [mode, setMode] = useState<Mode>("select");
  const [formData, setFormData] = useState({
    title: "",
    objective: "",
    status: "todo" as TaskStatus,
    assigneeId: "",
    deliveryDate: "",
    parentId: "",
  });


  const resetAndClose = () => {
    setMode("select");
    setFormData({ title: "", objective: "", status: "todo", assigneeId: "", deliveryDate: "", parentId: "" });
    onOpenChange(false);
  };

  const handleManualCreate = () => {
    if (!formData.title.trim()) {
      toast({ title: "Erro", description: "Nome da tarefa é obrigatório.", variant: "destructive" });
      return;
    }
    onCreateTask({
      title: formData.title,
      description: formData.objective,
      status: formData.status,
    });
    toast({ title: "Tarefa criada", description: `${formData.title} adicionada à Central de Tarefas.` });
    resetAndClose();
  };

  if (mode === "select") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <button onClick={() => setMode("manual")} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-surface-hover transition-colors text-left">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Criar manualmente</p>
                <p className="text-xs text-muted-foreground">Preencha os detalhes da tarefa</p>
              </div>
            </button>
            <button onClick={() => setMode("ai-chat")} className="flex items-center gap-4 p-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Assistência de IA</p>
                <p className="text-xs text-muted-foreground">A IA ajuda a criar a tarefa via chat</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (mode === "ai-chat") {
    return (
      <>
        <ToolzzChatDialog
          open={true}
          onOpenChange={(v) => {
            if (!v) setMode("select");
          }}
          boardId={boardId}
        />
      </>
    );
  }

  // Manual mode
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader><DialogTitle>Criar Tarefa</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome da tarefa</Label>
            <Input placeholder="Ex: Implementar login social" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Objetivo</Label>
            <Textarea placeholder="Descreva o objetivo desta tarefa..." rows={3} value={formData.objective} onChange={(e) => setFormData({ ...formData, objective: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Etapa</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as TaskStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="review">Em Revisão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de entrega</Label>
              <Input type="date" value={formData.deliveryDate} onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setMode("select")}>← Voltar</Button>
            <Button className="btn-gradient" onClick={handleManualCreate}>Criar Tarefa</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
