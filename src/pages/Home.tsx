import { motion } from "framer-motion";
import {
  Sparkles,
  Send,
  Link2,
  Clock,
  ArrowRight,
  FileText,
  Kanban,
  MessageSquare,
  CalendarDays,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const quicklinks = [
  { icon: Kanban, label: "Esteira de tarefas", desc: "Gerencie seus work items" },
  { icon: FileText, label: "Documentos recentes", desc: "Acesse seus docs" },
  { icon: CalendarDays, label: "Reuniões do dia", desc: "Veja sua agenda" },
  { icon: TrendingUp, label: "Relatório semanal", desc: "Métricas e insights" },
];

const recentTasks = [
  { id: "PRD-42", title: "Definir especificação do módulo de reuniões", status: "in_progress", priority: "high", assignee: "BC" },
  { id: "MKT-18", title: "Criar copy para landing page v2", status: "todo", priority: "medium", assignee: "JS" },
  { id: "DEV-91", title: "Implementar autenticação SSO", status: "in_progress", priority: "high", assignee: "RF" },
  { id: "DES-33", title: "Design do dashboard operacional", status: "done", priority: "low", assignee: "AL" },
  { id: "OPS-07", title: "Configurar pipeline de CI/CD", status: "todo", priority: "medium", assignee: "TM" },
];

const statusConfig: Record<string, { label: string; class: string; icon: typeof CheckCircle2 }> = {
  todo: { label: "A fazer", class: "text-muted-foreground", icon: AlertCircle },
  in_progress: { label: "Em progresso", class: "text-warning", icon: Clock },
  done: { label: "Concluído", class: "text-success", icon: CheckCircle2 },
};

const stats = [
  { label: "Tarefas abertas", value: "23", change: "-3 esta semana" },
  { label: "Concluídas hoje", value: "7", change: "+2 vs ontem" },
  { label: "Reuniões hoje", value: "3", change: "Próxima em 45min" },
  { label: "Documentos novos", value: "5", change: "2 aguardam revisão" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function HomePage() {
  const [aiInput, setAiInput] = useState("");

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto px-6 py-8 space-y-8"
    >
      {/* Greeting */}
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          {getGreeting()}, Beatriz
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          <CalendarDays className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-card rounded-xl p-4 border border-border hover:border-primary/20 transition-colors"
          >
            <p className="text-2xl font-semibold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">{s.change}</p>
          </div>
        ))}
      </motion.div>

      {/* Ask AI */}
      <motion.div variants={item}>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Ask AI</span>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-3 bg-surface rounded-lg px-4 py-3">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Pergunte algo sobre suas tarefas, projetos ou métricas..."
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
            />
            <button className="p-1.5 rounded-lg bg-primary hover:bg-primary/90 transition-colors text-primary-foreground">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-2">
            A IA pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </motion.div>

      {/* Quicklinks */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-foreground">Acesso rápido</h2>
          <button className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
            <Link2 className="w-3 h-3" /> Personalizar
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quicklinks.map((ql) => (
            <button
              key={ql.label}
              className="bg-card rounded-xl border border-border p-4 text-left hover:border-primary/20 hover:bg-surface-hover transition-all group"
            >
              <ql.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mb-3" />
              <p className="text-sm font-medium text-foreground">{ql.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{ql.desc}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Recent Tasks */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-foreground">Tarefas recentes</h2>
          <button className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
            Ver todas <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {recentTasks.map((task) => {
            const st = statusConfig[task.status];
            const StIcon = st.icon;
            return (
              <div
                key={task.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <StIcon className={`w-4 h-4 shrink-0 ${st.class}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{task.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {task.id} · {st.label}
                  </p>
                </div>
                <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-medium text-secondary-foreground">
                    {task.assignee}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
