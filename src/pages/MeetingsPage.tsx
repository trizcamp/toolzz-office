import { useState } from "react";
import { Calendar, Clock, Users, Eye, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { mockMeetings, type Meeting } from "@/data/mockMeetings";
import { AnimatePresence, motion } from "framer-motion";

export default function MeetingsPage() {
  const { toast } = useToast();
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Reunião agendada", description: "Sua reunião foi agendada com sucesso." });
  };

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-border shrink-0">
          <h1 className="text-lg font-semibold text-foreground">Reuniões</h1>
        </div>

        <Tabs defaultValue="history" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-3 shrink-0">
            <TabsList>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="schedule">Agendar</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="history" className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-3">
              {mockMeetings.map((meeting) => (
                <div key={meeting.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">{meeting.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{meeting.summary}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="gap-1.5 text-xs shrink-0" onClick={() => setSelectedMeeting(meeting)}>
                      <Eye className="w-3.5 h-3.5" /> Ver detalhes
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {meeting.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {meeting.startTime} — {meeting.endTime}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {meeting.participants.length}</span>
                    <Badge variant="outline" className="text-[10px]">{meeting.room}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {meeting.participants.map((p) => (
                      <div key={p.id} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                        {p.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                  {meeting.tasks.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {meeting.tasks.map((t) => (
                        <Badge key={t.id} variant="secondary" className="text-[10px]">{t.id}: {t.title}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="flex-1 overflow-y-auto px-6 py-4">
            <form onSubmit={handleSchedule} className="max-w-lg space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input placeholder="Nome da reunião" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input type="time" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sala</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione a sala" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="sprint-review">Sprint Review</SelectItem>
                    <SelectItem value="sessao-1-1">Sessão 1:1</SelectItem>
                    <SelectItem value="lobby">Lobby</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea placeholder="Pauta da reunião..." rows={3} />
              </div>
              <Button type="submit">Agendar Reunião</Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      {/* Side panel for meeting details */}
      <AnimatePresence>
        {selectedMeeting && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 420, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-l border-border bg-sidebar overflow-y-auto shrink-0"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">{selectedMeeting.title}</h2>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedMeeting(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <p>📅 {selectedMeeting.date} • {selectedMeeting.startTime} — {selectedMeeting.endTime}</p>
                <p>🏠 Sala: {selectedMeeting.room}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Participantes</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMeeting.participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5 bg-muted rounded-md px-2 py-1">
                      <div className="w-4 h-4 rounded-full bg-surface-hover flex items-center justify-center text-[8px] text-muted-foreground">
                        {p.name.charAt(0)}
                      </div>
                      <span className="text-[10px] text-secondary-foreground">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedMeeting.tasks.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Tarefas Geradas</p>
                  <div className="space-y-1">
                    {selectedMeeting.tasks.map((t) => (
                      <div key={t.id} className="text-xs bg-muted rounded-md px-3 py-2">
                        <span className="font-mono text-muted-foreground">{t.id}</span> — {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Resumo</p>
                <p className="text-sm text-secondary-foreground leading-relaxed">{selectedMeeting.summary}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Transcrição</p>
                <div className="space-y-3">
                  {selectedMeeting.transcript.map((entry, i) => (
                    <div key={i} className="space-y-0.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-medium text-foreground">{entry.speaker}</span>
                        <span className="text-[10px] text-muted-foreground">{entry.time}</span>
                      </div>
                      <p className="text-sm text-secondary-foreground">{entry.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
