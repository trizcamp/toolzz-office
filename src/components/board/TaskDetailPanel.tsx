import { useState } from "react";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Task, TaskStatus, TaskPriority, TaskType } from "@/data/mockTasks";
import { statusLabels, priorityLabels, typeLabels } from "@/data/mockTasks";
import BlockEditor from "@/components/documents/BlockEditor";
import type { Block } from "@/data/mockDocuments";
import { motion } from "framer-motion";

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
  onUpdate: (task: Task) => void;
}

const defaultBlocks: Block[] = [
  { id: "td1", type: "heading2", content: "Descrição" },
  { id: "td2", type: "paragraph", content: "" },
  { id: "td3", type: "heading2", content: "Critérios de Aceite" },
  { id: "td4", type: "todoList", content: "", checked: false },
  { id: "td5", type: "heading2", content: "Notas Técnicas" },
  { id: "td6", type: "paragraph", content: "" },
];

export default function TaskDetailPanel({ task, onClose, onUpdate }: TaskDetailPanelProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => {
    if (task.description) {
      return [
        { id: "td1", type: "heading2", content: "Descrição" },
        { id: "td2", type: "paragraph", content: task.description },
        ...defaultBlocks.slice(2),
      ];
    }
    return defaultBlocks;
  });
  const [docExpanded, setDocExpanded] = useState(true);

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
        <Badge variant="outline" className="text-xs font-mono">{task.id}</Badge>
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
        />

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</p>
            <Select value={task.status} onValueChange={(v) => onUpdate({ ...task, status: v as TaskStatus })}>
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
            <Select value={task.priority} onValueChange={(v) => onUpdate({ ...task, priority: v as TaskPriority })}>
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
            <Select value={task.type} onValueChange={(v) => onUpdate({ ...task, type: v as TaskType })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(typeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Responsável</p>
            <p className="text-sm text-foreground">{task.assignee.name}</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Criado em</p>
          <p className="text-xs text-secondary-foreground">{task.createdAt}</p>
        </div>

        {/* Document section */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-foreground">Documentação da Tarefa</p>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setDocExpanded(!docExpanded)}>
              {docExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
          </div>
          {docExpanded && (
            <BlockEditor blocks={blocks} onChange={setBlocks} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
