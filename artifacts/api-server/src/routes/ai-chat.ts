import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, aiMessagesTable, cyclesTable, healthLogsTable } from "@workspace/db";
import {
  ListAiMessagesResponse,
  SendAiMessageBody,
  SendAiMessageResponse,
} from "@workspace/api-zod";
import { getUserId } from "../lib/getUserId.js";
import { openai } from "@workspace/integrations-openai-ai-server";
import { serialize } from "../lib/serialize.js";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are FemFlow, a warm and knowledgeable AI women's health companion. You specialize in menstrual health, wellness, and reproductive education. You are empathetic, supportive, and informative.

Guidelines:
- Always respond with warmth and empathy
- Provide evidence-based health information
- For medical concerns, always advise consulting a healthcare professional
- Keep responses concise but thorough
- You can discuss: cycle tracking, PMS, fertility awareness, nutrition, exercise, mental wellbeing, hormonal health, pregnancy basics, and menopause
- Remember the user's context from the conversation
- Be encouraging about healthy habits
- Do not provide medical diagnoses`;

// GET /ai-messages
router.get("/ai-messages", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const limit = parseInt(String(req.query.limit ?? "50"), 10);
  const offset = parseInt(String(req.query.offset ?? "0"), 10);

  const messages = await db
    .select()
    .from(aiMessagesTable)
    .where(eq(aiMessagesTable.userId, userId))
    .orderBy(desc(aiMessagesTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(ListAiMessagesResponse.parse(serialize(messages.reverse())));
});

// POST /ai-messages
router.post("/ai-messages", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = SendAiMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  // Save user message
  const [userMsg] = await db.insert(aiMessagesTable).values({
    userId,
    role: "user",
    content: parsed.data.content,
  }).returning();

  // Get recent conversation history
  const history = await db
    .select()
    .from(aiMessagesTable)
    .where(eq(aiMessagesTable.userId, userId))
    .orderBy(desc(aiMessagesTable.createdAt))
    .limit(20);

  // Build context with recent health data
  const recentCycles = await db
    .select()
    .from(cyclesTable)
    .where(eq(cyclesTable.userId, userId))
    .orderBy(desc(cyclesTable.startDate))
    .limit(3);

  const recentLogs = await db
    .select()
    .from(healthLogsTable)
    .where(eq(healthLogsTable.userId, userId))
    .orderBy(desc(healthLogsTable.logDate))
    .limit(3);

  const contextMsg = buildContextMessage(recentCycles, recentLogs);

  const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT + (contextMsg ? `\n\nUser health context:\n${contextMsg}` : "") },
    ...history.reverse().slice(0, -1).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: parsed.data.content },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_completion_tokens: 1024,
    messages: chatMessages,
  });

  const aiContent = completion.choices[0]?.message?.content ?? "I'm here to support you. Could you tell me more?";

  const [aiMsg] = await db.insert(aiMessagesTable).values({
    userId,
    role: "assistant",
    content: aiContent,
  }).returning();

  res.status(201).json(SendAiMessageResponse.parse(serialize({ userMessage: userMsg, assistantMessage: aiMsg })));
});

function buildContextMessage(cycles: typeof cyclesTable.$inferSelect[], logs: typeof healthLogsTable.$inferSelect[]): string {
  const parts: string[] = [];

  if (cycles.length > 0) {
    const latest = cycles[0];
    parts.push(`Last period started: ${latest.startDate}${latest.endDate ? `, ended: ${latest.endDate}` : ""}`);
  }

  if (logs.length > 0) {
    const recent = logs[0];
    const logParts = [];
    if (recent.mood) logParts.push(`mood: ${recent.mood}`);
    if (recent.painLevel !== null) logParts.push(`pain level: ${recent.painLevel}/10`);
    if (recent.energyLevel !== null) logParts.push(`energy: ${recent.energyLevel}/10`);
    if (recent.symptoms) {
      const s = Array.isArray(recent.symptoms) ? recent.symptoms.join(", ") : String(recent.symptoms);
      logParts.push(`symptoms: ${s}`);
    }
    if (logParts.length > 0) parts.push(`Most recent health log (${recent.logDate}): ${logParts.join(", ")}`);
  }

  return parts.join("\n");
}

export default router;
