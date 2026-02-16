import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Task } from "@/data/mockTasks";
import { statusLabels } from "@/data/mockTasks";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, startOfWeek, format, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

interface BoardReportProps {
  tasks: Task[];
  boardId: string;
}

const STATUS_COLORS = [
  "hsl(0 0% 40%)",
  "hsl(220 70% 55%)",
  "hsl(38 92% 50%)",
  "hsl(280 60% 55%)",
  "hsl(142 71% 45%)",
];

const wearColors: Record<string, { bg: string; label: string }> = {
  low: { bg: "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]", label: "Baixo" },
  medium: { bg: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]", label: "Médio" },
  high: { bg: "bg-destructive/20 text-destructive", label: "Alto" },
};

export default function BoardReport({ tasks, boardId }: BoardReportProps) {
  const total = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done");
  const done = doneTasks.length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;

  // Lead Time: average days between created and updated for done tasks
  // We use the raw DB tasks for accurate timestamps
  const { data: dbDoneTasks } = useQuery({
    queryKey: ["report-done-tasks", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, created_at, updated_at, delivery_date, status")
        .eq("board_id", boardId)
        .eq("status", "done");
      if (error) throw error;
      return data || [];
    },
    enabled: !!boardId,
  });

  const leadTime = useMemo(() => {
    if (!dbDoneTasks || dbDoneTasks.length === 0) return "—";
    const days = dbDoneTasks.map((t) =>
      differenceInDays(new Date(t.updated_at), new Date(t.created_at))
    );
    const avg = days.reduce((s, d) => s + d, 0) / days.length;
    return `${Math.round(avg * 10) / 10}d`;
  }, [dbDoneTasks]);

  // Weekly done chart
  const weeklyData = useMemo(() => {
    if (!dbDoneTasks) return [];
    const now = new Date();
    const weeks = Array.from({ length: 4 }, (_, i) => {
      const weekStart = startOfWeek(subWeeks(now, 3 - i), { locale: ptBR });
      return { weekStart, label: `Sem ${format(weekStart, "dd/MM")}`, count: 0 };
    });
    dbDoneTasks.forEach((t) => {
      const d = new Date(t.updated_at);
      const ws = startOfWeek(d, { locale: ptBR });
      const w = weeks.find((w) => w.weekStart.getTime() === ws.getTime());
      if (w) w.count++;
    });
    return weeks.map((w) => ({ week: w.label, concluidas: w.count }));
  }, [dbDoneTasks]);

  const statusData = Object.entries(
    tasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({
    name: statusLabels[status as keyof typeof statusLabels] || status,
    value: count,
  }));

  // Team performance from real data
  const { data: teamPerformance } = useQuery({
    queryKey: ["report-team-performance", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_assignees")
        .select("user_id, task_id, members!task_assignees_user_id_fkey(name, surname), tasks!task_assignees_task_id_fkey(status, updated_at, delivery_date)")
        .eq("tasks.board_id", boardId);

      if (error) {
        // Fallback: query without FK hints
        const { data: fallback, error: fbErr } = await supabase
          .from("task_assignees")
          .select("user_id, task_id, members(name, surname), tasks(status, updated_at, delivery_date, board_id)");
        if (fbErr) throw fbErr;
        return (fallback || []).filter((r: any) => r.tasks?.board_id === boardId);
      }
      return data || [];
    },
    enabled: !!boardId,
  });

  const performanceData = useMemo(() => {
    if (!teamPerformance) return [];
    const memberMap: Record<string, { name: string; delivered: number; onTime: number; delayed: number }> = {};

    teamPerformance.forEach((row: any) => {
      const member = row.members;
      const task = row.tasks;
      if (!member || !task) return;

      const name = `${member.name}${member.surname ? ` ${member.surname.charAt(0)}.` : ""}`;
      if (!memberMap[row.user_id]) {
        memberMap[row.user_id] = { name, delivered: 0, onTime: 0, delayed: 0 };
      }

      if (task.status === "done") {
        memberMap[row.user_id].delivered++;
        if (!task.delivery_date || new Date(task.updated_at) <= new Date(task.delivery_date)) {
          memberMap[row.user_id].onTime++;
        } else {
          memberMap[row.user_id].delayed++;
        }
      }
    });

    return Object.values(memberMap).map((m) => {
      const ratio = m.delivered > 0 ? m.delayed / m.delivered : 0;
      const wear = ratio === 0 ? "low" : ratio <= 0.3 ? "medium" : "high";
      return { ...m, wear };
    });
  }, [teamPerformance]);

  const metrics = [
    { label: "Total", value: total },
    { label: "Concluídas", value: done },
    { label: "Em Progresso", value: inProgress },
    { label: "Lead Time Médio", value: leadTime },
  ];

  return (
    <div className="space-y-6">
      {/* Task metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-card border border-border rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{m.label}</p>
            <p className="text-2xl font-semibold text-foreground">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs font-medium text-foreground mb-4">Distribuição por Status</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} strokeWidth={0}>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 16%)", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {statusData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                <span className="text-[10px] text-muted-foreground">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs font-medium text-foreground mb-4">Concluídas por Semana</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(0 0% 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(0 0% 55%)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 16%)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="concluidas" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-xs font-medium text-foreground mb-4">👥 Performance da Equipe</p>
        {performanceData.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhum dado de performance disponível. Atribua membros às tarefas para visualizar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Membro</th>
                  <th className="text-center py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Entregues</th>
                  <th className="text-center py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">No Prazo</th>
                  <th className="text-center py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Atrasos</th>
                  <th className="text-center py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Desgaste</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map((p) => (
                  <tr key={p.name} className="border-b border-border/50">
                    <td className="py-2.5 text-sm text-foreground">{p.name}</td>
                    <td className="text-center text-sm text-foreground">{p.delivered}</td>
                    <td className="text-center">
                      <span className="text-[hsl(var(--success))]">{p.onTime}</span>
                    </td>
                    <td className="text-center">
                      <span className={p.delayed > 0 ? "text-destructive" : "text-muted-foreground"}>{p.delayed}</span>
                    </td>
                    <td className="text-center">
                      <Badge variant="outline" className={cn("text-[9px] border-0", wearColors[p.wear].bg)}>
                        {wearColors[p.wear].label}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
