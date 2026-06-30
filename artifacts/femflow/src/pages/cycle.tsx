import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import { useGetCurrentCycle, useGetCycleStats, useGetCycleCalendar } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Cycle() {
  const { language } = useAuth();
  const t = useTranslation(language).nav;
  
  const { data: currentCycle } = useGetCurrentCycle();
  const { data: stats } = useGetCycleStats();

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-serif font-bold text-foreground">{t.cycle}</h1>
      
      <Card className="p-6 bg-card/80 backdrop-blur border-card-border shadow-sm">
        <h2 className="font-semibold text-lg mb-2">Current Phase: {currentCycle?.phase || "Follicular"}</h2>
        <p className="text-sm text-muted-foreground">Day {currentCycle?.cycleDay || 1} of your cycle</p>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Avg Length</p>
          <p className="text-2xl font-bold text-primary">{stats?.averageCycleLength || 28}d</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Regularity</p>
          <p className="text-2xl font-bold text-primary">{stats?.regularityScore || 100}%</p>
        </Card>
      </div>

      <Button className="w-full rounded-2xl h-12">Log Period Start/End</Button>
    </div>
  );
}