import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Plus, Link2, Calendar, Clock, Users, Copy, ArrowRight, Sparkles, ExternalLink, UserPlus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMeetings } from "@/hooks/useMeetings";
import { useMembers } from "@/hooks/useMembers";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MeetingsPage() {
  const navigate = useNavigate();
  const { meetings, createMeeting } = useMeetings();
  const { members } = useMembers();
  const [joinCode, setJoinCode] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState({ title: "", date: "", time: "", description: "" });
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [preGeneratedCode, setPreGeneratedCode] = useState("");

  // Generate a meeting code when dialog opens
  const generateCode = () => {
    const hex = () => Math.random().toString(36).substring(2);
    return `${hex().substring(0, 3)}-${hex().substring(0, 4)}-${hex().substring(0, 3)}`;
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const filteredMembers = members.filter(m =>
    `${m.name} ${m.surname}`.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleInstantMeeting = async () => {
    try {
      const now = new Date();
      const result = await createMeeting.mutateAsync({
        title: `Reunião ${format(now, "dd/MM HH:mm")}`,
        date: now.toISOString().slice(0, 10),
        start_time: now.toTimeString().slice(0, 5),
      });
      if (result?.meeting_code) {
        navigate(`/meetings/${result.meeting_code}`);
      }
    } catch {
      toast.error("Erro ao criar reunião");
    }
  };

  const handleJoin = () => {
    const code = joinCode.trim().toLowerCase();
    if (!code) return;
    navigate(`/meetings/${code}`);
  };

  const handleSchedule = async () => {
    if (!scheduleData.title.trim()) {
      toast.error("Informe o título da reunião");
      return;
    }
    try {
      const result = await createMeeting.mutateAsync({
        title: scheduleData.title,
        date: scheduleData.date || new Date().toISOString().slice(0, 10),
        start_time: scheduleData.time || undefined,
        description: scheduleData.description || undefined,
        meeting_code: preGeneratedCode,
      });
      const link = `${window.location.origin}/meetings/${result?.meeting_code}`;
      setCreatedLink(link);
      toast.success("Reunião agendada!", {
        description: `Código: ${result?.meeting_code}`,
        action: {
          label: "Copiar link",
          onClick: () => {
            navigator.clipboard.writeText(link);
            toast.success("Link copiado!");
          },
        },
      });
    } catch {
      toast.error("Erro ao agendar reunião");
    }
  };

  const resetScheduleDialog = () => {
    setScheduleData({ title: "", date: "", time: "", description: "" });
    setSelectedMembers([]);
    setCreatedLink(null);
    setMemberSearch("");
    setPreGeneratedCode(generateCode());
  };

  const upcomingMeetings = meetings
    .filter((m: any) => m.status === "scheduled" || !m.end_time)
    .slice(0, 5);

  const pastMeetings = meetings
    .filter((m: any) => m.status === "ended" || m.end_time)
    .slice(0, 10);

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold text-foreground">Reuniões</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Hero section */}
        <div className="px-6 py-12 flex flex-col items-center text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center mb-6"
          >
            <Video className="w-10 h-10 text-primary" />
          </motion.div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Reuniões com IA integrada</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md">
            Crie reuniões instantâneas ou agende para depois. Compartilhe tela e use a IA para criar tarefas durante a call.
          </p>

          {/* Action cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mb-10">
            {/* Instant meeting */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleInstantMeeting}
              disabled={createMeeting.isPending}
              className="flex flex-col items-center gap-3 p-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-6 h-6" />
              <span className="text-sm font-medium">Nova reunião</span>
            </motion.button>

            {/* Schedule */}
            <Dialog open={scheduleOpen} onOpenChange={(open) => { setScheduleOpen(open); if (open) { setPreGeneratedCode(generateCode()); } if (!open) resetScheduleDialog(); }}>
              <DialogTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card border border-border hover:bg-muted transition-colors text-foreground"
                >
                  <Calendar className="w-6 h-6" />
                  <span className="text-sm font-medium">Agendar</span>
                </motion.button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Agendar reunião</DialogTitle>
                </DialogHeader>

                {!createdLink ? (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        placeholder="Ex: Daily standup"
                        value={scheduleData.title}
                        onChange={(e) => setScheduleData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Data</Label>
                        <Input
                          type="date"
                          value={scheduleData.date}
                          onChange={(e) => setScheduleData(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Horário</Label>
                        <Input
                          type="time"
                          value={scheduleData.time}
                          onChange={(e) => setScheduleData(prev => ({ ...prev, time: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição (opcional)</Label>
                      <Textarea
                        placeholder="Pauta da reunião..."
                        value={scheduleData.description}
                        onChange={(e) => setScheduleData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    {/* Invite collaborators */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5" /> Convidar colaboradores
                      </Label>
                      {selectedMembers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {selectedMembers.map(id => {
                            const m = members.find(mb => mb.id === id);
                            if (!m) return null;
                            return (
                              <Badge key={id} variant="secondary" className="gap-1 pr-1">
                                <span className="text-xs">{m.name} {m.surname?.charAt(0)}.</span>
                                <button onClick={() => toggleMember(id)} className="hover:text-destructive">
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-start text-xs text-muted-foreground h-9 gap-2">
                            <Users className="w-3.5 h-3.5" />
                            {selectedMembers.length > 0 ? `${selectedMembers.length} selecionado(s)` : "Selecionar membros..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-2" align="start">
                          <Input
                            placeholder="Buscar membro..."
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            className="h-8 text-xs mb-2"
                          />
                          <ScrollArea className="max-h-48">
                            <div className="space-y-0.5">
                              {filteredMembers.map(m => {
                                const isSelected = selectedMembers.includes(m.id);
                                return (
                                  <button
                                    key={m.id}
                                    onClick={() => toggleMember(m.id)}
                                    className={cn(
                                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors",
                                      isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                                    )}
                                  >
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={m.avatar_url || ""} />
                                      <AvatarFallback className="text-[10px]">{m.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="flex-1 truncate">{m.name} {m.surname}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                                  </button>
                                );
                              })}
                              {filteredMembers.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-3">Nenhum membro encontrado</p>
                              )}
                            </div>
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* External share link */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5" /> Link externo para clientes
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Compartilhe este link com pessoas externas para que entrem na reunião.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={`${window.location.origin}/meetings/${preGeneratedCode}`}
                          className="text-xs h-9 bg-muted"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-9 shrink-0 gap-1.5"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/meetings/${preGeneratedCode}`);
                            toast.success("Link copiado!");
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" /> Copiar
                        </Button>
                      </div>
                    </div>

                    <Button onClick={handleSchedule} disabled={createMeeting.isPending} className="w-full">
                      Agendar reunião
                    </Button>
                  </div>
                ) : (
                  /* Post-creation: show link + share options */
                  <div className="space-y-5 pt-2">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{scheduleData.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {scheduleData.date && format(new Date(scheduleData.date + "T12:00"), "dd/MM/yyyy")}
                          {scheduleData.time && ` às ${scheduleData.time}`}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5" /> Link da reunião
                      </Label>
                      <p className="text-[10px] text-muted-foreground">Compartilhe este link com colaboradores internos ou clientes externos</p>
                      <div className="flex gap-2">
                        <Input readOnly value={createdLink} className="text-xs h-9 bg-muted" />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-9 shrink-0 gap-1.5"
                          onClick={() => {
                            navigator.clipboard.writeText(createdLink!);
                            toast.success("Link copiado!");
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" /> Copiar
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 gap-1.5 text-xs"
                        onClick={() => {
                          const code = createdLink!.split("/meetings/")[1];
                          navigate(`/meetings/${code}`);
                        }}
                      >
                        <ArrowRight className="w-3.5 h-3.5" /> Entrar agora
                      </Button>
                      <Button
                        variant="default"
                        className="flex-1 gap-1.5 text-xs"
                        onClick={() => { setScheduleOpen(false); resetScheduleDialog(); }}
                      >
                        Concluir
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

          </div>

          {/* Upcoming meetings */}
          {upcomingMeetings.length > 0 && (
            <div className="w-full max-w-xl text-left">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Próximas reuniões</h3>
              <div className="space-y-2">
                {upcomingMeetings.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-muted transition-colors cursor-pointer group"
                    onClick={() => navigate(`/meetings/${m.meeting_code}`)}
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {m.date}</span>
                        {m.start_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {m.start_time}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(`${window.location.origin}/meetings/${m.meeting_code}`);
                          toast.success("Link copiado!");
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past meetings */}
          {pastMeetings.length > 0 && (
            <div className="w-full max-w-xl text-left mt-8">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Reuniões anteriores</h3>
              <div className="space-y-2">
                {pastMeetings.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50 hover:bg-muted transition-colors cursor-pointer group"
                    onClick={() => navigate(`/meetings/${m.meeting_code}`)}
                  >
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                        <span>{m.date}</span>
                        {m.start_time && m.end_time && <span>{m.start_time} — {m.end_time}</span>}
                        {m.summary && <span className="truncate max-w-[200px]">{m.summary}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
