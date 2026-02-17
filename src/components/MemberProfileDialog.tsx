import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, Globe, Calendar, Briefcase, TrendingUp, Star, DollarSign, FileText } from "lucide-react";
import { useMembers } from "@/hooks/useMembers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  memberId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">
              {member.name} {member.surname}
            </h3>
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
            </div>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-3">
            <div className="text-center py-6 space-y-2">
              <Star className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground">Nenhuma skill cadastrada ainda.</p>
              <p className="text-[10px] text-muted-foreground/60">Em breve será possível gerenciar competências aqui.</p>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Tarefas totais" value={totalTasks} icon={<Briefcase className="w-3.5 h-3.5" />} />
              <StatCard label="Concluídas" value={doneTasks} icon={<TrendingUp className="w-3.5 h-3.5" />} />
              <StatCard label="Em progresso" value={taskStats?.in_progress || 0} icon={<Star className="w-3.5 h-3.5" />} />
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
          </TabsContent>

          {/* Contract Tab */}
          <TabsContent value="contract" className="space-y-3">
            <div className="text-center py-6 space-y-2">
              <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground">Nenhum contrato vinculado.</p>
              <p className="text-[10px] text-muted-foreground/60">Em breve será possível gerenciar contratos aqui.</p>
            </div>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-3">
            <div className="text-center py-6 space-y-2">
              <DollarSign className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground">Nenhum dado financeiro disponível.</p>
              <p className="text-[10px] text-muted-foreground/60">Em breve será possível gerenciar dados financeiros aqui.</p>
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
