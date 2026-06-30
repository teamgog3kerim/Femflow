import { useGetWellnessScore, useGetCycleStats } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";

export default function Analytics() {
  const { data: wellness } = useGetWellnessScore();
  const { data: stats } = useGetCycleStats();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-serif font-bold text-foreground">Analytics</h1>
      
      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-2">Wellness Score</h2>
        <div className="text-4xl font-bold text-primary mb-4">{wellness?.score || 85}</div>
        
        <div className="space-y-2">
          {Object.entries(wellness?.breakdown || {}).map(([k, v]) => (
            <div key={k} className="flex justify-between items-center text-sm">
              <span className="capitalize">{k}</span>
              <span className="font-medium">{v}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}