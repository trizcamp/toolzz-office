import { useState } from "react";
import { Mic, MessageSquare, FileText, Sparkles, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { type Task, type TaskStatus, allAssignees } from "@/data/mockTasks";

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (task: Partial<Task>) => void;
  existingTasks: Task[];
}

type Mode = "select" | "manual" | "ai-modal";

export default function NewTaskDialog({ open, onOpenChange, onCreateTask, existingTasks }: NewTaskDialogProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("select");
  const [formData, setFormData] = useState({
    title: "",
    objective: "",
    status: "todo" as TaskStatus,
    assigneeId: "",
    deliveryDate: "",
    parentId: "",
    repository: "",
  });

  const resetAndClose = () => {
    setMode("select");
    setFormData({
      title: "",
      objective: "",
      status: "todo",
      assigneeId: "",
      deliveryDate: "",
      parentId: "",
      repository: "",
    });
    onOpenChange(false);
  };

  const handleManualCreate = () => {
    if (!formData.title.trim()) {
      toast({ title: "Erro", description: "Nome da tarefa é obrigatório.", variant: "destructive" });
      return;
    }
    const assignee = allAssignees.find((a) => a.id === formData.assigneeId);
    onCreateTask({
      title: formData.title,
      description: formData.objective,
      status: formData.status,
      assignees: assignee ? [{ id: assignee.id, name: assignee.name }] : [{ id: "1", name: "Beatriz F." }],
    });
    toast({ title: "Tarefa criada", description: `${formData.title} adicionada à Central de Tarefas.` });
    resetAndClose();
  };

  const handleAIStart = (type: "voice" | "text") => {
    toast({
      title: type === "voice" ? "Agente de Voz" : "Agente de Texto",
      description:
        type === "voice"
          ? "Conectando ao agente de voz para auxiliar na criação da tarefa..."
          : "Abrindo chat com o agente de IA...",
    });
    resetAndClose();
  };

  if (mode === "select") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <button
              onClick={() => setMode("manual")}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-surface-hover transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Criar manualmente</p>
                <p className="text-xs text-muted-foreground">Preencha os detalhes da tarefa</p>
              </div>
            </button>

            <button
              disabled
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card opacity-50 cursor-not-allowed text-left relative"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Criar com template</p>
                <p className="text-xs text-muted-foreground">Use um modelo pré-definido</p>
              </div>
              <Badge variant="secondary" className="absolute top-3 right-3 text-[9px]">
                Em breve
              </Badge>
            </button>

            <button
              onClick={() => setMode("ai-modal")}
              className="flex items-center gap-4 p-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Assistência de IA</p>
                <p className="text-xs text-muted-foreground">A IA ajuda a criar a tarefa</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (mode === "ai-modal") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[420px] bg-card border-border">
          <div className="flex flex-col items-center py-8 space-y-6">
            {/* Large mic icon */}
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
              <Mic className="w-8 h-8 text-primary" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-lg font-semibold text-foreground">Conversar com IA</h2>
              <p className="text-sm text-muted-foreground">Clique para falar ou digite sua mensagem</p>
            </div>

            <div className="flex gap-3 w-full max-w-xs">
              <Button
                className="flex-1 gap-2"
                variant="outline"
                onClick={() => handleAIStart("text")}
              >
                <MessageSquare className="w-4 h-4" />
                Via texto
              </Button>
              <Button
                className="flex-1 gap-2 btn-gradient"
                onClick={() => handleAIStart("voice")}
              >
                <Phone className="w-4 h-4" />
                Via voz
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMode("select")} className="mt-2">
            ← Voltar
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Manual mode
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Criar Tarefa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome da tarefa</Label>
            <Input
              placeholder="Ex: Implementar login social"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Objetivo</Label>
            <Textarea
              placeholder="Descreva o objetivo desta tarefa..."
              rows={3}
              value={formData.objective}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Etapa</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as TaskStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="review">Em Revisão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select value={formData.assigneeId} onValueChange={(v) => setFormData({ ...formData, assigneeId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {allAssignees.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data de entrega</Label>
              <Input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Subtarefa de</Label>
              <Select value={formData.parentId} onValueChange={(v) => setFormData({ ...formData, parentId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {existingTasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.id} — {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Repositório GitHub</Label>
            <Select disabled>
              <SelectTrigger>
                <SelectValue placeholder="Conecte o GitHub nas integrações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setMode("select")}>
              ← Voltar
            </Button>
            <Button className="btn-gradient" onClick={handleManualCreate}>
              Criar Tarefa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
