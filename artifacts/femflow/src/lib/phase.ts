export type PhaseKey = "menstruation" | "follicular" | "ovulation" | "luteal";

export function normalizePhase(phase: string | null | undefined): PhaseKey {
  switch (phase) {
    case "menstrual":
    case "menstruation":
      return "menstruation";
    case "ovulation":
      return "ovulation";
    case "luteal":
      return "luteal";
    default:
      return "follicular";
  }
}

export const PHASE_VAR: Record<PhaseKey, string> = {
  menstruation: "--phase-menstruation",
  follicular: "--phase-follicular",
  ovulation: "--phase-ovulation",
  luteal: "--phase-luteal",
};

export function phaseColor(phase: string | null | undefined): string {
  return `hsl(var(${PHASE_VAR[normalizePhase(phase)]}))`;
}

export function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
