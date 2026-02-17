import { motion } from "framer-motion";
import { CheckCircle2, MessageSquare, Activity, Mic } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { useBoards } from "@/hooks/useBoards";
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

export default function HomePage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const { user } = useAuth();
  const { boards } = useBoards();
  const { tasks } = useTasks(null);

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

      <div className="grid lg:grid-cols-3 gap-4">
        {/* AI Assistant Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-5 flex flex-col items-center gap-3 lg:col-span-1 self-start"
        >
          <button
            onClick={() => setVoiceOpen(true)}
            className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center hover:bg-primary/20 hover:border-primary/50 transition-all group"
          >
            <Mic className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />
          </button>

          <div className="text-center">
            <h3 className="text-sm font-semibold text-foreground">Conversar com IA</h3>
            <p className="text-[11px] text-muted-foreground">Clique para falar ou digite</p>
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={() => setChatOpen(true)}
              className="flex-1 btn-gradient rounded-lg py-2 text-xs font-medium"
            >
              <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />Via texto
            </button>
            <button
              onClick={() => setVoiceOpen(true)}
              className="flex-1 btn-gradient rounded-lg py-2 text-xs font-medium"
            >
              <Mic className="w-3.5 h-3.5 inline mr-1.5" />Via voz
            </button>
          </div>
        </motion.div>

        {/* Right column: Tasks + Activity stacked */}
        <div className="lg:col-span-2 flex flex-col gap-4">
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
                <div key={task.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-surface-hover transition-colors">
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

          {/* Activity placeholder */}
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
            <p className="text-xs text-muted-foreground text-center py-4">A atividade será exibida aqui conforme o uso</p>
          </motion.div>
        </div>
      </div>

      <ToolzzChatDialog open={chatOpen} onOpenChange={setChatOpen} boardId={boardId} />
      <VoiceAgentDialog open={voiceOpen} onOpenChange={setVoiceOpen} boardId={boardId} />
    </div>
  );
}
