import { useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TaskFiltersProps {
  assigneeFilter: string;
  typeFilter: string;
  priorityFilter: string;
  statusFilter: string;
  dateFilter: string;
  onAssigneeChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onDateChange: (v: string) => void;
  assignees: string[];
}

export default function TaskFilters({
  assigneeFilter, typeFilter, priorityFilter, statusFilter, dateFilter,
  onAssigneeChange, onTypeChange, onPriorityChange, onStatusChange, onDateChange,
  assignees,
}: TaskFiltersProps) {
  const [open, setOpen] = useState(false);
  const activeCount = [assigneeFilter, typeFilter, priorityFilter, statusFilter, dateFilter].filter((v) => v !== "all" && v !== "").length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
          <Filter className="w-3.5 h-3.5" />
          Filtros
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[9px]">{activeCount}</span>
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <div className="flex gap-3 flex-wrap">
          <Select value={assigneeFilter} onValueChange={onAssigneeChange}>
            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Responsável" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {assignees.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={onTypeChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="feature">Feature</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="improvement">Melhoria</SelectItem>
              <SelectItem value="task">Tarefa</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={onPriorityChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Etapa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">Em Progresso</SelectItem>
              <SelectItem value="review">Em Revisão</SelectItem>
              <SelectItem value="done">Concluído</SelectItem>
            </SelectContent>
          </Select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => onDateChange(e.target.value)}
            className="h-8 text-xs rounded-md border border-border bg-background px-2 text-foreground"
          />
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => {
              onAssigneeChange("all"); onTypeChange("all"); onPriorityChange("all"); onStatusChange("all"); onDateChange("");
            }}>
              Limpar filtros
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
