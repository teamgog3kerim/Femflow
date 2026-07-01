import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import {
  useGetMe,
  useGetMySubscription,
  useGetCycleStats,
  useCreateCycle,
  useUpdateMe,
  getGetMeQueryKey,
  getGetCurrentCycleQueryKey,
  getGetCycleStatsQueryKey,
  getGetCycleCalendarQueryKey,
  getListCyclesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { localDateStr } from "@/lib/phase";
import { ChevronRight, Crown } from "lucide-react";

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export default function Settings() {
  const { language, changeLanguage, logout } = useAuth();
  const t = useTranslation(language).settings;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: me } = useGetMe();
  const { data: sub } = useGetMySubscription();
  const { data: stats } = useGetCycleStats();

  const createCycle = useCreateCycle();
  const updateMe = useUpdateMe();

  const [lastPeriod, setLastPeriod] = useState<string>(localDateStr(new Date()));

  const isPending = sub?.status === "pending";
  const status = me?.subscriptionStatus ?? "trial";

  let statusLabel = t.statusFree;
  let badgeClass = "bg-muted text-muted-foreground";
  let days: number | null = null;

  if (isPending) {
    statusLabel = t.statusPending;
    badgeClass = "bg-secondary text-secondary-foreground";
  } else if (status === "trial") {
    statusLabel = t.statusTrial;
    badgeClass = "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
    days = daysUntil(me?.trialEndsAt);
  } else if (status === "premium") {
    statusLabel = t.statusPremium;
    badgeClass = "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300";
    days = daysUntil(sub?.expiresAt);
  } else if (status === "expired") {
    statusLabel = t.statusExpired;
    badgeClass = "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300";
  }

  const cycleLenLabel =
    stats?.averageCycleLength != null ? `${Math.round(stats.averageCycleLength)} ${t.days}` : t.noData;
  const periodLenLabel =
    stats?.averagePeriodLength != null ? `${Math.round(stats.averagePeriodLength)} ${t.days}` : t.noData;

  const saveLastPeriod = () => {
    if (!lastPeriod) return;
    createCycle.mutate(
      { data: { startDate: lastPeriod } },
      {
        onSuccess: () => {
          toast({ title: t.saved });
          queryClient.invalidateQueries({ queryKey: getGetCurrentCycleQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCycleStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCycleCalendarQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListCyclesQueryKey() });
        },
      },
    );
  };

  const toggleNotifications = (enabled: boolean) => {
    updateMe.mutate(
      { data: { notificationsEnabled: enabled } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        },
      },
    );
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <h1 className="text-2xl font-serif font-bold text-foreground">{t.title}</h1>

      {/* Subscription */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">{t.subscription}</p>
        <Link href="/subscription">
          <Card className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{t.manageSubscription}</p>
                <span className={`inline-flex items-center mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
                  {statusLabel}
                  {days !== null && ` · ${days} ${t.daysLeft}`}
                </span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground rtl:rotate-180" />
          </Card>
        </Link>
      </div>

      {/* Cycle settings */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">{t.cycleSettings}</p>
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-secondary/40 p-4">
              <p className="text-2xl font-serif font-bold text-foreground">{cycleLenLabel}</p>
              <p className="text-sm font-medium mt-1">{t.cycleLength}</p>
              <p className="text-xs text-muted-foreground">{t.cycleLengthDesc}</p>
            </div>
            <div className="rounded-2xl bg-secondary/40 p-4">
              <p className="text-2xl font-serif font-bold text-foreground">{periodLenLabel}</p>
              <p className="text-sm font-medium mt-1">{t.periodDuration}</p>
              <p className="text-xs text-muted-foreground">{t.periodDurationDesc}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">{t.lastPeriod}</label>
            <Input type="date" value={lastPeriod} max={localDateStr(new Date())} onChange={(e) => setLastPeriod(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">{t.lastPeriodDesc}</p>
          </div>

          <Button className="w-full rounded-2xl" onClick={saveLastPeriod} disabled={createCycle.isPending || !lastPeriod}>
            {t.save}
          </Button>
        </Card>
      </div>

      {/* Account / preferences */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">{t.account}</p>
        <Card className="p-4 space-y-5">
          <div>
            <p className="text-sm font-medium mb-2">{t.language}</p>
            <div className="flex gap-2">
              <Button variant={language === "en" ? "default" : "outline"} onClick={() => changeLanguage("en")}>
                English
              </Button>
              <Button
                variant={language === "ar" ? "default" : "outline"}
                onClick={() => changeLanguage("ar")}
                className="font-arabic"
              >
                العربية
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t.notifications}</p>
              <p className="text-xs text-muted-foreground">{t.notificationsDesc}</p>
            </div>
            <Switch
              checked={me?.notificationsEnabled ?? true}
              onCheckedChange={toggleNotifications}
              disabled={updateMe.isPending}
            />
          </div>
        </Card>
      </div>

      <Button variant="destructive" className="w-full" onClick={logout}>
        {t.logOut}
      </Button>
    </div>
  );
}
