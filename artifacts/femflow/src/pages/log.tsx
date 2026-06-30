import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import { useCreateHealthLog, getGetHealthLogSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";

const MOODS = ["😄", "🙂", "😐", "😔", "😫", "😠"];

export default function Log() {
  const { language } = useAuth();
  const t = useTranslation(language).log;
  const { toast } = useToast();
  const createLog = useCreateHealthLog();
  const queryClient = useQueryClient();

  const [mood, setMood] = useState<string>("🙂");
  const [pain, setPain] = useState([1]);

  const handleSave = () => {
    createLog.mutate({
      data: {
        logDate: new Date().toISOString(),
        mood,
        painLevel: pain[0]
      }
    }, {
      onSuccess: () => {
        toast({ title: t.success });
        queryClient.invalidateQueries({ queryKey: getGetHealthLogSummaryQueryKey() });
      }
    });
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 pb-24">
      <h1 className="text-2xl font-serif font-bold text-foreground">{t.title}</h1>
      
      <Card className="p-5 space-y-4">
        <div>
          <label className="text-sm font-medium">{t.mood}</label>
          <div className="flex justify-between mt-2">
            {MOODS.map(m => (
              <button 
                key={m}
                onClick={() => setMood(m)}
                className={`text-2xl p-2 rounded-full transition-transform ${mood === m ? 'bg-primary/20 scale-110' : 'hover:bg-secondary/50'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">{t.pain}: {pain[0]}</label>
          <Slider 
            value={pain} 
            onValueChange={setPain} 
            max={10} 
            min={1} 
            step={1} 
            className="mt-4"
          />
        </div>
      </Card>

      <Button onClick={handleSave} disabled={createLog.isPending} className="w-full rounded-2xl h-12">
        {createLog.isPending ? "..." : t.save}
      </Button>
    </div>
  );
}