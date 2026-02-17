import { motion } from "framer-motion";
import { CheckCircle2, MessageSquare, Activity, Mic, Plus, ArrowRight, UserPlus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { useBoards } from "@/hooks/useBoards";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ToolzzChatDialog from "@/components/ToolzzChatDialog";
import VoiceAgentDialog from "@/components/VoiceAgentDialog";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

const priorityDot: Record<string, string> = {
  critical: "bg-destructive",
  high: "bg-[hsl(var(--warning))]",
  medium: "bg-primary",
  low: "bg-muted-foreground",
};

const statusLabels: Record<string, string> = {
  in_progress: "Em progresso",
  todo: "A fazer",
  backlog: "Backlog",
  review: "Em revisão",
  done: "Concluído",
};

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD}d`;
}

function getActionIcon(action: string) {
  switch (action) {
    case "task_created": return <Plus className="w-3.5 h-3.5 text-primary" />;
    case "task_status_changed": return <ArrowRight className="w-3.5 h-3.5 text-primary" />;
    case "task_assigned": return <UserPlus className="w-3.5 h-3.5 text-primary" />;
    default: return <Activity className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}

function getActionDescription(log: { action: string; metadata: Record<string, any> }) {
  const m = log.metadata;
  switch (log.action) {
    case "task_created":
      return `criou a tarefa ${m.display_id || ""}${m.title ? " · " + m.title : ""}`;
    case "task_status_changed":
      return `moveu ${m.display_id || ""} para ${statusLabels[m.new_status] || m.new_status}`;
    case "task_assigned":
      return `foi atribuído à tarefa ${m.display_id || ""}${m.title ? " · " + m.title : ""}`;
    default:
      return log.action;
  }
}

export default function HomePage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const { user } = useAuth();
  const { boards } = useBoards();
  const { tasks } = useTasks(null);
  const { logs } = useActivityLogs();

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Boss";
  const todayTasks = tasks.filter((t) => t.status === "todo" || t.status === "in_progress").slice(0, 5);
  const boardId = boards?.[0]?.id || null;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold text-foreground">{getGreeting()}, {userName}</h1>
        <p className="text-sm text-muted-foreground capitalize">{today}</p>
      </motion.div>

      {/* AI Card - full width */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4"
      >
        <button
          onClick={() => setVoiceOpen(true)}
          className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center hover:bg-primary/20 hover:border-primary/50 transition-all group shrink-0"
        >
          <Mic className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />
        </button>

        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-sm font-semibold text-foreground">Conversar com IA</h3>
          <p className="text-[11px] text-muted-foreground">Clique para falar ou digite</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setChatOpen(true)}
            className="btn-gradient rounded-lg py-2 px-4 text-xs font-medium"
          >
            <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />Via texto
          </button>
          <button
            onClick={() => setVoiceOpen(true)}
            className="btn-gradient rounded-lg py-2 px-4 text-xs font-medium"
          >
            <Mic className="w-3.5 h-3.5 inline mr-1.5" />Via voz
          </button>
        </div>
      </motion.div>

      {/* Tasks + Activity side by side */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Tasks for Today */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Tarefas do Dia</h2>
            <span className="text-[10px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground ml-auto">{todayTasks.length}</span>
          </div>
          <div className="space-y-2">
            {todayTasks.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma tarefa pendente 🎉</p>
            )}
            {todayTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={cn("w-2 h-2 rounded-full shrink-0", priorityDot[task.priority])} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{task.title}</p>
                  <p className="text-[10px] text-muted-foreground">{task.display_id}</p>
                </div>
                <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">{statusLabels[task.status] || task.status}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Atividade Recente</h2>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {logs.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">A atividade será exibida aqui conforme o uso</p>
            )}
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="w-6 h-6 mt-0.5 shrink-0">
                  <AvatarImage src={log.member_avatar || undefined} />
                  <AvatarFallback className="text-[10px]">{(log.member_name || "S")[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {getActionIcon(log.action)}
                    <span className="text-xs text-foreground font-medium truncate">{log.member_name}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{getActionDescription(log)}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{formatRelativeTime(log.created_at)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <ToolzzChatDialog open={chatOpen} onOpenChange={setChatOpen} boardId={boardId} />
      <VoiceAgentDialog open={voiceOpen} onOpenChange={setVoiceOpen} boardId={boardId} />
    </div>
  );
}
