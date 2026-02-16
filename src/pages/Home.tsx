import { motion } from "framer-motion";
import { Mic, Calendar, CheckCircle2, MessageSquare, Activity } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { mockTasks } from "@/data/mockTasks";
import { mockMeetings } from "@/data/mockMeetings";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

const todayTasks = mockTasks.filter((t) => t.status === "todo" || t.status === "in_progress");
const todayMeetings = mockMeetings.slice(0, 2);

const recentActivity = [
  { id: "a1", text: "Beatriz moveu TOZ-101 para Concluído", time: "09:30" },
  { id: "a2", text: "Rafael comentou em TOZ-103", time: "09:15" },
  { id: "a3", text: "Amanda criou TOZ-108", time: "08:50" },
  { id: "a4", text: "João enviou PR para review", time: "08:30" },
];

const priorityDot: Record<string, string> = {
  critical: "bg-destructive",
  high: "bg-[hsl(var(--warning))]",
  medium: "bg-primary",
  low: "bg-muted-foreground",
};

export default function HomePage() {
  const [isListening, setIsListening] = useState(false);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold text-foreground">{getGreeting()}, Boss</h1>
        <p className="text-sm text-muted-foreground capitalize">{today}</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* AI Assistant Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center gap-4 lg:row-span-2"
        >
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsListening(!isListening)}
              className={cn(
                "w-28 h-28 rounded-full flex items-center justify-center transition-all",
                isListening
                  ? "bg-primary text-primary-foreground shadow-[0_0_40px_hsl(var(--primary)/0.3)]"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {isListening && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/30"
                  animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
              <Mic className="w-8 h-8" />
            </motion.button>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Conversar com IA</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isListening ? "Ouvindo..." : "Clique para falar ou digite"}
            </p>
          </div>
          <div className="flex gap-2 w-full">
            <button className="flex-1 btn-gradient rounded-lg py-2 text-xs font-medium">
              <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />Via texto
            </button>
            <button
              onClick={() => setIsListening(!isListening)}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-medium",
                isListening ? "bg-primary text-primary-foreground" : "btn-gradient"
              )}
            >
              <Mic className="w-3.5 h-3.5 inline mr-1.5" />Via voz
            </button>
          </div>
        </motion.div>

        {/* Tasks for Today */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-4 lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Tarefas do Dia</h2>
            <span className="text-[10px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground ml-auto">{todayTasks.length}</span>
          </div>
          <div className="space-y-2">
            {todayTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-surface-hover transition-colors">
                <div className={cn("w-2 h-2 rounded-full shrink-0", priorityDot[task.priority])} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{task.title}</p>
                  <p className="text-[10px] text-muted-foreground">{task.id} • {task.assignees.map(a => a.name).join(", ")}</p>
                </div>
                <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">{task.status === "in_progress" ? "Em progresso" : "A fazer"}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Meetings for Today */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Reuniões</h2>
          </div>
          <div className="space-y-3">
            {todayMeetings.map((meeting) => (
              <div key={meeting.id} className="p-3 rounded-lg bg-surface/50 border border-border/50 space-y-1.5">
                <p className="text-sm font-medium text-foreground">{meeting.title}</p>
                <p className="text-xs text-muted-foreground">{meeting.startTime} — {meeting.endTime}</p>
                <div className="flex items-center gap-1">
                  {meeting.participants.slice(0, 4).map((p) => (
                    <div key={p.id} className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[8px] font-medium text-muted-foreground">
                      {p.name.charAt(0)}
                    </div>
                  ))}
                  {meeting.participants.length > 4 && (
                    <span className="text-[9px] text-muted-foreground ml-1">+{meeting.participants.length - 4}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Atividade Recente</h2>
          </div>
          <div className="space-y-2.5">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-secondary-foreground">{item.text}</p>
                  <p className="text-[10px] text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
