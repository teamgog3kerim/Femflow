import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import {
  useGetCurrentCycle,
  useGetCycleStats,
  useGetWellnessScore,
  useListNotifications,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Bell, Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { phaseColor, normalizePhase, localDateStr } from "@/lib/phase";

function fmtShort(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr.split("T")[0] + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d);
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr.split("T")[0] + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date(localDateStr(new Date()) + "T00:00:00");
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export default function Home() {
  const { user, language } = useAuth();
  const tt = useTranslation(language);
  const t = tt.home;
  const locale = language === "ar" ? "ar" : "en";

  const { data: currentCycle, isSuccess: cycleLoaded } = useGetCurrentCycle();
  const { data: stats, isSuccess: statsLoaded } = useGetCycleStats();
  const { data: wellness } = useGetWellnessScore();
  const { data: notifications } = useListNotifications();

  const hasNoCycleData =
    cycleLoaded &&
    statsLoaded &&
    !currentCycle?.currentCycle &&
    (stats?.totalCycles ?? 0) === 0;

  const phaseKey = normalizePhase(currentCycle?.phase);
  const phaseLabel = tt.cycle.phases[phaseKey === "menstruation" ? "menstrual" : phaseKey];
  const color = phaseColor(currentCycle?.phase);

  const cycleDay = currentCycle?.cycleDay ?? 0;
  const cycleLen = currentCycle?.averageCycleLength ?? stats?.averageCycleLength ?? 28;
  const progress = cycleLen ? Math.min(1, Math.max(0, cycleDay / cycleLen)) : 0;

  const R = 52;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC * (1 - progress);

  // Fertile window check
  const todayS = localDateStr(new Date());
  const fs = currentCycle?.fertileWindowStart?.split("T")[0];
  const fe = currentCycle?.fertileWindowEnd?.split("T")[0];
  const isFertile = !!(fs && fe && todayS >= fs && todayS <= fe);

  // Status from regularity
  const reg = stats?.regularityScore ?? null;
  const statusLabel = reg == null ? t.statusRegular : reg >= 70 ? t.statusRegular : t.statusIrregular;

  const nextDays = daysUntil(currentCycle?.nextPeriodDate);
  const score = wellness?.score ?? 0;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 pb-16">
      <header className="pt-1">
        <h1 className="text-2xl font-serif font-bold text-foreground">
          {t.greeting}
          {user?.firstName || "Beautiful"}
        </h1>
      </header>

      {hasNoCycleData ? (
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className="p-8 flex flex-col items-center text-center border-none shadow-lg shadow-primary/5">
            <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mb-6 text-white shadow-md shadow-primary/25">
              <Sparkles className="w-9 h-9" />
            </div>
            <h2 className="text-xl font-serif font-bold text-foreground mb-2">{t.emptyTitle}</h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">{t.emptySubtitle}</p>
            <Link href="/cycle">
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full gradient-primary text-white font-medium shadow-md shadow-primary/25 hover:opacity-90 transition-opacity">
                <Plus className="w-5 h-5" />
                {t.emptyCta}
              </button>
            </Link>
          </Card>
        </motion.div>
      ) : (
        <>
      {/* Cycle ring */}
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Card className="p-8 flex flex-col items-center text-center border-none shadow-lg shadow-primary/5">
          <span
            className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold text-white mb-6 capitalize"
            style={{ backgroundColor: color }}
          >
            {phaseLabel}
          </span>

          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={R} fill="none" strokeWidth="10" className="stroke-secondary" />
              <circle
                cx="60"
                cy="60"
                r={R}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                stroke={color}
                strokeDasharray={CIRC}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-serif font-bold text-foreground">{cycleDay || "—"}</span>
              <span className="text-xs text-muted-foreground mt-1">{t.daysIntoCycle}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Info grid */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t.nextPeriod}</p>
          <p className="font-semibold text-foreground">{fmtShort(currentCycle?.nextPeriodDate, locale)}</p>
          {nextDays != null && nextDays >= 0 && (
            <p className="text-xs text-primary mt-0.5">
              {nextDays} {t.days}
            </p>
          )}
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t.status}</p>
          <p className="font-semibold text-foreground">{statusLabel}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t.fertile}</p>
          <p className="font-semibold text-sm text-foreground">{isFertile ? t.fertileYes : t.fertileNo}</p>
        </Card>
      </div>

      {/* Wellness + quick log */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 flex flex-col items-center justify-center text-center">
          <div className="relative w-16 h-16 mb-3">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="stroke-secondary"
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-primary stroke-current"
                strokeWidth="3.5"
                strokeDasharray={`${score}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-primary">{score}</div>
          </div>
          <span className="text-sm font-medium text-muted-foreground">{t.wellnessScore}</span>
        </Card>

        <Link href="/log">
          <Card className="h-full p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-secondary/50 transition-colors">
            <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center mb-3 text-white shadow-md shadow-primary/25">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-foreground">{t.logToday}</span>
          </Card>
        </Link>
      </div>

      {/* Notifications */}
      {notifications && notifications.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">{t.recentActivity}</h3>
          <div className="space-y-2">
            {notifications.slice(0, 3).map((n) => (
              <div key={n.id} className="flex gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleTimeString(locale)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
