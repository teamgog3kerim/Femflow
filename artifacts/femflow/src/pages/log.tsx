import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import { useCreateHealthLog, getGetHealthLogSummaryQueryKey, getGetWellnessScoreQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Check } from "lucide-react";

const SYMPTOMS = ["cramps", "bloating", "headache", "fatigue", "breast-tenderness", "mood-changes"] as const;

export default function Log() {
  const { language } = useAuth();
  const t = useTranslation(language).log;
  const { toast } = useToast();
  const createLog = useCreateHealthLog();
  const queryClient = useQueryClient();

  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [pain, setPain] = useState([0]);
  const [mood, setMood] = useState([5]);
  const [energy, setEnergy] = useState([5]);
  const [sleep, setSleep] = useState([8]);
  const [water, setWater] = useState([2]);
  const [notes, setNotes] = useState("");

  const toggleSymptom = (s: string) => {
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const reset = () => {
    setSymptoms([]);
    setPain([0]);
    setMood([5]);
    setEnergy([5]);
    setSleep([8]);
    setWater([2]);
    setNotes("");
  };

  const handleSave = () => {
    createLog.mutate(
      {
        data: {
          logDate: new Date().toISOString(),
          symptoms: symptoms.length ? symptoms.join(",") : undefined,
          mood: String(mood[0]),
          painLevel: pain[0],
          energyLevel: energy[0],
          sleepHours: sleep[0],
          waterIntakeLiters: water[0],
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: t.success });
          queryClient.invalidateQueries({ queryKey: getGetHealthLogSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetWellnessScoreQueryKey() });
          reset();
        },
      },
    );
  };

  const sliders: { label: string; value: number[]; set: (v: number[]) => void; min: number; max: number; suffix: string }[] = [
    { label: t.pain, value: pain, set: setPain, min: 0, max: 10, suffix: "/10" },
    { label: t.mood, value: mood, set: setMood, min: 1, max: 10, suffix: "/10" },
    { label: t.energy, value: energy, set: setEnergy, min: 1, max: 10, suffix: "/10" },
    { label: t.sleep, value: sleep, set: setSleep, min: 0, max: 12, suffix: "h" },
    { label: t.water, value: water, set: setWater, min: 0, max: 4, suffix: "L" },
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 pb-16">
      <h1 className="text-2xl font-serif font-bold text-foreground">{t.title}</h1>

      {/* Symptoms */}
      <Card className="p-5 space-y-3">
        <label className="text-sm font-medium">{t.symptoms}</label>
        <div className="grid grid-cols-2 gap-2">
          {SYMPTOMS.map((s) => {
            const active = symptoms.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSymptom(s)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-left transition-all border ${
                  active
                    ? "gradient-primary text-white border-transparent shadow-sm shadow-primary/25"
                    : "bg-secondary/60 border-border text-foreground hover:bg-secondary"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    active ? "bg-white/25 border-white/40" : "border-muted-foreground/40"
                  }`}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                </span>
                {t.symptomOptions[s]}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Sliders */}
      <Card className="p-5 space-y-5">
        <label className="text-sm font-medium">{t.feeling}</label>
        {sliders.map((sl) => (
          <div key={sl.label}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{sl.label}</span>
              <span className="text-sm font-semibold text-primary">
                {sl.value[0]}
                {sl.suffix}
              </span>
            </div>
            <Slider value={sl.value} onValueChange={sl.set} min={sl.min} max={sl.max} step={1} />
          </div>
        ))}
      </Card>

      {/* Notes */}
      <Card className="p-5 space-y-2">
        <label className="text-sm font-medium">{t.notes}</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.notesPlaceholder}
          className="resize-none"
          rows={3}
        />
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={createLog.isPending} className="flex-1 rounded-2xl h-12">
          {createLog.isPending ? t.saving : t.save}
        </Button>
        <Button onClick={reset} variant="outline" className="rounded-2xl h-12 px-6">
          {t.clear}
        </Button>
      </div>
    </div>
  );
}
