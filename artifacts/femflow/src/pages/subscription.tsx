import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import { useGetMySubscription, useGetMe, useSubmitSubscription } from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check } from "lucide-react";

const CBE_ACCOUNT = "1000296594931";

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export default function Subscription() {
  const { language } = useAuth();
  const t = useTranslation(language).sub;
  const { toast } = useToast();

  const { data: sub, refetch } = useGetMySubscription();
  const { data: me, refetch: refetchMe } = useGetMe();
  const submitSub = useSubmitSubscription();

  const [receiptPath, setReceiptPath] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(CBE_ACCOUNT);
      setCopied(true);
      toast({ title: t.copied });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: t.copyFailed, variant: "destructive" });
    }
  };

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (res) => setReceiptPath(res.objectPath),
    onError: () => toast({ title: t.uploadFailed, variant: "destructive" }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptPath("");
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      void uploadFile(file);
    }
  };

  const handleSubmit = () => {
    submitSub.mutate({
      data: { receiptImageUrl: receiptPath, bankAccount: "1000296594931" }
    }, {
      onSuccess: () => {
        toast({ title: t.submitted });
        setShowForm(false);
        setReceiptPath("");
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        refetch();
        refetchMe();
      }
    });
  };

  const status = me?.subscriptionStatus ?? "trial";
  const isPending = sub?.status === "pending";
  const trialDays = daysUntil(me?.trialEndsAt);
  const premiumDays = daysUntil(sub?.expiresAt);
  const premiumExpiringSoon = status === "premium" && premiumDays !== null && premiumDays <= 3;

  const showPaymentForm = showForm || (!isPending && status !== "premium" && status !== "trial");

  const renderStatusBanner = () => {
    if (isPending) {
      return (
        <div className="bg-secondary/50 p-4 rounded-xl text-center text-secondary-foreground font-medium">
          {t.pending}
        </div>
      );
    }
    if (status === "trial") {
      return (
        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-center font-medium border border-blue-100">
          <p className="font-semibold">{t.freeTrial}</p>
          <p className="text-sm mt-1">
            {trialDays === 0
              ? t.trialEndsToday
              : `${trialDays} ${t.trialDaysLeft}`}
          </p>
        </div>
      );
    }
    if (status === "premium") {
      return (
        <div className={`p-4 rounded-xl text-center font-medium ${premiumExpiringSoon ? "bg-amber-50 text-amber-800 border border-amber-100" : "bg-green-100 text-green-800"}`}>
          <p>{premiumExpiringSoon ? t.expiringSoon : t.premiumActive}</p>
          {premiumDays !== null && (
            <p className="text-sm mt-1">{premiumDays} {t.premiumDaysLeft}</p>
          )}
        </div>
      );
    }
    // expired / free
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center font-medium border border-red-100">
        {t.expired}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-serif font-bold text-foreground">{t.title}</h1>

      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <h2 className="text-xl font-bold mb-1">{t.planName}</h2>
        <p className="text-primary font-bold text-2xl mb-4">{t.price}</p>

        <div className="mb-4">{renderStatusBanner()}</div>

        {(premiumExpiringSoon || status === "expired" || status === "free" || status === "trial") && !isPending && !showPaymentForm && (
          <Button onClick={() => setShowForm(true)} className="w-full mb-4">
            {status === "premium" || status === "expired" ? t.renew : t.submit}
          </Button>
        )}

        {showPaymentForm && (
          <div className="space-y-4">
            <div className="bg-white/60 p-4 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">{t.cbeAccount}</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-lg tracking-wider font-bold text-foreground">{CBE_ACCOUNT}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAccount}
                  className="h-8 gap-1.5 px-2 text-xs"
                  aria-label={t.copyAccount}
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? t.copied : t.copy}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2 mb-1">{t.accountName}</p>
              <p className="text-base font-semibold text-foreground">Hanae Maeruf Mahammedzain</p>
              <p className="text-xs text-muted-foreground mt-2">{t.howTo}</p>
            </div>
            <h3 className="font-medium text-sm">{t.uploadDetails}</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {previewUrl ? (
              <div className="space-y-2">
                <img
                  src={previewUrl}
                  alt="Receipt"
                  className="w-full max-h-64 object-contain rounded-xl border border-border bg-white"
                />
                <p className="text-xs text-green-700 text-center">{t.receiptReady}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full"
                >
                  {t.changeImage}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? t.uploading : t.uploadReceipt}
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={submitSub.isPending || isUploading || !receiptPath}
              className="w-full"
            >
              {t.submit}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
