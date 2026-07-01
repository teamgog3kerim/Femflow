import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import {
  useGetCurrentCycle,
  useListHealthLogs,
  useCreateHealthLog,
  getListHealthLogsQueryKey,
  getGetHealthLogSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { phaseColor, normalizePhase, localDateStr } from "@/lib/phase";
import { Droplets, Dumbbell, Salad, Bell, Check, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function Tips() {
  const { language } = useAuth();
  const tt = useTranslation(language);
  const t = tt.tips;
  const queryClient = useQueryClient();

  const { data: currentCycle } = useGetCurrentCycle();
  const phaseKey = normalizePhase(currentCycle?.phase);
  const color = phaseColor(currentCycle?.phase);
  const phaseLabel = tt.cycle.phases[phaseKey === "menstruation" ? "menstrual" : phaseKey];
  const tips = t[phaseKey];
  const plan = t.plan[phaseKey];

  const today = useMemo(() => localDateStr(new Date()), []);
  const listParams = { startDate: today, endDate: today };
  const { data: todayLogs } = useListHealthLogs(listParams);
  const createLog = useCreateHealthLog();

  const waterLogged = (todayLogs ?? []).reduce(
    (sum, l) => sum + (l.waterIntakeLiters ? parseFloat(String(l.waterIntakeLiters)) : 0),
    0,
  );
  const waterPct = Math.min(100, Math.round((waterLogged / plan.water) * 100));
  const reached = waterLogged >= plan.water;

  const addWater = (liters: number) => {
    createLog.mutate(
      { data: { logDate: today, waterIntakeLiters: liters } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListHealthLogsQueryKey(listParams) });
          queryClient.invalidateQueries({ queryKey: getGetHealthLogSummaryQueryKey() });
        },
      },
    );
  };

  // Daily habits checklist — persisted per day in localStorage.
  const habitsKey = `femflow_habits_${today}_${phaseKey}`;
  const [checked, setChecked] = useState<boolean[]>(() => plan.habits.map(() => false));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(habitsKey);
      if (raw) {
        const arr = JSON.parse(raw) as boolean[];
        if (Array.isArray(arr) && arr.length === plan.habits.length) {
          setChecked(arr);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setChecked(plan.habits.map(() => false));
  }, [habitsKey, plan.habits.length]);

  const toggleHabit = (i: number) => {
    setChecked((prev) => {
      const next = prev.map((v, idx) => (idx === i ? !v : v));
      try {
        localStorage.setItem(habitsKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const habitsDone = checked.filter(Boolean).length;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 pb-16">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">{t.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t.forPhase}{" "}
          <span className="font-semibold capitalize" style={{ color }}>
            {phaseLabel}
          </span>{" "}
          {t.phase}
        </p>
      </div>

      {/* Daily water target */}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(waterPct / 100) * 97.4} 97.4`}
                className="transition-all duration-500"
              />
            </svg>
            <Droplets
              className="absolute inset-0 m-auto h-6 w-6"
              style={{ color }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4" style={{ color }} />
              <h3 className="font-semibold text-foreground">{t.waterTarget}</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="font-semibold text-foreground">
                {waterLogged.toFixed(1)}
              </span>{" "}
              / {plan.water} {t.liters} {t.loggedToday}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-full text-xs"
                disabled={createLog.isPending}
                onClick={() => addWater(0.2)}
              >
                <Plus className="h-3 w-3 me-1" /> 200 ml
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-full text-xs"
                disabled={createLog.isPending}
                onClick={() => addWater(0.5)}
              >
                <Plus className="h-3 w-3 me-1" /> 500 ml
              </Button>
            </div>
          </div>
        </div>
        {reached && (
          <p className="mt-3 text-xs font-medium" style={{ color }}>
            {t.goalReached}
          </p>
        )}
      </Card>

      {/* Recommended movement */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Dumbbell className="h-4 w-4" style={{ color }} />
          <h3 className="font-semibold text-foreground">{t.exercisesTitle}</h3>
        </div>
        <div className="space-y-2">
          {plan.exercises.map((ex, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-2.5"
            >
              <span className="text-sm text-foreground">{ex.name}</span>
              <span className="text-xs font-medium text-muted-foreground">
                {ex.minutes} {t.min}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Nutrition & diet */}
      <Card className="p-5 border-s-4" style={{ borderInlineStartColor: color }}>
        <div className="flex items-center gap-2 mb-2">
          <Salad className="h-4 w-4" style={{ color }} />
          <h3 className="font-semibold text-foreground">{t.nutritionTitle}</h3>
        </div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t.foodsLabel}
        </p>
        <p className="text-sm text-foreground mt-1">{plan.foods}</p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">
          {plan.nutritionNote}
        </p>
      </Card>

      {/* Daily habits checklist */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">{t.habitsTitle}</h3>
          <span className="text-xs font-medium text-muted-foreground">
            {habitsDone}/{plan.habits.length} {t.habitsDone}
          </span>
        </div>
        <div className="space-y-2">
          {plan.habits.map((habit, i) => {
            const active = checked[i];
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleHabit(i)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-start text-sm transition-all border ${
                  active
                    ? "border-transparent text-white shadow-sm"
                    : "bg-secondary/60 border-border text-foreground hover:bg-secondary"
                }`}
                style={active ? { backgroundColor: color } : undefined}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    active ? "bg-white/25 border-white/40" : "border-muted-foreground/40"
                  }`}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className={active ? "line-through/0" : ""}>{habit}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Daily reminders */}
      <Card className="p-5 flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}1a` }}
        >
          <Bell className="h-4 w-4" style={{ color }} />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{t.remindersTitle}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
            {t.remindersDesc}
          </p>
        </div>
      </Card>

      {/* More tips */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">{t.moreTips}</h3>
        {tips.map((tip, i) => (
          <Card key={i} className="p-5 border-s-4" style={{ borderInlineStartColor: color }}>
            <h3 className="font-semibold text-foreground mb-1">{tip.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{tip.content}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
