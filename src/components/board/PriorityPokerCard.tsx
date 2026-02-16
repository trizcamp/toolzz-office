import { useState } from "react";
import { Trash2, Pencil, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Task } from "@/data/mockTasks";
import { fibonacciPoints } from "@/data/mockTasks";

interface PriorityPokerCardProps {
  task: Task;
  onDelete: () => void;
  onUpdate: (task: Task) => void;
  onSelect: () => void;
}

export default function PriorityPokerCard({ task, onDelete, onUpdate, onSelect }: PriorityPokerCardProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);

  const avgPoints = task.votes.length > 0
    ? Math.round(task.votes.reduce((s, v) => s + v.points, 0) / task.votes.length)
    : null;

  const handleSave = () => {
    onUpdate({ ...task, title: editTitle, description: editDesc });
    setEditing(false);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground font-mono cursor-pointer hover:text-primary" onClick={onSelect}>{task.id}</span>
        <div className="flex items-center gap-1">
          {avgPoints !== null && (
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-0">{avgPoints} pts</Badge>
          )}
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(!editing)}>
            {editing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={onDelete}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-sm" />
          <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="text-xs" onKeyDown={(e) => e.key === "Enter" && handleSave()} />
          <Button size="sm" className="btn-gradient text-xs" onClick={handleSave}>Salvar</Button>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-foreground cursor-pointer hover:text-primary" onClick={onSelect}>{task.title}</p>
          <p className="text-xs text-muted-foreground">{task.description}</p>
        </>
      )}

      {task.votes.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Votos</p>
          <div className="flex gap-2 flex-wrap">
            {task.votes.map((vote) => (
              <div key={vote.userId} className="flex items-center gap-1.5 bg-muted rounded-md px-2 py-1">
                <div className="w-4 h-4 rounded-full bg-surface-hover flex items-center justify-center text-[8px] text-muted-foreground">
                  {vote.userName.charAt(0)}
                </div>
                <span className="text-[10px] text-secondary-foreground">{vote.userName}</span>
                <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-1">{vote.points}</Badge>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Nenhum voto ainda</p>
      )}

      <div className="flex gap-1.5 pt-1">
        {fibonacciPoints.map((p) => (
          <button
            key={p}
            className={cn(
              "w-8 h-10 rounded-md border text-xs font-medium transition-colors",
              task.points === p
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-muted-foreground"
            )}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
