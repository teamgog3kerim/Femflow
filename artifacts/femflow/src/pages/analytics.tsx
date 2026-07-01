import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import {
  useGetCycleStats,
  useGetHealthLogSummary,
  useGetCurrentCycle,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { BarChart3, Plus } from "lucide-react";

function fmtShort(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr.split("T")[0] + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d);
}

export default function Analytics() {
  const { language } = useAuth();
  const tt = useTranslation(language);
  const t = tt.insights;
  const locale = language === "ar" ? "ar" : "en";

  const now = new Date();
  const { data: stats, isSuccess: statsLoaded } = useGetCycleStats();
  const { data: summary } = useGetHealthLogSummary({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const { data: currentCycle, isSuccess: cycleLoaded } = useGetCurrentCycle();

  const hasNoCycleData =
    cycleLoaded &&
    statsLoaded &&
    !currentCycle?.currentCycle &&
    (stats?.totalCycles ?? 0) === 0;

  const reg = stats?.regularityScore ?? null;
  const consistency = reg == null ? t.none : reg >= 80 ? t.good : reg >= 60 ? t.fair : t.irregular;

  const topSymptomRaw = summary?.topSymptoms?.[0];
  const symptomLabel =
    topSymptomRaw && topSymptomRaw in tt.log.symptomOptions
      ? tt.log.symptomOptions[topSymptomRaw as keyof typeof tt.log.symptomOptions]
      : topSymptomRaw || t.none;

  const cards = [
    {
      icon: "📏",
      label: t.cycleLength,
      value: stats?.averageCycleLength ? Math.round(stats.averageCycleLength) : "—",
      unit: t.days,
      detail: t.yourAverage,
    },
    {
      icon: "📅",
      label: t.duration,
      value: stats?.averagePeriodLength ? Math.round(stats.averagePeriodLength) : "—",
      unit: t.days,
      detail: t.periodLength,
    },
    { icon: "✨", label: t.consistency, value: consistency, unit: "", detail: t.cyclePattern },
    { icon: "💬", label: t.commonSymptom, value: symptomLabel, unit: "", detail: t.mostFrequent },
    { icon: "📊", label: t.entries, value: summary?.totalDaysLogged ?? 0, unit: "", detail: t.loggedDays },
    {
      icon: "🗓️",
      label: t.nextPeriod,
      value: fmtShort(currentCycle?.nextPeriodDate, locale),
      unit: "",
      detail: t.estimatedDate,
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 pb-16">
      <h1 className="text-2xl font-serif font-bold text-foreground">{t.title}</h1>

      {hasNoCycleData ? (
        <Card className="p-8 flex flex-col items-center text-center border-none shadow-lg shadow-primary/5">
          <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mb-6 text-white shadow-md shadow-primary/25">
            <BarChart3 className="w-9 h-9" />
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
      ) : (
      <div className="grid grid-cols-2 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5 flex flex-col gap-1">
            <span className="text-2xl">{c.icon}</span>
            <span className="text-xs text-muted-foreground mt-1">{c.label}</span>
            <span className="text-2xl font-bold text-foreground leading-tight">
              {c.value}
              {c.unit && <span className="text-sm font-medium text-muted-foreground ms-1">{c.unit}</span>}
            </span>
            <span className="text-xs text-muted-foreground">{c.detail}</span>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
