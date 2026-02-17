import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { X, Maximize2, Minimize2, Plus, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Task, TaskStatus, TaskPriority, TaskType } from "@/data/mockTasks";
import { statusLabels, priorityLabels } from "@/data/mockTasks";
import { useMembers } from "@/hooks/useMembers";
import { useTaskAssignees } from "@/hooks/useTasks";
import BlockEditor from "@/components/documents/BlockEditor";
import type { Block } from "@/data/mockDocuments";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useDocumentBlocks, useDocuments } from "@/hooks/useDocuments";
import { supabase } from "@/integrations/supabase/client";

interface TaskDetailPanelProps {
  task: Task & { document_id?: string | null; _dbId?: string };
  onClose: () => void;
  onUpdate: (task: Task) => void;
  fullscreenDoc?: boolean;
  onToggleFullscreen?: () => void;
  typeLabels?: Record<string, string>;
  typeColors?: Record<string, string>;
  onAddType?: (name: string, color: string) => void;
  readOnly?: boolean;
}

const defaultBlocks: Block[] = [
  { id: "td1", type: "heading2", content: "Descrição" },
  { id: "td2", type: "paragraph", content: "" },
  { id: "td3", type: "heading2", content: "Critérios de Aceite" },
  { id: "td4", type: "todoList", content: "", checked: false },
  { id: "td5", type: "heading2", content: "Notas Técnicas" },
  { id: "td6", type: "paragraph", content: "" },
];

const typeColorOptions = [
  "bg-primary/15 text-primary",
  "bg-destructive/15 text-destructive",
  "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
  "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
  "bg-purple-500/15 text-purple-400",
  "bg-pink-500/15 text-pink-400",
  "bg-cyan-500/15 text-cyan-400",
];

