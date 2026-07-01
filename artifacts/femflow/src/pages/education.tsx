import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import { useListArticles } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { PHASE_VAR, type PhaseKey } from "@/lib/phase";
import { AlertCircle } from "lucide-react";

const PHASE_ORDER: PhaseKey[] = ["menstruation", "follicular", "ovulation", "luteal"];

export default function Education() {
  const { language } = useAuth();
  const tt = useTranslation(language);
  const t = tt.learn;

  const { data: allArticles = [] } = useListArticles();
  const articles = allArticles.filter((a) => a.language === language);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 pb-16">
      <h1 className="text-2xl font-serif font-bold text-foreground">{t.title}</h1>

      {/* Phase education cards */}
      <div className="space-y-3">
        {PHASE_ORDER.map((key) => {
          const phase = t.phases[key];
          const color = `hsl(var(${PHASE_VAR[key]}))`;
          return (
            <Card key={key} className="p-5 border-s-4" style={{ borderInlineStartColor: color }}>
              <h3 className="font-serif font-bold text-lg mb-1" style={{ color }}>
                {phase.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{phase.content}</p>
            </Card>
          );
        })}
      </div>

      {/* When to see a doctor */}
      <Card className="p-5 bg-[hsl(var(--coral)/0.12)] border-[hsl(var(--coral)/0.3)]">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-5 w-5 text-[hsl(var(--phase-menstruation))]" />
          <h3 className="font-serif font-bold text-lg text-foreground">{t.doctorTitle}</h3>
        </div>
        <ul className="space-y-2">
          {t.doctorList.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="text-[hsl(var(--phase-menstruation))] mt-0.5">•</span>
              {item}
            </li>
          ))}
        </ul>
      </Card>

      {/* Articles */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-foreground">{t.articles}</h2>
        {articles.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">{t.noArticles}</p>
        ) : (
          articles.map((a) => (
            <Card key={a.id} className="p-4 overflow-hidden group hover:border-primary transition-colors cursor-pointer">
              {a.imageUrl && (
                <div className="w-full h-32 bg-secondary rounded-lg mb-3 overflow-hidden">
                  <img src={a.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">{a.category}</span>
                {a.readTimeMinutes != null && (
                  <span className="text-xs text-muted-foreground">
                    {a.readTimeMinutes} {t.min}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-foreground mb-1">{a.title}</h3>
              {a.summary && <p className="text-sm text-muted-foreground line-clamp-2">{a.summary}</p>}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
