import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Task } from "@/data/mockTasks";
import { statusLabels } from "@/data/mockTasks";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BoardReportProps {
  tasks: Task[];
}

const STATUS_COLORS = [
  "hsl(0 0% 40%)",
  "hsl(220 70% 55%)",
  "hsl(38 92% 50%)",
  "hsl(280 60% 55%)",
  "hsl(142 71% 45%)",
];

const performanceData = [
  { name: "Beatriz F.", delivered: 5, delayed: 0, onTime: 5, wear: "low" },
  { name: "João S.", delivered: 3, delayed: 1, onTime: 2, wear: "medium" },
  { name: "Rafael M.", delivered: 4, delayed: 0, onTime: 4, wear: "low" },
  { name: "Amanda L.", delivered: 2, delayed: 1, onTime: 1, wear: "high" },
  { name: "Thiago M.", delivered: 3, delayed: 2, onTime: 1, wear: "high" },
];

const wearColors: Record<string, { bg: string; label: string }> = {
  low: { bg: "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]", label: "Baixo" },
  medium: { bg: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]", label: "Médio" },
  high: { bg: "bg-destructive/20 text-destructive", label: "Alto" },
};

export default function BoardReport({ tasks }: BoardReportProps) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;

  const statusData = Object.entries(
    tasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({
    name: statusLabels[status as keyof typeof statusLabels] || status,
    value: count,
  }));

  const weeklyData = [
    { week: "Sem 1", concluidas: 2 },
    { week: "Sem 2", concluidas: 3 },
    { week: "Sem 3", concluidas: 1 },
    { week: "Sem 4", concluidas: 4 },
  ];

  const metrics = [
    { label: "Total", value: total },
    { label: "Concluídas", value: done },
    { label: "Em Progresso", value: inProgress },
    { label: "Lead Time Médio", value: "4.2d" },
  ];

  const costMetrics = [
    { label: "Horas do Gestor", value: "24h", cost: "R$ 2.400" },
    { label: "Horas de Desenvolvimento", value: "86h", cost: "R$ 6.020" },
    { label: "Custo de Plataforma", value: "—", cost: "R$ 450" },
    { label: "Total Estimado", value: "110h", cost: "R$ 8.870", highlight: true },
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

      {/* Feature Cost */}
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-xs font-medium text-foreground mb-4">💰 Custo da Feature</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {costMetrics.map((c) => (
            <div key={c.label} className={cn("rounded-lg p-3", c.highlight ? "bg-primary/10 border border-primary/20" : "bg-muted/50")}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{c.label}</p>
              <p className={cn("text-lg font-semibold", c.highlight ? "text-primary" : "text-foreground")}>{c.cost}</p>
              <p className="text-[10px] text-muted-foreground">{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-xs font-medium text-foreground mb-4">👥 Performance da Equipe</p>
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
      </div>
    </div>
  );
}
