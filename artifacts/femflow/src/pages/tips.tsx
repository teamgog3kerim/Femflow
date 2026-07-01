import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import { useGetCurrentCycle } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { phaseColor, normalizePhase } from "@/lib/phase";

export default function Tips() {
  const { language } = useAuth();
  const tt = useTranslation(language);
  const t = tt.tips;

  const { data: currentCycle } = useGetCurrentCycle();
  const phaseKey = normalizePhase(currentCycle?.phase);
  const color = phaseColor(currentCycle?.phase);
  const phaseLabel = tt.cycle.phases[phaseKey === "menstruation" ? "menstrual" : phaseKey];
  const tips = t[phaseKey];

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

      <div className="space-y-3">
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
