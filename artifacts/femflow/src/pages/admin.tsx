import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import {
  useAdminGetAnalytics,
  getAdminGetAnalyticsQueryKey,
  useAdminListSubscriptions,
  getAdminListSubscriptionsQueryKey,
  useAdminListUsers,
  getAdminListUsersQueryKey,
  useAdminUpdateSubscription,
} from "@workspace/api-client-react";
import type { Subscription, User } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

function ReceiptImage({ path, alt }: { path: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objUrl: string | null = null;
    const token = localStorage.getItem("femflow_token");
    fetch(`/api/storage${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("failed"))))
      .then((blob) => {
        if (!active) return;
        objUrl = URL.createObjectURL(blob);
        setUrl(objUrl);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [path]);

  if (failed) return null;
  if (!url)
    return <div className="w-full h-40 rounded-xl border border-border bg-muted animate-pulse" />;
  return (
    <img
      src={url}
      alt={alt}
      className="w-full max-h-72 object-contain rounded-xl border border-border bg-white"
    />
  );
}

export default function Admin() {
  const { user, language } = useAuth();
  const t = useTranslation(language).admin;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: analytics } = useAdminGetAnalytics({
    query: { queryKey: getAdminGetAnalyticsQueryKey(), enabled: !!user?.isAdmin },
  });

  const pendingKey = getAdminListSubscriptionsQueryKey({ status: "pending" });
  const { data: pending } = useAdminListSubscriptions(
    { status: "pending" },
    { query: { queryKey: pendingKey, enabled: !!user?.isAdmin } },
  );

  const { data: usersData } = useAdminListUsers(undefined, {
    query: { queryKey: getAdminListUsersQueryKey(), enabled: !!user?.isAdmin },
  });

  const updateSub = useAdminUpdateSubscription();
  const [reasons, setReasons] = useState<Record<number, string>>({});

  const handleDecision = (id: number, status: "active" | "rejected") => {
    const adminNotes = status === "rejected" ? reasons[id]?.trim() : undefined;
    updateSub.mutate(
      { id, data: { status, ...(adminNotes ? { adminNotes } : {}) } },
      {
        onSuccess: () => {
          toast({ title: status === "active" ? t.approved : t.rejected });
          setReasons((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          queryClient.invalidateQueries({ queryKey: pendingKey });
          queryClient.invalidateQueries({ queryKey: getAdminGetAnalyticsQueryKey() });
        },
        onError: () => toast({ title: t.actionFailed, variant: "destructive" }),
      },
    );
  };

  if (!user?.isAdmin) {
    return <div className="p-6">Unauthorized</div>;
  }

  const pendingSubs = pending ?? [];
  const users = usersData?.users ?? [];

  const statusLabel = (s: string): string => {
    const key = s as keyof typeof t.status;
    return t.status[key] ?? s;
  };
  const statusClass = (s: string): string => {
    switch (s) {
      case "premium":
        return "bg-primary/15 text-primary";
      case "trial":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
      case "expired":
        return "bg-destructive/15 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  const displayName = (u: User): string => {
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
    if (name) return name;
    if (u.username) return `@${u.username}`;
    return `#${u.id}`;
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <h1 className="text-2xl font-serif font-bold text-foreground">{t.title}</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">{t.totalUsers}</p>
          <p className="text-2xl font-bold">{analytics?.totalUsers || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">{t.activeSubs}</p>
          <p className="text-2xl font-bold">{analytics?.activeSubscriptions || 0}</p>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          {t.pendingApprovals}
          {pendingSubs.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({pendingSubs.length})
            </span>
          )}
        </h2>

        {pendingSubs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noPending}</p>
        ) : (
          pendingSubs.map((sub: Subscription) => (
            <Card key={sub.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{sub.planName}</p>
                <p className="text-sm text-muted-foreground">
                  {t.submittedOn}: {new Date(sub.createdAt).toLocaleDateString()}
                </p>
              </div>

              {sub.receiptImageUrl ? (
                <ReceiptImage path={sub.receiptImageUrl} alt={t.viewReceipt} />
              ) : (
                <p className="text-sm text-muted-foreground">{t.noReceipt}</p>
              )}

              <input
                type="text"
                value={reasons[sub.id] ?? ""}
                onChange={(e) =>
                  setReasons((prev) => ({ ...prev, [sub.id]: e.target.value }))
                }
                placeholder={t.rejectReasonPlaceholder}
                aria-label={t.rejectReason}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />

              <div className="flex gap-3">
                <Button
                  onClick={() => handleDecision(sub.id, "active")}
                  disabled={updateSub.isPending}
                  className="flex-1"
                >
                  {t.approve}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDecision(sub.id, "rejected")}
                  disabled={updateSub.isPending}
                  className="flex-1"
                >
                  {t.reject}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          {t.usersTitle}
          {users.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({usersData?.total ?? users.length})
            </span>
          )}
        </h2>

        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noUsers}</p>
        ) : (
          <div className="space-y-2">
            {users.map((u: User) => (
              <Card key={u.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{displayName(u)}</p>
                    {u.isAdmin && (
                      <span className="shrink-0 rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[11px] font-medium">
                        {t.adminBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.joined}: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(u.subscriptionStatus ?? "free")}`}
                >
                  {statusLabel(u.subscriptionStatus ?? "free")}
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
