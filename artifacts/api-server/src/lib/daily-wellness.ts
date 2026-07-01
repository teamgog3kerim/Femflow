import { and, desc, eq, gte } from "drizzle-orm";
import { db, usersTable, cyclesTable, notificationsTable } from "@workspace/db";

type Lang = "en" | "ar";
type PhaseKey = "menstruation" | "follicular" | "ovulation" | "luteal";

const DAY_MS = 24 * 60 * 60 * 1000;

function normalizePhase(phase: string | null | undefined): PhaseKey {
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

/** Water target (litres) per phase — mirrors the frontend daily plan. */
const WATER_TARGET: Record<PhaseKey, number> = {
  menstruation: 2.5,
  follicular: 2.2,
  ovulation: 2.5,
  luteal: 2.3,
};

const nudge: Record<Lang, Record<PhaseKey, (water: number) => string>> = {
  en: {
    menstruation: (w) => `💧 Menstruation day: aim for ${w}L water, gentle movement, and an iron-rich meal today.`,
    follicular: (w) => `💧 Follicular day: aim for ${w}L water, an active workout, and a protein-rich breakfast today.`,
    ovulation: (w) => `💧 Ovulation day: aim for ${w}L water, a high-intensity workout, and antioxidant-rich foods today.`,
    luteal: (w) => `💧 Luteal day: aim for ${w}L water, low-intensity movement, and magnesium-rich foods today.`,
  },
  ar: {
    menstruation: (w) => `💧 يوم الطمث: استهدفي ${w} لتر ماء، حركة لطيفة، ووجبة غنية بالحديد اليوم.`,
    follicular: (w) => `💧 المرحلة الجريبية: استهدفي ${w} لتر ماء، تمريناً نشطاً، وفطوراً غنياً بالبروتين اليوم.`,
    ovulation: (w) => `💧 مرحلة الإباضة: استهدفي ${w} لتر ماء، تمريناً عالي الشدة، وأطعمة غنية بمضادات الأكسدة اليوم.`,
    luteal: (w) => `💧 المرحلة الأصفرية: استهدفي ${w} لتر ماء، حركة خفيفة، وأطعمة غنية بالمغنيسيوم اليوم.`,
  },
};

function currentPhase(startDate: string, avgLength: number | null): PhaseKey {
  const cycleStart = new Date(startDate);
  const cycleDay = Math.floor((Date.now() - cycleStart.getTime()) / DAY_MS) + 1;
  if (cycleDay <= 5) return "menstruation";
  if (cycleDay <= 13) return "follicular";
  if (cycleDay <= 16) return "ovulation";
  // avgLength currently unused for phase bucketing; kept for future tuning.
  void avgLength;
  return "luteal";
}

/**
 * Lazily emit a single daily wellness reminder per calendar day (server local time),
 * tailored to the user's current cycle phase and language. Respects the user's
 * notification preference and does nothing if the user has no cycle data yet.
 * Safe to call on any authenticated read endpoint.
 */
export async function ensureDailyWellnessReminder(userId: number): Promise<void> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || !user.notificationsEnabled) return;

  // Dedupe: only one "daily_wellness" notification per calendar day.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [existing] = await db
    .select({ id: notificationsTable.id })
    .from(notificationsTable)
    .where(
      and(
        eq(notificationsTable.userId, userId),
        eq(notificationsTable.type, "daily_wellness"),
        gte(notificationsTable.createdAt, startOfDay),
      ),
    )
    .limit(1);
  if (existing) return;

  const [latest] = await db
    .select()
    .from(cyclesTable)
    .where(eq(cyclesTable.userId, userId))
    .orderBy(desc(cyclesTable.startDate))
    .limit(1);
  if (!latest) return; // No cycle logged yet — skip until there is phase context.

  const phase = normalizePhase(currentPhase(latest.startDate, null));
  const lang: Lang = user.language === "ar" ? "ar" : "en";
  const message = nudge[lang][phase](WATER_TARGET[phase]);

  await db.insert(notificationsTable).values({ userId, type: "daily_wellness", message });
}
