import { Router, type IRouter } from "express";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db, healthLogsTable } from "@workspace/db";
import {
  CreateHealthLogBody,
  CreateHealthLogResponse,
  GetHealthLogSummaryResponse,
  ListHealthLogsResponse,
  UpdateHealthLogBody,
  UpdateHealthLogParams,
  UpdateHealthLogResponse,
} from "@workspace/api-zod";
import { getUserId } from "../lib/getUserId.js";
import { serialize } from "../lib/serialize.js";

const router: IRouter = Router();

// Drizzle maps numeric columns to strings; coerce numeric body fields before writing.
const NUMERIC_FIELDS = ["sleepHours", "waterIntakeLiters", "weightKg"] as const;
function coerceNumericFields<T extends Record<string, unknown>>(data: T): T {
  const out: Record<string, unknown> = { ...data };
  for (const field of NUMERIC_FIELDS) {
    if (typeof out[field] === "number") out[field] = String(out[field]);
  }
  return out as T;
}

// GET /health-logs
router.get("/health-logs", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const startDate = String(req.query.startDate ?? "");
  const endDate = String(req.query.endDate ?? "");

  const conditions = [eq(healthLogsTable.userId, userId)];
  if (startDate) conditions.push(gte(healthLogsTable.logDate, startDate));
  if (endDate) conditions.push(lte(healthLogsTable.logDate, endDate));

  const logs = await db
    .select()
    .from(healthLogsTable)
    .where(and(...conditions))
    .orderBy(desc(healthLogsTable.logDate));

  res.json(ListHealthLogsResponse.parse(serialize(logs)));
});

// POST /health-logs
router.post("/health-logs", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateHealthLogBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const values = { ...coerceNumericFields(parsed.data), userId } as typeof healthLogsTable.$inferInsert;
  const [log] = await db.insert(healthLogsTable).values(values).returning();
  res.status(201).json(CreateHealthLogResponse.parse(serialize(log)));
});

// GET /health-logs/summary
router.get("/health-logs/summary", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const year = parseInt(String(req.query.year ?? new Date().getFullYear()), 10);
  const month = parseInt(String(req.query.month ?? new Date().getMonth() + 1), 10);

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  const logs = await db
    .select()
    .from(healthLogsTable)
    .where(and(
      eq(healthLogsTable.userId, userId),
      gte(healthLogsTable.logDate, startDate),
      lte(healthLogsTable.logDate, endDate),
    ));

  const totalDaysLogged = logs.length;

  const moods = logs.map(l => l.mood).filter(Boolean);
  const moodCounts: Record<string, number> = {};
  moods.forEach(m => { moodCounts[m!] = (moodCounts[m!] ?? 0) + 1; });
  const averageMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const avg = (arr: (number | null | string)[]) => {
    const nums = arr.map(v => typeof v === "string" ? parseFloat(v) : v).filter(v => v !== null && !isNaN(v as number)) as number[];
    return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
  };

  // symptoms is an array from postgres
  const symptomsList = logs.flatMap(l => {
    if (!l.symptoms) return [];
    if (Array.isArray(l.symptoms)) return l.symptoms as string[];
    return String(l.symptoms).split(",").map((s: string) => s.trim());
  }).filter(Boolean);
  const symptomCounts: Record<string, number> = {};
  symptomsList.forEach(s => { symptomCounts[s] = (symptomCounts[s] ?? 0) + 1; });
  const topSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);

  const avgSleep = avg(logs.map(l => l.sleepHours));
  const avgWater = avg(logs.map(l => l.waterIntakeLiters));
  const avgEnergy = avg(logs.map(l => l.energyLevel));
  const avgPain = avg(logs.map(l => l.painLevel));

  let wellnessScore: number | null = null;
  if (totalDaysLogged > 0) {
    let score = 70;
    if (avgSleep !== null) score += avgSleep >= 7 ? 10 : avgSleep >= 6 ? 5 : 0;
    if (avgWater !== null) score += avgWater >= 2 ? 10 : avgWater >= 1.5 ? 5 : 0;
    if (avgEnergy !== null) score += (avgEnergy / 10) * 5;
    if (avgPain !== null) score -= (avgPain / 10) * 5;
    wellnessScore = Math.min(100, Math.max(0, Math.round(score)));
  }

  res.json(GetHealthLogSummaryResponse.parse({
    month,
    year,
    totalDaysLogged,
    averageMood,
    averagePainLevel: avg(logs.map(l => l.painLevel)),
    averageEnergyLevel: avg(logs.map(l => l.energyLevel)),
    averageSleepHours: avgSleep,
    averageWaterIntake: avgWater,
    topSymptoms,
    wellnessScore,
  }));
});

// PATCH /health-logs/:id
router.patch("/health-logs/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateHealthLogParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateHealthLogBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates = coerceNumericFields(parsed.data) as Partial<typeof healthLogsTable.$inferInsert>;
  const [log] = await db
    .update(healthLogsTable)
    .set(updates)
    .where(and(eq(healthLogsTable.id, params.data.id), eq(healthLogsTable.userId, userId)))
    .returning();

  if (!log) { res.status(404).json({ error: "Health log not found" }); return; }
  res.json(UpdateHealthLogResponse.parse(serialize(log)));
});

export default router;
