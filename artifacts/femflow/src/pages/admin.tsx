import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import {
  useAdminGetAnalytics,
  getAdminGetAnalyticsQueryKey,
  useAdminListSubscriptions,
  getAdminListSubscriptionsQueryKey,
  useAdminUpdateSubscription,
} from "@workspace/api-client-react";
import type { Subscription } from "@workspace/api-client-react";
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

  const updateSub = useAdminUpdateSubscription();

  const handleDecision = (id: number, status: "active" | "rejected") => {
    updateSub.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: status === "active" ? t.approved : t.rejected });
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
    </div>
  );
}
