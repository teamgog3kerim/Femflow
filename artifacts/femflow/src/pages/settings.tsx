import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import { useGetMe, useGetMySubscription } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Crown } from "lucide-react";

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export default function Settings() {
  const { language, changeLanguage, logout } = useAuth();
  const t = useTranslation(language).settings;

  const { data: me } = useGetMe();
  const { data: sub } = useGetMySubscription();

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
    badgeClass = "bg-blue-100 text-blue-700";
    days = daysUntil(me?.trialEndsAt);
  } else if (status === "premium") {
    statusLabel = t.statusPremium;
    badgeClass = "bg-green-100 text-green-700";
    days = daysUntil(sub?.expiresAt);
  } else if (status === "expired") {
    statusLabel = t.statusExpired;
    badgeClass = "bg-red-100 text-red-700";
  }

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

      {/* Account / preferences */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">{t.account}</p>
        <Card className="p-4 space-y-4">
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
        </Card>
      </div>

      <Button variant="destructive" className="w-full" onClick={logout}>
        {t.logOut}
      </Button>
    </div>
  );
}
