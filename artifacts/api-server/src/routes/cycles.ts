import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, cyclesTable } from "@workspace/db";
import {
  CreateCycleBody,
  CreateCycleResponse,
  GetCurrentCycleResponse,
  GetCycleStatsResponse,
  ListCyclesResponse,
  UpdateCycleBody,
  UpdateCycleParams,
  UpdateCycleResponse,
} from "@workspace/api-zod";
import { getUserId } from "../lib/getUserId.js";
import { serialize } from "../lib/serialize.js";

const router: IRouter = Router();

// GET /cycles
router.get("/cycles", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const limit = parseInt(String(req.query.limit ?? "12"), 10);
  const offset = parseInt(String(req.query.offset ?? "0"), 10);

  const cycles = await db
    .select()
    .from(cyclesTable)
    .where(eq(cyclesTable.userId, userId))
    .orderBy(desc(cyclesTable.startDate))
    .limit(limit)
    .offset(offset);

  res.json(ListCyclesResponse.parse(serialize(cycles)));
});

// POST /cycles
router.post("/cycles", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateCycleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [cycle] = await db.insert(cyclesTable).values({ ...parsed.data, userId }).returning();
  res.status(201).json(CreateCycleResponse.parse(serialize(cycle)));
});

// GET /cycles/current
router.get("/cycles/current", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const cycles = await db
    .select()
    .from(cyclesTable)
    .where(eq(cyclesTable.userId, userId))
    .orderBy(desc(cyclesTable.startDate))
    .limit(6);

  const today = new Date();

  if (cycles.length === 0) {
    res.json(GetCurrentCycleResponse.parse({
      cycleDay: null,
      phase: null,
      nextPeriodDate: null,
      fertileWindowStart: null,
      fertileWindowEnd: null,
      ovulationDate: null,
      averageCycleLength: null,
      currentCycle: null,
    }));
    return;
  }

  const latest = cycles[0];

  // Calculate average cycle length
  let avgLength: number | null = null;
  if (cycles.length >= 2) {
    const lengths: number[] = [];
    for (let i = 0; i < cycles.length - 1; i++) {
      const a = new Date(cycles[i].startDate);
      const b = new Date(cycles[i + 1].startDate);
      lengths.push(Math.round((a.getTime() - b.getTime()) / 86400000));
    }
    avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  }

  const cycleStart = new Date(latest.startDate);
  const cycleDay = Math.floor((today.getTime() - cycleStart.getTime()) / 86400000) + 1;

  // Phase calculation (based on 28-day default)
  const cycleLengthDays = avgLength ?? 28;
  let phase = "menstrual";
  if (cycleDay <= 5) phase = "menstrual";
  else if (cycleDay <= 13) phase = "follicular";
  else if (cycleDay <= 16) phase = "ovulation";
  else phase = "luteal";

  // Predictions
  const nextPeriodDate = addDays(cycleStart, Math.round(cycleLengthDays));
  const ovulationDate = addDays(cycleStart, Math.round(cycleLengthDays) - 14);
  const fertileWindowStart = addDays(ovulationDate, -5);
  const fertileWindowEnd = addDays(ovulationDate, 1);

  res.json(GetCurrentCycleResponse.parse({
    cycleDay,
    phase,
    nextPeriodDate: dateStr(nextPeriodDate),
    fertileWindowStart: dateStr(fertileWindowStart),
    fertileWindowEnd: dateStr(fertileWindowEnd),
    ovulationDate: dateStr(ovulationDate),
    averageCycleLength: avgLength,
    currentCycle: serialize(latest),
  }));
});

// GET /cycles/stats
router.get("/cycles/stats", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const cycles = await db
    .select()
    .from(cyclesTable)
    .where(eq(cyclesTable.userId, userId))
    .orderBy(desc(cyclesTable.startDate));

  if (cycles.length === 0) {
    res.json(GetCycleStatsResponse.parse({
      averageCycleLength: null,
      averagePeriodLength: null,
      totalCycles: 0,
      regularityScore: null,
      shortestCycle: null,
      longestCycle: null,
    }));
    return;
  }

  const lengths: number[] = [];
  for (let i = 0; i < cycles.length - 1; i++) {
    const a = new Date(cycles[i].startDate);
    const b = new Date(cycles[i + 1].startDate);
    lengths.push(Math.round((a.getTime() - b.getTime()) / 86400000));
  }

  const periodLengths = cycles
    .filter(c => c.startDate && c.endDate)
    .map(c => Math.round((new Date(c.endDate!).getTime() - new Date(c.startDate).getTime()) / 86400000) + 1);

  const avgCycleLength = lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : null;
  const avgPeriodLength = periodLengths.length > 0 ? periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length : null;

  // Regularity score: lower std deviation = higher score
  let regularityScore: number | null = null;
  if (lengths.length >= 2 && avgCycleLength !== null) {
    const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgCycleLength, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    regularityScore = Math.max(0, Math.round(100 - stdDev * 10));
  }

  res.json(GetCycleStatsResponse.parse({
    averageCycleLength: avgCycleLength,
    averagePeriodLength: avgPeriodLength,
    totalCycles: cycles.length,
    regularityScore,
    shortestCycle: lengths.length > 0 ? Math.min(...lengths) : null,
    longestCycle: lengths.length > 0 ? Math.max(...lengths) : null,
  }));
});

// PATCH /cycles/:id
router.patch("/cycles/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateCycleParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateCycleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [cycle] = await db
    .update(cyclesTable)
    .set(parsed.data)
    .where(and(eq(cyclesTable.id, params.data.id), eq(cyclesTable.userId, userId)))
    .returning();

  if (!cycle) { res.status(404).json({ error: "Cycle not found" }); return; }
  res.json(UpdateCycleResponse.parse(serialize(cycle)));
});

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default router;
