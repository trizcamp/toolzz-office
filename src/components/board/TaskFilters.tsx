import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TaskFiltersProps {
  assigneeFilter: string;
  typeFilter: string;
  onAssigneeChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  assignees: string[];
}

export default function TaskFilters({ assigneeFilter, typeFilter, onAssigneeChange, onTypeChange, assignees }: TaskFiltersProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      <Select value={assigneeFilter} onValueChange={onAssigneeChange}>
        <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Responsável" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {assignees.map((a) => (
            <SelectItem key={a} value={a}>{a}</SelectItem>
          ))}
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
    </div>
  );
}
