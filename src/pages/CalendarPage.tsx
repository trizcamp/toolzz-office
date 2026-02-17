import { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  Circle,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  isSameDay,
  parseISO,
  addDays,
  isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTasks, type DbTask } from "@/hooks/useTasks";
import { useBoards } from "@/hooks/useBoards";
import { useAuth } from "@/hooks/useAuth";

const weekDaysShort = ["D", "S", "T", "Q", "Q", "S", "S"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SCHEDULE_DAYS_COUNT = 3;

const priorityColors: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30",
  medium: "bg-primary/20 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
};

const statusLabels: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "Em Progresso",
  review: "Em Revisão",
  done: "Concluído",
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduleStart, setScheduleStart] = useState(new Date());
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [centerCollapsed, setCenterCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const nowLineRef = useRef<HTMLDivElement>(null);
  const [selectedBoard, setSelectedBoard] = useState<string | null>("__all__");

  const { user } = useAuth();
  const { boards } = useBoards();

  // Fetch tasks for selected board (null = no filter, gets all)
  const { tasks: boardTasks } = useTasks(selectedBoard === "__all__" ? null : selectedBoard);

  // When "all" is selected, we pass null to useTasks which fetches all tasks
  const allTasks = boardTasks;

  useEffect(() => {
    nowLineRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, []);

  const miniCalDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const scheduleDays = useMemo(
    () => Array.from({ length: SCHEDULE_DAYS_COUNT }, (_, i) => addDays(scheduleStart, i)),
    [scheduleStart]
  );

  const tasksForDay = (day: Date): DbTask[] =>
    allTasks.filter((t) => {
      if (t.delivery_date) {
        try {
          return isSameDay(parseISO(t.delivery_date), day);
        } catch { return false; }
      }
      return false;
    });

  const taskCount = allTasks.filter((t) => t.delivery_date).length;

  const filteredItems = useMemo(() => {
    return tasksForDay(selectedDate);
  }, [selectedDate, allTasks]);

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Get board name for a task
  const getBoardName = (boardId: string) => {
    return boards.find((b) => b.id === boardId)?.name || "";
  };

  return (
    <div className="h-full flex">
      {/* ── Left Panel: Calendar sidebar ── */}
      {leftCollapsed ? (
        <div className="w-10 shrink-0 border-r border-border flex flex-col items-center pt-3">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLeftCollapsed(false)}>
            <PanelLeftOpen className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <div className="w-[260px] shrink-0 border-r border-border flex flex-col bg-card/50">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Calendário</h2>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setLeftCollapsed(true)}>
                <PanelLeftClose className="w-3.5 h-3.5" />
              </Button>
            </div>
            {/* Board selector */}
            <div className="space-y-1.5 mb-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Central</p>
              <Select value={selectedBoard || "__all__"} onValueChange={setSelectedBoard}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todas as centrais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas as centrais</SelectItem>
                  {boards.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category filters */}
            <div className="space-y-0.5">
              <button
                className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs bg-primary/15 text-primary font-medium"
              >
                <span>Tarefas</span>
                <span className="text-[10px] tabular-nums">{taskCount}</span>
              </button>
              <button
                className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs text-muted-foreground hover:bg-surface-hover hover:text-foreground opacity-50 cursor-not-allowed"
                disabled
              >
                <span>Reuniões</span>
                <Badge variant="outline" className="text-[8px] px-1 py-0 border-0 bg-muted text-muted-foreground">Em breve</Badge>
              </button>
            </div>
          </div>

          {/* Mini calendar */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-muted-foreground hover:text-foreground p-0.5">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium text-foreground capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </span>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-muted-foreground hover:text-foreground p-0.5">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0">
              {weekDaysShort.map((d, i) => (
                <div key={i} className="text-[10px] text-muted-foreground text-center py-1 font-medium">{d}</div>
              ))}
              {miniCalDays.map((day) => {
                const inMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);
                const selected = isSameDay(day, selectedDate);
                const hasTasks = tasksForDay(day).length > 0;
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => { setSelectedDate(day); setScheduleStart(day); }}
                    className={cn(
                      "relative w-full aspect-square flex items-center justify-center text-[11px] rounded-full transition-colors",
                      !inMonth && "opacity-25",
                      selected && "bg-primary text-primary-foreground font-semibold",
                      today && !selected && "ring-1 ring-primary text-primary font-semibold",
                      !selected && !today && "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                    )}
                  >
                    {format(day, "d")}
                    {hasTasks && !selected && (
                      <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Center Panel: Task list for selected day ── */}
      {centerCollapsed ? (
        <div className="w-10 shrink-0 border-r border-border flex flex-col items-center pt-3">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCenterCollapsed(false)}>
            <PanelLeftOpen className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <div className="w-[300px] shrink-0 border-r border-border flex flex-col bg-card/30">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground capitalize">
              Tarefas — {format(selectedDate, "dd MMM", { locale: ptBR })}
            </h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCenterCollapsed(true)}>
              <PanelLeftClose className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {filteredItems.map((t) => (
              <div key={t.id} className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-surface-hover transition-colors cursor-default">
                {t.status === "done" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--success))] mt-0.5 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground truncate">{t.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-muted-foreground font-mono">{t.display_id}</span>
                    <Badge variant="outline" className={cn("text-[8px] px-1 py-0 border-0", priorityColors[t.priority])}>
                      {t.priority}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{statusLabels[t.status]}</span>
                  </div>
                  {getBoardName(t.board_id) && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{getBoardName(t.board_id)}</p>
                  )}
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhuma tarefa para este dia</p>
            )}
          </div>
        </div>
      )}

      {/* ── Right Panel: Schedule (Google Calendar style) ── */}
      {rightCollapsed ? (
        <div className="w-10 shrink-0 flex flex-col items-center pt-3">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRightCollapsed(false)}>
            <PanelRightOpen className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
            <h3 className="text-xs font-semibold text-foreground">Agenda</h3>
            <div className="flex items-center gap-1 ml-auto">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setRightCollapsed(true)}>
                <PanelRightClose className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setScheduleStart(addDays(scheduleStart, -1))}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setScheduleStart(new Date())}>
                Hoje
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setScheduleStart(addDays(scheduleStart, 1))}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex border-b border-border shrink-0">
            <div className="w-12 shrink-0" />
            {scheduleDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex-1 px-2 py-2 text-center border-l border-border",
                  isToday(day) && "bg-primary/5"
                )}
              >
                <p className={cn("text-[10px] uppercase tracking-wide", isToday(day) ? "text-primary font-semibold" : "text-muted-foreground")}>
                  {isToday(day) ? "Hoje" : format(day, "EEE", { locale: ptBR })}
                </p>
                <p className={cn("text-lg font-semibold", isToday(day) ? "text-primary" : "text-foreground")}>
                  {format(day, "d")}
                </p>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto relative">
            <div className="flex min-h-0">
              <div className="w-12 shrink-0">
                {HOURS.map((h) => (
                  <div key={h} className="h-14 flex items-start justify-end pr-2 pt-0">
                    <span className="text-[10px] text-muted-foreground tabular-nums -mt-1.5">
                      {String(h).padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>

              {scheduleDays.map((day) => {
                const dayTasks = tasksForDay(day);
                const today = isToday(day);
                return (
                  <div key={day.toISOString()} className={cn("flex-1 border-l border-border relative", today && "bg-primary/[0.02]")}>
                    {HOURS.map((h) => (
                      <div key={h} className="h-14 border-b border-border/40" />
                    ))}

                    {today && (
                      <div
                        ref={nowLineRef}
                        className="absolute left-0 right-0 z-10 pointer-events-none"
                        style={{ top: `${(currentHour * 60 + currentMinute) / (24 * 60) * (24 * 56)}px` }}
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-destructive -ml-1" />
                          <div className="flex-1 h-px bg-destructive" />
                        </div>
                      </div>
                    )}

                    {/* Render tasks as all-day / top-of-grid events */}
                    {dayTasks.map((t, idx) => (
                      <div
                        key={t.id}
                        className={cn(
                          "absolute left-1 right-1 rounded-md px-1.5 py-1 overflow-hidden cursor-default z-[5] border",
                          priorityColors[t.priority] || "bg-primary/20 text-primary border-primary/30"
                        )}
                        style={{ top: `${4 + idx * 28}px`, height: "24px" }}
                      >
                        <p className="text-[10px] font-medium truncate">
                          {t.display_id} · {t.title}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
