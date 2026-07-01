import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import {
  useGetCurrentCycle,
  useGetCycleStats,
  useGetCycleCalendar,
  useListCycles,
  useCreateCycle,
  useUpdateCycle,
  getGetCycleCalendarQueryKey,
  getGetCurrentCycleQueryKey,
  getGetCycleStatsQueryKey,
  getListCyclesQueryKey,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Circle } from "lucide-react";

type Flow = "light" | "medium" | "heavy";

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayStr(): string {
  return localDateStr(new Date());
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("T")[0].split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function fmtDate(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return "";
  const d = parseLocalDate(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(d);
}

const DAY_TYPE_CLASS: Record<string, string> = {
  period: "bg-[hsl(var(--phase-menstruation))] text-white font-semibold",
  "predicted-period": "bg-[hsl(var(--phase-menstruation)/0.18)] text-[hsl(var(--phase-menstruation))] border border-dashed border-[hsl(var(--phase-menstruation)/0.5)]",
  fertile: "bg-[hsl(var(--phase-follicular)/0.25)] text-[hsl(var(--phase-follicular))]",
  ovulation: "bg-[hsl(var(--phase-ovulation))] text-white font-semibold",
  normal: "text-foreground hover:bg-secondary/60",
};

export default function Cycle() {
  const { language } = useAuth();
  const tt = useTranslation(language);
  const t = tt.cycle;
  const locale = language === "ar" ? "ar" : "en";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const now = new Date();
  const [view, setView] = useState<{ year: number; month: number }>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  const { data: currentCycle } = useGetCurrentCycle();
  const { data: stats } = useGetCycleStats();
  const { data: calendar } = useGetCycleCalendar({ year: view.year, month: view.month });
  const { data: cycles } = useListCycles({ limit: 6 });

  const createCycle = useCreateCycle();
  const updateCycle = useUpdateCycle();

  const [startDate, setStartDate] = useState<string>(todayStr());
  const [endDate, setEndDate] = useState<string>("");
  const [flow, setFlow] = useState<Flow>("medium");
  const [notes, setNotes] = useState<string>("");

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetCycleCalendarQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetCurrentCycleQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetCycleStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListCyclesQueryKey() });
  };

  const calendarByDate = useMemo(() => {
    const map = new Map<string, { type: string; hasLog: boolean }>();
    (calendar ?? []).forEach((d) => map.set(d.date, { type: d.type, hasLog: !!d.hasLog }));
    return map;
  }, [calendar]);

  const weekdays = useMemo(
    () =>
      [...Array(7)].map((_, i) =>
        new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(2024, 0, 7 + i)),
      ),
    [locale],
  );

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
        new Date(view.year, view.month - 1, 1),
      ),
    [locale, view],
  );

  const leadingBlanks = new Date(view.year, view.month - 1, 1).getDay();
  const daysInMonth = new Date(view.year, view.month, 0).getDate();
  const today = todayStr();

  const changeMonth = (delta: number) => {
    setView((v) => {
      const d = new Date(v.year, v.month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  };

  const handleSave = () => {
    if (!startDate) return;
    createCycle.mutate(
      {
        data: {
          startDate,
          endDate: endDate || undefined,
          flowIntensity: flow,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: t.saved });
          setEndDate("");
          setNotes("");
          invalidateAll();
        },
        onError: () => toast({ title: t.saveError, variant: "destructive" }),
      },
    );
  };

  const handleMarkEnd = (id: number) => {
    updateCycle.mutate(
      { id, data: { endDate: today } },
      {
        onSuccess: () => {
          toast({ title: t.endSaved });
          invalidateAll();
        },
        onError: () => toast({ title: t.saveError, variant: "destructive" }),
      },
    );
  };

  const phaseKey = (currentCycle?.phase ?? "") as keyof typeof t.phases;
  const phaseLabel = t.phases[phaseKey] ?? currentCycle?.phase ?? "—";
  const hasCycle = currentCycle?.cycleDay != null;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 pb-24">
      <h1 className="text-2xl font-serif font-bold text-foreground">{t.title}</h1>

      {/* Current phase summary */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        {hasCycle ? (
          <>
            <p className="text-sm text-muted-foreground">{t.currentPhase}</p>
            <h2 className="font-semibold text-xl mb-1">{phaseLabel}</h2>
            <p className="text-sm text-muted-foreground">
              {t.day} {currentCycle?.cycleDay} {t.ofYourCycle}
            </p>
            {currentCycle?.nextPeriodDate && (
              <p className="text-sm mt-3 text-primary font-medium">
                {t.nextPeriod}: {fmtDate(currentCycle.nextPeriodDate, locale)}
              </p>
            )}
          </>
        ) : (
          <>
            <h2 className="font-semibold text-lg mb-1">{t.notTracking}</h2>
            <p className="text-sm text-muted-foreground">{t.startTracking}</p>
          </>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <p className="text-sm text-muted-foreground">{t.avgLength}</p>
          <p className="text-2xl font-bold text-primary">
            {stats?.averageCycleLength ? Math.round(stats.averageCycleLength) : 28}d
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-muted-foreground">{t.regularity}</p>
          <p className="text-2xl font-bold text-primary">{stats?.regularityScore ?? 100}%</p>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} aria-label="Previous month">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold capitalize">{monthLabel}</span>
          <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} aria-label="Next month">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
          {weekdays.map((w) => (
            <div key={w} className="py-1">{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`b${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${view.year}-${String(view.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const info = calendarByDate.get(dateStr);
            const type = info?.type ?? "normal";
            const isToday = dateStr === today;
            const isSelected = dateStr === startDate;
            return (
              <button
                key={dateStr}
                onClick={() => setStartDate(dateStr)}
                className={`relative aspect-square rounded-full flex items-center justify-center text-sm transition-colors ${DAY_TYPE_CLASS[type] ?? DAY_TYPE_CLASS.normal} ${isToday ? "ring-2 ring-primary" : ""} ${isSelected ? "outline outline-2 outline-primary" : ""}`}
              >
                {day}
                {info?.hasLog && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-current opacity-70" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Circle className="h-3 w-3 fill-[hsl(var(--phase-menstruation))] text-[hsl(var(--phase-menstruation))]" />{t.period}</span>
          <span className="flex items-center gap-1"><Circle className="h-3 w-3 fill-[hsl(var(--phase-menstruation)/0.3)] text-[hsl(var(--phase-menstruation)/0.5)]" />{t.predicted}</span>
          <span className="flex items-center gap-1"><Circle className="h-3 w-3 fill-[hsl(var(--phase-follicular)/0.4)] text-[hsl(var(--phase-follicular))]" />{t.fertile}</span>
          <span className="flex items-center gap-1"><Circle className="h-3 w-3 fill-[hsl(var(--phase-ovulation))] text-[hsl(var(--phase-ovulation))]" />{t.ovulation}</span>
        </div>
      </Card>

      {/* Log period form */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold text-lg">{t.logPeriod}</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">{t.startDate}</label>
            <Input type="date" value={startDate} max={today} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">
              {t.endDate} <span className="text-muted-foreground font-normal">({t.optional})</span>
            </label>
            <Input type="date" value={endDate} min={startDate} max={today} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">{t.flow}</label>
          <div className="flex gap-2 mt-2">
            {(["light", "medium", "heavy"] as Flow[]).map((f) => (
              <Button
                key={f}
                type="button"
                variant={flow === f ? "default" : "outline"}
                onClick={() => setFlow(f)}
                className="flex-1 rounded-xl"
              >
                {t[f]}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">{t.notes}</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.notesPlaceholder}
            className="mt-1 resize-none"
            rows={2}
          />
        </div>

        <Button onClick={handleSave} disabled={createCycle.isPending || !startDate} className="w-full rounded-2xl h-12">
          {createCycle.isPending ? t.saving : t.save}
        </Button>
      </Card>

      {/* Recent periods */}
      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-3">{t.recentPeriods}</h2>
        {(cycles ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noPeriods}</p>
        ) : (
          <ul className="space-y-2">
            {(cycles ?? []).map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                <div>
                  <span className="font-medium">{fmtDate(c.startDate, locale)}</span>
                  <span className="text-muted-foreground">
                    {" "}→ {c.endDate ? fmtDate(c.endDate, locale) : t.ongoing}
                  </span>
                  {c.flowIntensity && (
                    <span className="ml-2 text-xs text-muted-foreground capitalize">· {t[c.flowIntensity as Flow] ?? c.flowIntensity}</span>
                  )}
                </div>
                {!c.endDate && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateCycle.isPending}
                    onClick={() => handleMarkEnd(c.id)}
                    className="rounded-xl"
                  >
                    {t.markEnd}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
