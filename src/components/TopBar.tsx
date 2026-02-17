import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useMembers";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Settings, LogOut, Check, CheckCheck, Trash2, UserPlus, ArrowRightLeft } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import SettingsDialog from "@/components/settings/SettingsDialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeIcons: Record<string, React.ReactNode> = {
  task_assigned: <UserPlus className="w-3.5 h-3.5 text-primary" />,
  task_created: <CheckCheck className="w-3.5 h-3.5 text-[hsl(var(--success))]" />,
  task_status: <ArrowRightLeft className="w-3.5 h-3.5 text-[hsl(var(--warning))]" />,
  info: <Bell className="w-3.5 h-3.5 text-muted-foreground" />,
};

export default function TopBar() {
  const { user, signOut } = useAuth();
  const { currentMember } = useMembers();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();

  const initials = currentMember?.name
    ? `${currentMember.name.charAt(0)}${currentMember.surname?.charAt(0) || ""}`.toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "?";

  const handleNotifClick = (n: { id: string; link: string | null; read: boolean }) => {
    if (!n.read) markAsRead.mutate(n.id);
    if (n.link) {
      navigate(n.link);
      setNotifOpen(false);
    }
  };

  return (
    <>
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        {/* Search */}
        <div className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 w-80">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full" />
          <kbd className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <button className="relative p-2 rounded-lg hover:bg-surface-hover transition-colors text-muted-foreground hover:text-foreground">
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h4 className="text-sm font-semibold text-foreground">Notificações</h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] gap-1 text-muted-foreground"
                    onClick={() => markAllAsRead.mutate()}
                  >
                    <CheckCheck className="w-3 h-3" />
                    Marcar todas como lidas
                  </Button>
                )}
              </div>
              <ScrollArea className="max-h-80">
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Nenhuma notificação</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 border-b border-border/50 cursor-pointer hover:bg-surface-hover transition-colors",
                        !n.read && "bg-primary/5 border-l-2 border-l-primary"
                      )}
                      onClick={() => handleNotifClick(n)}
                    >
                      <div className="mt-0.5 shrink-0">
                        {typeIcons[n.type] || typeIcons.info}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-xs truncate", !n.read ? "text-foreground font-medium" : "text-muted-foreground")}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{n.body}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        {!n.read && (
                          <button
                            className="p-1 rounded hover:bg-surface text-muted-foreground hover:text-foreground"
                            onClick={(e) => { e.stopPropagation(); markAsRead.mutate(n.id); }}
                            title="Marcar como lida"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          className="p-1 rounded hover:bg-surface text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); deleteNotification.mutate(n.id); }}
                          title="Excluir"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <button className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-muted-foreground hover:text-foreground" onClick={() => setSettingsOpen(true)}>
            <Settings className="w-[18px] h-[18px]" />
          </button>
          <button className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-muted-foreground hover:text-foreground" onClick={signOut} title="Sair">
            <LogOut className="w-[18px] h-[18px]" />
          </button>
          {currentMember?.avatar_url ? (
            <img src={currentMember.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover ml-2" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center ml-2">
              <span className="text-xs font-medium text-primary">{initials}</span>
            </div>
          )}
        </div>
      </header>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