export default function TaskDetailPanel({
  task,
  onClose,
  onUpdate,
  fullscreenDoc = false,
  onToggleFullscreen,
  typeLabels = {},
  typeColors = {},
  onAddType,
  readOnly = false,
}: TaskDetailPanelProps) {
  const [localDocId, setLocalDocId] = useState<string | null>(task.document_id || null);
  const { createDocument } = useDocuments();
  const creatingRef = useRef(false);
  const { members } = useMembers();
  const { assignees: dbAssignees, addAssignee, removeAssignee } = useTaskAssignees(task._dbId || task.id);

  // Sync localDocId when task changes
  useEffect(() => {
    setLocalDocId(task.document_id || null);
    creatingRef.current = false;
  }, [task.document_id]);

  const dbId = task._dbId || task.id;

  // Check if document already exists for this task (but don't auto-create)
  useEffect(() => {
    if (localDocId || !dbId) return;

    supabase.from("documents").select("id").eq("task_id", dbId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setLocalDocId(data.id);
          supabase.from("tasks").update({ document_id: data.id }).eq("id", dbId);
        }
      });
  }, [dbId, localDocId]);

  const handleCreateDocForTask = () => {
    if (creatingRef.current || createDocument.isPending) return;
    creatingRef.current = true;
    createDocument.mutate(
      { title: task.title, icon: "📋", type: "spec", task_id: dbId },
      {
        onSuccess: (doc) => {
          setLocalDocId(doc.id);
          supabase.from("tasks").update({ document_id: doc.id }).eq("id", dbId);
        },
        onError: () => { creatingRef.current = false; },
      }
    );
  };

  const documentId = localDocId;
  const { blocks: dbBlocks, saveBlocks } = useDocumentBlocks(documentId);

  const editorBlocks: Block[] = useMemo(() => {
    if (!documentId || dbBlocks.length === 0) {
      if (task.description) {
        return [
          { id: "td1", type: "heading2", content: "Descrição" },
          { id: "td2", type: "paragraph", content: task.description },
          ...defaultBlocks.slice(2),
        ];
      }
      return defaultBlocks;
    }
    return dbBlocks.map((b) => ({
      id: b.id,
      type: b.type as Block["type"],
      content: b.content || "",
      checked: b.checked || undefined,
      metadata: b.metadata || undefined,
    }));
  }, [dbBlocks, documentId, task.description]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleBlocksChange = useCallback((blocks: Block[]) => {
    if (!documentId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveBlocks.mutate({
        documentId,
        blocks: blocks.map((b, i) => ({
          id: b.id,
          document_id: documentId,
          type: b.type,
          content: b.content,
          position: i,
          checked: b.checked || false,
          metadata: b.metadata || {},
        })),
      });
    }, 1000);
  }, [documentId, saveBlocks]);

  const [docExpanded, setDocExpanded] = useState(true);
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState(typeColorOptions[0]);

  const taskAssignees = useMemo(() => {
    return dbAssignees
      .filter((a: any) => a.members)
      .map((a: any) => ({
        id: a.members.id,
        name: `${a.members.name}${a.members.surname ? ` ${a.members.surname.charAt(0)}.` : ""}`,
      }));
  }, [dbAssignees]);

  const realAssignees = members.map((m) => ({
    id: m.id,
    name: `${m.name}${m.surname ? ` ${m.surname.charAt(0)}.` : ""}`,
  }));

  const handleAddAssignee = (assigneeId: string) => {
    if (!taskAssignees.some((a: any) => a.id === assigneeId)) {
      addAssignee.mutate({ taskId: dbId, userId: assigneeId });
    }
  };

  const handleRemoveAssignee = (assigneeId: string) => {
    removeAssignee.mutate({ taskId: dbId, userId: assigneeId });
  };

  // Fullscreen doc overlay
  if (fullscreenDoc) {
    return (
      <div className="fixed inset-0 z-40 bg-background flex flex-col" style={{ left: 240 }}>
        <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Input
              className="text-xs font-mono border-none bg-transparent px-0 h-auto w-24 text-muted-foreground"
              value={task.id}
              onChange={(e) => onUpdate({ ...task, id: e.target.value })}
            />
            <span className="text-sm font-semibold text-foreground">{task.title}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onToggleFullscreen}>
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
          <BlockEditor blocks={editorBlocks} onChange={handleBlocksChange} readOnly={readOnly} />
        </div>
      </div>
    );
  }

  const handleAddNewType = () => {
    if (!newTypeName.trim() || !onAddType) return;
    onAddType(newTypeName, newTypeColor);
    const key = newTypeName.toLowerCase().replace(/\s+/g, "_");
    onUpdate({ ...task, type: key });
    setAddTypeOpen(false);
    setNewTypeName("");
  };

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 480, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="border-l border-border bg-sidebar overflow-y-auto shrink-0 flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <Input
          className="text-xs font-mono border-none bg-transparent px-0 h-auto w-24 text-muted-foreground"
          value={task.id}
          onChange={(e) => onUpdate({ ...task, id: e.target.value })}
        />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Editable Title */}
        <Input
          className="text-lg font-semibold border-none bg-transparent px-0 h-auto text-foreground"
          value={task.title}
          onChange={(e) => onUpdate({ ...task, title: e.target.value })}
          disabled={readOnly}
        />

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</p>
            <Select value={task.status} onValueChange={(v) => onUpdate({ ...task, status: v as TaskStatus })} disabled={readOnly}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Prioridade</p>
            <Select value={task.priority} onValueChange={(v) => onUpdate({ ...task, priority: v as TaskPriority })} disabled={readOnly}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(priorityLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Tipo</p>
            <Select value={task.type} onValueChange={(v) => {
              if (v === "__add_new__") {
                setAddTypeOpen(true);
              } else {
                onUpdate({ ...task, type: v as TaskType });
              }
            }}>
              <SelectTrigger className="h-8 text-xs">
                <span className={cn("px-1.5 py-0.5 rounded text-[10px]", typeColors[task.type] || "")}>{typeLabels[task.type] || task.type}</span>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
                <SelectItem value="__add_new__">
                  <span className="flex items-center gap-1 text-primary">
                    <Plus className="w-3 h-3" /> Adicionar tipo
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Criado em</p>
            <p className="text-xs text-secondary-foreground pt-1.5">{task.createdAt}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Data de Entrega</p>
            <Input
              type="date"
              className="h-8 text-xs"
              value={task.deliveryDate || ""}
              onChange={(e) => onUpdate({ ...task, deliveryDate: e.target.value || undefined })}
              disabled={readOnly}
            />
          </div>
        </div>

        {/* Assignees */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Responsáveis</p>
          <div className="flex flex-wrap gap-1.5">
            {taskAssignees.map((a: any) => (
              <div key={a.id} className="flex items-center gap-1 bg-muted rounded-md px-2 py-1">
                <div className="w-4 h-4 rounded-full bg-surface-hover flex items-center justify-center text-[8px] text-muted-foreground">
                  {a.name.charAt(0)}
                </div>
                <span className="text-[10px] text-secondary-foreground">{a.name}</span>
                <button onClick={() => handleRemoveAssignee(a.id)} className="text-muted-foreground hover:text-destructive ml-0.5">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
          {!readOnly && (
            <Select onValueChange={handleAddAssignee}>
              <SelectTrigger className="h-7 text-[10px] w-40">
                <SelectValue placeholder="+ Adicionar responsável" />
              </SelectTrigger>
              <SelectContent>
                {realAssignees.filter((a) => !taskAssignees.some((ta: any) => ta.id === a.id)).map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Document section */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-foreground">Documentação da Tarefa</p>
            {documentId && (
              <div className="flex items-center gap-1">
                {onToggleFullscreen && (
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onToggleFullscreen}>
                    <Maximize2 className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setDocExpanded(!docExpanded)}>
                  {docExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </Button>
              </div>
            )}
          </div>
          {documentId ? (
            docExpanded && (
              <BlockEditor blocks={editorBlocks} onChange={handleBlocksChange} readOnly={readOnly} />
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <FileText className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">Nenhum documento vinculado</p>
              {!readOnly && (
                <Button size="sm" className="btn-gradient" onClick={handleCreateDocForTask} disabled={createDocument.isPending}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Criar Documento
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Type Dialog */}
      <Dialog open={addTypeOpen} onOpenChange={setAddTypeOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Novo Tipo de Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input placeholder="Ex: Design" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {typeColorOptions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewTypeColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-lg border-2 transition-colors",
                      c.split(" ")[0],
                      newTypeColor === c ? "border-primary" : "border-transparent"
                    )}
                  />
                ))}
              </div>
            </div>
            <Button className="w-full btn-gradient" onClick={handleAddNewType} disabled={!newTypeName.trim()}>
              Criar Tipo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
