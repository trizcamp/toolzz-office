import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Task } from "@/data/mockTasks";
import { statusLabels } from "@/data/mockTasks";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, startOfWeek, startOfMonth, startOfYear, format, subWeeks, subMonths, subDays, isAfter, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

type PeriodFilter = "7d" | "30d" | "week" | "month" | "year";

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mês" },
  { value: "year", label: "Este ano" },
];

function getPeriodStart(period: PeriodFilter): Date {
  const now = new Date();
  switch (period) {
    case "7d": return subDays(now, 7);
    case "30d": return subDays(now, 30);
    case "week": return startOfWeek(now, { locale: ptBR });
    case "month": return startOfMonth(now);
    case "year": return startOfYear(now);
  }
}

export default function BoardReport({ tasks, boardId }: BoardReportProps) {
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const periodStart = getPeriodStart(period);

  // Filter tasks by period
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => isAfter(new Date(t.createdAt), periodStart));
  }, [tasks, periodStart]);

  const total = filteredTasks.length;
  const doneTasks = filteredTasks.filter((t) => t.status === "done");
  const done = doneTasks.length;
  const inProgress = filteredTasks.filter((t) => t.status === "in_progress").length;

  // DB done tasks for lead time
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

  const filteredDbDone = useMemo(() => {
    if (!dbDoneTasks) return [];
    return dbDoneTasks.filter((t) => isAfter(new Date(t.updated_at), periodStart));
  }, [dbDoneTasks, periodStart]);

  const leadTime = useMemo(() => {
    if (filteredDbDone.length === 0) return "—";
    const days = filteredDbDone.map((t) =>
      differenceInDays(new Date(t.updated_at), new Date(t.created_at))
    );
    const avg = days.reduce((s, d) => s + d, 0) / days.length;
    return `${Math.round(avg * 10) / 10}d`;
  }, [filteredDbDone]);

  // Weekly done chart
  const weeklyData = useMemo(() => {
    if (!filteredDbDone.length) return [];
    const now = new Date();
    const weeks = Array.from({ length: 4 }, (_, i) => {
      const weekStart = startOfWeek(subWeeks(now, 3 - i), { locale: ptBR });
      return { weekStart, label: `Sem ${format(weekStart, "dd/MM")}`, count: 0 };
    });
    filteredDbDone.forEach((t) => {
      const d = new Date(t.updated_at);
      const ws = startOfWeek(d, { locale: ptBR });
      const w = weeks.find((w) => w.weekStart.getTime() === ws.getTime());
      if (w) w.count++;
    });
    return weeks.map((w) => ({ week: w.label, concluidas: w.count }));
  }, [filteredDbDone]);

  const statusData = Object.entries(
    filteredTasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({
    name: statusLabels[status as keyof typeof statusLabels] || status,
    value: count,
  }));

  // Board members
  const { data: boardMembers } = useQuery({
    queryKey: ["report-board-members", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("board_members")
        .select("user_id, members(id, name, surname, avatar_url)")
        .eq("board_id", boardId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!boardId,
  });

  // Task assignees with member info for this board
  const { data: taskAssignees } = useQuery({
    queryKey: ["report-task-assignees", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_assignees")
        .select("user_id, task_id, tasks!task_assignees_task_id_fkey(id, status, updated_at, delivery_date, board_id, created_at)");
      if (error) throw error;
      return (data || []).filter((r: any) => r.tasks?.board_id === boardId);
    },
    enabled: !!boardId,
  });

  const performanceData = useMemo(() => {
    if (!boardMembers || !taskAssignees) return [];

    const memberMap: Record<string, {
      name: string;
      avatar_url: string;
      delivered: number;
      onTime: number;
      delayed: number;
      inProgress: number;
      total: number;
    }> = {};

    // Init from board members
    boardMembers.forEach((bm: any) => {
      const m = bm.members;
      if (!m) return;
      const name = `${m.name}${m.surname ? ` ${m.surname}` : ""}`;
      memberMap[bm.user_id] = {
        name,
        avatar_url: m.avatar_url || "",
        delivered: 0,
        onTime: 0,
        delayed: 0,
        inProgress: 0,
        total: 0,
      };
    });

    // Populate from task assignees (filtered by period)
    taskAssignees.forEach((row: any) => {
      const task = row.tasks;
      if (!task) return;
      if (!isAfter(new Date(task.created_at), periodStart)) return;

      const entry = memberMap[row.user_id];
      if (!entry) return;

      entry.total++;

      if (task.status === "in_progress") {
        entry.inProgress++;
      }

      if (task.status === "done") {
        entry.delivered++;
        if (!task.delivery_date || new Date(task.updated_at) <= new Date(task.delivery_date)) {
          entry.onTime++;
        } else {
          entry.delayed++;
        }
      }
    });

    return Object.values(memberMap).map((m) => {
      const ratio = m.delivered > 0 ? m.delayed / m.delivered : 0;
      const wear = ratio === 0 ? "low" : ratio <= 0.3 ? "medium" : "high";
      return { ...m, wear };
    });
  }, [boardMembers, taskAssignees, periodStart]);

  const metrics = [
    { label: "Total", value: total },
    { label: "Concluídas", value: done },
    { label: "Em Progresso", value: inProgress },
    { label: "Lead Time Médio", value: leadTime },
  ];

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Período de análise</p>
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
          <p className="text-xs text-muted-foreground italic">Nenhum membro vinculado a este board. Adicione membros ao board para visualizar a performance.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Membro</th>
                  <th className="text-center py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Total</th>
                  <th className="text-center py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Entregues</th>
                  <th className="text-center py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">No Prazo</th>
                  <th className="text-center py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Atrasos</th>
                  <th className="text-center py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Em Progresso</th>
                  <th className="text-center py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Desgaste</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map((p) => (
                  <tr key={p.name} className="border-b border-border/50">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={p.avatar_url} />
                          <AvatarFallback className="text-[10px] bg-surface-hover text-muted-foreground">
                            {p.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="text-center text-sm text-foreground">{p.total}</td>
                    <td className="text-center text-sm text-foreground">{p.delivered}</td>
                    <td className="text-center">
                      <span className="text-[hsl(var(--success))]">{p.onTime}</span>
                    </td>
                    <td className="text-center">
                      <span className={p.delayed > 0 ? "text-destructive" : "text-muted-foreground"}>{p.delayed}</span>
                    </td>
                    <td className="text-center text-sm text-foreground">{p.inProgress}</td>
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
