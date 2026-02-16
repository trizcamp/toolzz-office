import { useState, useEffect } from "react";
import { FileText, Sparkles, Github, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useGithubIntegration } from "@/hooks/useGithubIntegration";
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
  const { connected, repos, loadingRepos, fetchRepos } = useGithubIntegration();
  const [mode, setMode] = useState<Mode>("select");
  const [formData, setFormData] = useState({
    title: "",
    objective: "",
    status: "todo" as TaskStatus,
    type: "task",
    deliveryDate: "",
    githubRepo: "",
  });

  // Fetch repos when entering manual mode and GitHub is connected
  useEffect(() => {
    if (mode === "manual" && connected && repos.length === 0) {
      fetchRepos();
    }
  }, [mode, connected]);

  const resetAndClose = () => {
    setMode("select");
    setFormData({ title: "", objective: "", status: "todo", type: "task", deliveryDate: "", githubRepo: "" });
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
      type: formData.type,
      github_repo: formData.githubRepo || undefined,
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
      <ToolzzChatDialog
        open={true}
        onOpenChange={(v) => { if (!v) setMode("select"); }}
        boardId={boardId}
      />
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
              <Label>Tipo</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Tarefa</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="improvement">Melhoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data de entrega</Label>
              <Input type="date" value={formData.deliveryDate} onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })} />
            </div>
            {connected && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5" /> Repositório
                </Label>
                {loadingRepos ? (
                  <div className="flex items-center gap-2 h-10 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando...
                  </div>
                ) : (
                  <Select value={formData.githubRepo} onValueChange={(v) => setFormData({ ...formData, githubRepo: v === "__none__" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar repo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {repos.map((r) => (
                        <SelectItem key={r.full_name} value={r.full_name}>
                          {r.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>
          {connected && formData.githubRepo && (formData.type === "bug" || formData.type === "improvement") && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 bg-primary/5 px-3 py-2 rounded-lg border border-primary/20">
              <Github className="w-3.5 h-3.5 text-primary shrink-0" />
              Uma issue será criada automaticamente no repositório <strong>{formData.githubRepo}</strong>
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setMode("select")}>← Voltar</Button>
            <Button className="btn-gradient" onClick={handleManualCreate}>Criar Tarefa</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
