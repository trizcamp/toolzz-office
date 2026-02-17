import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Globe, Calendar, Briefcase, TrendingUp, Star, DollarSign, FileText, Award, Target, Clock, CheckCircle2, BarChart3, Zap } from "lucide-react";
import { useMembers } from "@/hooks/useMembers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  memberId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOCK_SKILLS = [
  { name: "Product Discovery", level: 92 },
  { name: "Roadmap Strategy", level: 88 },
  { name: "User Story Mapping", level: 95 },
  { name: "Stakeholder Mgmt", level: 85 },
  { name: "Data Analysis", level: 78 },
  { name: "Scrum / Kanban", level: 90 },
  { name: "UX Research", level: 72 },
  { name: "OKRs & Métricas", level: 80 },
];

const MOCK_CONTRACT = {
  role: "Product Owner",
  department: "Produto",
  type: "CLT",
  workload: "40h semanais",
  startDate: "01/03/2025",
  manager: "CEO",
  level: "Sênior",
  location: "Remoto",
};

const MOCK_FINANCIAL = {
  salary: "R$ 14.500,00",
  bonus: "R$ 2.900,00",
  benefits: [
    { name: "Vale Refeição", value: "R$ 1.100,00" },
    { name: "Plano de Saúde", value: "R$ 890,00" },
    { name: "Home Office", value: "R$ 250,00" },
    { name: "Educação", value: "R$ 500,00" },
  ],
  totalComp: "R$ 20.140,00",
};

export default function MemberProfileDialog({ memberId, open, onOpenChange }: Props) {
  const { members } = useMembers();

  const { data: taskStats } = useQuery({
    queryKey: ["member-task-stats", memberId],
    queryFn: async () => {
      const { data } = await supabase
        .from("task_assignees")
        .select("task_id, tasks(status)")
        .eq("user_id", memberId!) as any;
      const all = data || [];
      return {
        total: all.length,
        in_progress: all.filter((r: any) => r.tasks?.status === "in_progress").length,
        done: all.filter((r: any) => r.tasks?.status === "done").length,
        review: all.filter((r: any) => r.tasks?.status === "review").length,
      };
    },
    enabled: !!memberId && open,
  });

  const member = members.find((m) => m.id === memberId);
  if (!member) return null;

  const joinDate = new Date(member.created_at).toLocaleDateString("pt-BR", {
    day: "numeric", month: "long", year: "numeric",
  });

  const totalTasks = taskStats?.total || 0;
  const doneTasks = taskStats?.done || 0;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Perfil do colaborador</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="flex items-center gap-3 pt-1">
          <Avatar className="w-14 h-14">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback className="text-xl font-semibold">
              {(member.name || "?")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground truncate">
                {member.name} {member.surname}
              </h3>
              <Badge variant="outline" className="text-[9px] shrink-0 border-primary/30 text-primary">
                P.O.
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="mt-2">
          <TabsList className="w-full grid grid-cols-5 h-9">
            <TabsTrigger value="profile" className="text-[11px] px-1">Perfil</TabsTrigger>
            <TabsTrigger value="skills" className="text-[11px] px-1">Skills</TabsTrigger>
            <TabsTrigger value="performance" className="text-[11px] px-1">Performance</TabsTrigger>
            <TabsTrigger value="contract" className="text-[11px] px-1">Contrato</TabsTrigger>
            <TabsTrigger value="financial" className="text-[11px] px-1">Financeiro</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-3">
            <div className="space-y-2.5">
              {member.email && (
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{member.phone}</span>
                </div>
              )}
              {member.language && (
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{member.language}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Membro desde {joinDate}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Product Owner · Sênior</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <Target className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Departamento de Produto</span>
              </div>
            </div>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-3">
            <div className="space-y-2.5">
              {MOCK_SKILLS.map((skill) => (
                <div key={skill.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-foreground">{skill.name}</span>
                    <span className="text-[10px] font-medium text-primary">{skill.level}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/80 transition-all duration-700"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["Jira", "Figma", "Amplitude", "Hotjar", "Notion", "Miro"].map((tool) => (
                <Badge key={tool} variant="secondary" className="text-[10px] px-2 py-0.5">
                  {tool}
                </Badge>
              ))}
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Tarefas totais" value={totalTasks} icon={<Briefcase className="w-3.5 h-3.5" />} />
              <StatCard label="Concluídas" value={doneTasks} icon={<CheckCircle2 className="w-3.5 h-3.5" />} />
              <StatCard label="Em progresso" value={taskStats?.in_progress || 0} icon={<Clock className="w-3.5 h-3.5" />} />
              <StatCard label="Em revisão" value={taskStats?.review || 0} icon={<FileText className="w-3.5 h-3.5" />} />
            </div>
            <div className="border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground">Taxa de conclusão</span>
                <span className="text-xs font-semibold text-foreground">{completionRate}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
            {/* Mock sprint velocity */}
            <div className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
                <span>Velocidade (últimos sprints)</span>
              </div>
              <div className="flex items-end gap-1 h-10">
                {[18, 22, 15, 28, 24, 30, 26].map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-primary/60 hover:bg-primary transition-colors"
                    style={{ height: `${(v / 30) * 100}%` }}
                    title={`Sprint ${i + 1}: ${v} pts`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>S1</span><span>S2</span><span>S3</span><span>S4</span><span>S5</span><span>S6</span><span>S7</span>
              </div>
            </div>
          </TabsContent>

          {/* Contract Tab */}
          <TabsContent value="contract" className="space-y-3">
            <div className="space-y-2.5">
              {[
                { icon: <Award className="w-3.5 h-3.5" />, label: "Cargo", value: MOCK_CONTRACT.role },
                { icon: <Target className="w-3.5 h-3.5" />, label: "Departamento", value: MOCK_CONTRACT.department },
                { icon: <FileText className="w-3.5 h-3.5" />, label: "Tipo", value: MOCK_CONTRACT.type },
                { icon: <Clock className="w-3.5 h-3.5" />, label: "Jornada", value: MOCK_CONTRACT.workload },
                { icon: <Calendar className="w-3.5 h-3.5" />, label: "Início", value: MOCK_CONTRACT.startDate },
                { icon: <TrendingUp className="w-3.5 h-3.5" />, label: "Nível", value: MOCK_CONTRACT.level },
                { icon: <Briefcase className="w-3.5 h-3.5" />, label: "Gestor", value: MOCK_CONTRACT.manager },
                { icon: <Globe className="w-3.5 h-3.5" />, label: "Modalidade", value: MOCK_CONTRACT.location },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-primary">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <span className="text-xs font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-3">
            <div className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Salário base</span>
                <span className="text-sm font-semibold text-foreground">{MOCK_FINANCIAL.salary}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Bônus variável</span>
                <span className="text-sm font-medium text-primary">{MOCK_FINANCIAL.bonus}</span>
              </div>
            </div>

            <div className="border border-border rounded-lg p-3 space-y-2">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-primary" /> Benefícios
              </span>
              {MOCK_FINANCIAL.benefits.map((b) => (
                <div key={b.name} className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{b.name}</span>
                  <span className="text-[11px] font-medium text-foreground">{b.value}</span>
                </div>
              ))}
            </div>

            <div className="border border-primary/20 bg-primary/5 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-primary" /> Remuneração total
                </span>
                <span className="text-sm font-bold text-primary">{MOCK_FINANCIAL.totalComp}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-3 flex flex-col gap-1">
      <div className="text-muted-foreground">{icon}</div>
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
