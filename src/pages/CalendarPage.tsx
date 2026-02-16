import { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Kanban,
  Video,
  Circle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { mockTasks, type Task } from "@/data/mockTasks";
import { mockMeetings, type Meeting } from "@/data/mockMeetings";
import { cn } from "@/lib/utils";

const weekDaysShort = ["D", "S", "T", "Q", "Q", "S", "S"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SCHEDULE_DAYS_COUNT = 3;

type FilterMode = "unplanned" | "planned" | "all";

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filter, setFilter] = useState<FilterMode>("all");
  const [scheduleStart, setScheduleStart] = useState(new Date());
  const nowLineRef = useRef<HTMLDivElement>(null);

  // scroll to current time on mount
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

  // helpers
  const tasksForDay = (day: Date): Task[] =>
    mockTasks.filter((t) => {
      try { return isSameDay(parseISO(t.createdAt), day); } catch { return false; }
    });

  const meetingsForDay = (day: Date): Meeting[] =>
    mockMeetings.filter((m) => {
      try { return isSameDay(parseISO(m.date), day); } catch { return false; }
    });

  const plannedTasks = mockTasks.filter((t) => t.status !== "backlog");
  const unplannedTasks = mockTasks.filter((t) => t.status === "backlog");

  const filteredItems = useMemo(() => {
    const dayTasks = tasksForDay(selectedDate);
    const dayMeetings = meetingsForDay(selectedDate);
    if (filter === "unplanned") return { tasks: dayTasks.filter((t) => t.status === "backlog"), meetings: [] as Meeting[] };
    if (filter === "planned") return { tasks: dayTasks.filter((t) => t.status !== "backlog"), meetings: dayMeetings };
    return { tasks: dayTasks, meetings: dayMeetings };
  }, [selectedDate, filter]);

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return (
    <div className="h-full flex">
      {/* ── Left Panel: Planner sidebar ── */}
      <div className="w-[260px] shrink-0 border-r border-border flex flex-col bg-card/50">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground mb-3">Planner</h2>
          {/* Filters */}
          <div className="space-y-0.5">
            {([
              { key: "unplanned" as FilterMode, label: "Não planejadas", count: unplannedTasks.length },
              { key: "planned" as FilterMode, label: "Planejadas", count: plannedTasks.length },
              { key: "all" as FilterMode, label: "Todas", count: mockTasks.length },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors",
                  filter === f.key
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                )}
              >
                <span>{f.label}</span>
                <span className="text-[10px] tabular-nums">{f.count}</span>
              </button>
            ))}
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
              const hasMeetings = meetingsForDay(day).length > 0;
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
                  {(hasTasks || hasMeetings) && !selected && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Center Panel: Task list ── */}
      <div className="w-[300px] shrink-0 border-r border-border flex flex-col bg-card/30">
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-semibold text-foreground mb-1 capitalize">
            {filter === "unplanned" ? "Não planejadas" : filter === "planned" ? "Planejadas" : "Todas"}{" "}
            — {format(selectedDate, "dd MMM", { locale: ptBR })}
          </h3>
        </div>

        {/* Add item */}
        <div className="px-4 py-2 border-b border-border">
          <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar item</span>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredItems.meetings.map((m) => (
            <div key={m.id} className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-surface-hover transition-colors cursor-default">
              <Video className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-foreground truncate">{m.title}</p>
                <p className="text-[10px] text-muted-foreground">{m.startTime} — {m.endTime}</p>
              </div>
            </div>
          ))}
          {filteredItems.tasks.map((t) => (
            <div key={t.id} className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-surface-hover transition-colors cursor-default">
              {t.status === "done" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--success))] mt-0.5 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-xs text-foreground truncate">{t.title}</p>
                <p className="text-[10px] text-muted-foreground">{t.id} · {t.assignee.name}</p>
              </div>
            </div>
          ))}
          {filteredItems.tasks.length === 0 && filteredItems.meetings.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">Nenhum item para este dia</p>
          )}
        </div>
      </div>

      {/* ── Right Panel: Schedule ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <h3 className="text-xs font-semibold text-foreground">Agenda</h3>
          <div className="flex items-center gap-1 ml-auto">
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

        {/* Day columns headers */}
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

        {/* Time grid */}
        <div className="flex-1 overflow-y-auto relative">
          <div className="flex min-h-0">
            {/* Hours column */}
            <div className="w-12 shrink-0">
              {HOURS.map((h) => (
                <div key={h} className="h-14 flex items-start justify-end pr-2 pt-0">
                  <span className="text-[10px] text-muted-foreground tabular-nums -mt-1.5">
                    {String(h).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {scheduleDays.map((day) => {
              const dayMeetings = meetingsForDay(day);
              const today = isToday(day);
              return (
                <div key={day.toISOString()} className={cn("flex-1 border-l border-border relative", today && "bg-primary/[0.02]")}>
                  {HOURS.map((h) => (
                    <div key={h} className="h-14 border-b border-border/40" />
                  ))}

                  {/* Now line */}
                  {today && (
                    <div
                      ref={nowLineRef}
                      className="absolute left-0 right-0 z-10 pointer-events-none"
                      style={{ top: `${(currentHour * 60 + currentMinute) / (24 * 60) * (24 * 56)}px` }}
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                        <div className="flex-1 h-px bg-red-500" />
                      </div>
                    </div>
                  )}

                  {/* Meeting blocks */}
                  {dayMeetings.map((m) => {
                    const [sh, sm] = m.startTime.split(":").map(Number);
                    const [eh, em] = m.endTime.split(":").map(Number);
                    const topPx = (sh * 60 + sm) / (24 * 60) * (24 * 56);
                    const heightPx = ((eh * 60 + em) - (sh * 60 + sm)) / (24 * 60) * (24 * 56);
                    return (
                      <div
                        key={m.id}
                        className="absolute left-1 right-1 rounded-md bg-primary/20 border border-primary/30 px-1.5 py-1 overflow-hidden cursor-default z-[5]"
                        style={{ top: `${topPx}px`, height: `${Math.max(heightPx, 20)}px` }}
                      >
                        <p className="text-[10px] font-medium text-primary truncate">{m.title}</p>
                        <p className="text-[9px] text-primary/70">{m.startTime} — {m.endTime}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
