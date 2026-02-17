import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Globe, Calendar } from "lucide-react";
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
      };
    },
    enabled: !!memberId && open,
  });

  const member = members.find((m) => m.id === memberId);
  if (!member) return null;

  const totalTasks = taskStats?.total || 0;
  const inProgressTasks = taskStats?.in_progress || 0;
  const doneTasks = taskStats?.done || 0;

  const joinDate = new Date(member.created_at).toLocaleDateString("pt-BR", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="sr-only">Perfil do colaborador</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 pt-2">
          {/* Avatar */}
          <Avatar className="w-20 h-20">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback className="text-2xl font-semibold">
              {(member.name || "?")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Name & info */}
          <div className="text-center space-y-1">
            <h3 className="text-lg font-semibold text-foreground">
              {member.name} {member.surname}
            </h3>
            <p className="text-xs text-muted-foreground">{member.email}</p>
          </div>

          {/* Contact info */}
          <div className="w-full space-y-2 border-t border-border pt-3">
            {member.email && (
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>{member.email}</span>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>{member.phone}</span>
              </div>
            )}
            {member.language && (
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span>{member.language}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>Membro desde {joinDate}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="w-full grid grid-cols-3 gap-2 border-t border-border pt-3">
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">{totalTasks}</p>
              <p className="text-[10px] text-muted-foreground">Tarefas</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">{inProgressTasks}</p>
              <p className="text-[10px] text-muted-foreground">Em progresso</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">{doneTasks}</p>
              <p className="text-[10px] text-muted-foreground">Concluídas</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
