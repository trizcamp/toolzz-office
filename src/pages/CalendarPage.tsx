import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
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
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { mockTasks } from "@/data/mockTasks";
import { mockMeetings } from "@/data/mockMeetings";
import { cn } from "@/lib/utils";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getEventsForDay = (day: Date) => {
    const tasks = mockTasks.filter((t) => {
      try { return isSameDay(parseISO(t.createdAt), day); } catch { return false; }
    });
    const meetings = mockMeetings.filter((m) => {
      try { return isSameDay(parseISO(m.date), day); } catch { return false; }
    });
    return { tasks, meetings };
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h1 className="text-lg font-semibold text-foreground">Calendário</h1>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-foreground min-w-[140px] text-center capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCurrentMonth(new Date())}>
            Hoje
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-px mb-1">
          {weekDays.map((d) => (
            <div key={d} className="text-[10px] uppercase tracking-widest text-muted-foreground text-center py-2 font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-px flex-1 bg-border/30 rounded-lg overflow-hidden">
          {days.map((day) => {
            const { tasks, meetings } = getEventsForDay(day);
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "bg-card p-1.5 min-h-[90px] flex flex-col",
                  !inMonth && "opacity-30"
                )}
              >
                <span className={cn(
                  "text-xs w-6 h-6 flex items-center justify-center rounded-full mb-1",
                  today ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                )}>
                  {format(day, "d")}
                </span>
                <div className="space-y-0.5 flex-1 overflow-hidden">
                  {meetings.map((m) => (
                    <Tooltip key={m.id}>
                      <TooltipTrigger asChild>
                        <div className="text-[9px] bg-primary/15 text-primary rounded px-1 py-0.5 truncate cursor-default">
                          {m.startTime} {m.title}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px]">
                        <p className="text-xs font-medium">{m.title}</p>
                        <p className="text-[10px] text-muted-foreground">{m.startTime} — {m.endTime}</p>
                        <p className="text-[10px] text-muted-foreground">{m.participants.length} participantes</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {tasks.map((t) => (
                    <Tooltip key={t.id}>
                      <TooltipTrigger asChild>
                        <div className="text-[9px] bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] rounded px-1 py-0.5 truncate cursor-default">
                          {t.id}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px]">
                        <p className="text-xs font-medium">{t.title}</p>
                        <p className="text-[10px] text-muted-foreground">{t.assignee.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
