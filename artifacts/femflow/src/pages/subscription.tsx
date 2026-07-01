import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import { SubscriptionPanel } from "@/components/subscription-panel";

export default function Subscription() {
  const { language } = useAuth();
  const t = useTranslation(language).sub;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-serif font-bold text-foreground">{t.title}</h1>
      <SubscriptionPanel />
    </div>
  );
}
