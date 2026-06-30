import { Router, type IRouter } from "express";
import { eq, desc, gte } from "drizzle-orm";
import { db, healthLogsTable, cyclesTable } from "@workspace/db";
import {
  GetCycleCalendarResponse,
  GetMoodTrendsResponse,
  GetSymptomTrendsResponse,
  GetWellnessScoreResponse,
} from "@workspace/api-zod";
import { getUserId } from "../lib/getUserId.js";

const router: IRouter = Router();

// GET /analytics/wellness-score
router.get("/analytics/wellness-score", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startDate = sevenDaysAgo.toISOString().split("T")[0];

  const logs = await db
    .select()
    .from(healthLogsTable)
    .where(eq(healthLogsTable.userId, userId))
    .orderBy(desc(healthLogsTable.logDate))
    .limit(7);

  if (logs.length === 0) {
    res.json(GetWellnessScoreResponse.parse({
      score: 0,
      breakdown: { sleep: null, hydration: null, exercise: null, mood: null, pain: null },
    }));
    return;
  }

  const avg = (vals: (number | null | string)[]) => {
    const nums = vals.map(v => typeof v === "string" ? parseFloat(v) : v).filter(v => v !== null && !isNaN(v as number)) as number[];
    return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
  };

  const avgSleep = avg(logs.map(l => l.sleepHours));
  const avgWater = avg(logs.map(l => l.waterIntakeLiters));
  const avgExercise = avg(logs.map(l => l.exerciseMinutes));
  const avgEnergy = avg(logs.map(l => l.energyLevel));
  const avgPain = avg(logs.map(l => l.painLevel));

  const sleepScore = avgSleep !== null ? Math.min(100, (avgSleep / 8) * 100) : null;
  const hydrationScore = avgWater !== null ? Math.min(100, (avgWater / 2.5) * 100) : null;
  const exerciseScore = avgExercise !== null ? Math.min(100, (avgExercise / 30) * 100) : null;
  const moodScore = avgEnergy !== null ? (avgEnergy / 10) * 100 : null;
  const painScore = avgPain !== null ? ((10 - avgPain) / 10) * 100 : null;

  const scores = [sleepScore, hydrationScore, exerciseScore, moodScore, painScore].filter(s => s !== null) as number[];
  const totalScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  res.json(GetWellnessScoreResponse.parse({
    score: totalScore,
    breakdown: {
      sleep: sleepScore !== null ? Math.round(sleepScore) : null,
      hydration: hydrationScore !== null ? Math.round(hydrationScore) : null,
      exercise: exerciseScore !== null ? Math.round(exerciseScore) : null,
      mood: moodScore !== null ? Math.round(moodScore) : null,
      pain: painScore !== null ? Math.round(painScore) : null,
    },
  }));
});

// GET /analytics/symptom-trends
router.get("/analytics/symptom-trends", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const months = parseInt(String(req.query.months ?? "3"), 10);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const logs = await db
    .select()
    .from(healthLogsTable)
    .where(eq(healthLogsTable.userId, userId))
    .orderBy(healthLogsTable.logDate);

  const trends: { symptom: string; count: number; month: string }[] = [];
  const monthMap: Record<string, Record<string, number>> = {};

  for (const log of logs) {
    if (!log.symptoms) continue;
    const month = log.logDate.slice(0, 7);
    if (!monthMap[month]) monthMap[month] = {};
    log.symptoms.split(",").map(s => s.trim()).filter(Boolean).forEach(symptom => {
      monthMap[month][symptom] = (monthMap[month][symptom] ?? 0) + 1;
    });
  }

  for (const [month, symptoms] of Object.entries(monthMap)) {
    for (const [symptom, count] of Object.entries(symptoms)) {
      trends.push({ symptom, count, month });
    }
  }

  res.json(GetSymptomTrendsResponse.parse(trends));
});

// GET /analytics/mood-trends
router.get("/analytics/mood-trends", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const logs = await db
    .select()
    .from(healthLogsTable)
    .where(eq(healthLogsTable.userId, userId))
    .orderBy(healthLogsTable.logDate);

  const monthMap: Record<string, Record<string, number>> = {};
  for (const log of logs) {
    if (!log.mood) continue;
    const month = log.logDate.slice(0, 7);
    if (!monthMap[month]) monthMap[month] = {};
    monthMap[month][log.mood] = (monthMap[month][log.mood] ?? 0) + 1;
  }

  const trends: { mood: string; count: number; month: string }[] = [];
  for (const [month, moods] of Object.entries(monthMap)) {
    for (const [mood, count] of Object.entries(moods)) {
      trends.push({ mood, count, month });
    }
  }

  res.json(GetMoodTrendsResponse.parse(trends));
});

// GET /analytics/cycle-calendar
router.get("/analytics/cycle-calendar", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const year = parseInt(String(req.query.year ?? new Date().getFullYear()), 10);
  const month = parseInt(String(req.query.month ?? new Date().getMonth() + 1), 10);

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  const cycles = await db
    .select()
    .from(cyclesTable)
    .where(eq(cyclesTable.userId, userId))
    .orderBy(desc(cyclesTable.startDate))
    .limit(3);

  const logs = await db
    .select()
    .from(healthLogsTable)
    .where(eq(healthLogsTable.userId, userId))
    .orderBy(healthLogsTable.logDate);

  const logDates = new Set(logs.map(l => l.logDate));

  const calendarDays: { date: string; type: string; hasLog: boolean; phase: string | null }[] = [];

  for (let day = 1; day <= lastDay; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayDate = new Date(dateStr);

    let type = "normal";
    let phase: string | null = null;

    // Check if this day falls within any cycle period
    for (const cycle of cycles) {
      const cycleStart = new Date(cycle.startDate);
      const cycleEnd = cycle.endDate ? new Date(cycle.endDate) : addDays(cycleStart, 5);

      if (dayDate >= cycleStart && dayDate <= cycleEnd) {
        type = "period";
        phase = "menstrual";
        break;
      }

      // Prediction for next cycle
      if (cycles.length > 0) {
        const avgLen = 28;
        const nextStart = addDays(new Date(cycles[0].startDate), avgLen);
        const nextEnd = addDays(nextStart, 5);
        const ovulation = addDays(nextStart, -14);
        const fertileStart = addDays(ovulation, -5);
        const fertileEnd = addDays(ovulation, 1);

        if (dateStr === ovulation.toISOString().split("T")[0]) {
          type = "ovulation";
          phase = "ovulation";
        } else if (dayDate >= fertileStart && dayDate <= fertileEnd) {
          type = "fertile";
          phase = "fertile";
        } else if (dayDate >= nextStart && dayDate <= nextEnd) {
          type = "predicted-period";
          phase = "predicted";
        }
      }
    }

    calendarDays.push({ date: dateStr, type, hasLog: logDates.has(dateStr), phase });
  }

  res.json(GetCycleCalendarResponse.parse(calendarDays));
});

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default router;
