import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  AuthUserBody,
  AuthUserResponse,
  TelegramAuthBody,
  TelegramAuthResponse,
  GetMeResponse,
  UpdateMeBody,
  UpdateMeResponse,
} from "@workspace/api-zod";
import { sign, verify } from "../lib/auth.js";
import { serialize } from "../lib/serialize.js";
import { validateInitData } from "../lib/telegram.js";
import { checkSubscriptionStatus } from "../lib/subscription-status.js";

const router: IRouter = Router();

const TRIAL_DAYS = 6;
const trialEnd = (): Date => new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

// POST /users/auth
// Dev-only fallback: logs in by raw telegramId without proof-of-possession.
// In production, clients must authenticate via /users/telegram-auth (signed initData).
router.post("/users/auth", async (req, res): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ error: "Use Telegram authentication." });
    return;
  }

  const parsed = AuthUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  let [user] = await db.select().from(usersTable).where(eq(usersTable.telegramId, data.telegramId));

  if (!user) {
    [user] = await db
      .insert(usersTable)
      .values({
        telegramId: data.telegramId,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        username: data.username ?? null,
        language: data.language ?? "en",
        subscriptionStatus: "trial",
        trialEndsAt: trialEnd(),
      })
      .returning();
  }

  const token = sign(user.id);

  res.json(AuthUserResponse.parse(serialize({ user, token })));
});

// POST /users/telegram-auth — authenticate a real Telegram Mini App user via initData
router.post("/users/telegram-auth", async (req, res): Promise<void> => {
  const parsed = TelegramAuthBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    req.log.error("TELEGRAM_BOT_TOKEN is not configured");
    res.status(500).json({ error: "Telegram bot is not configured" });
    return;
  }

  const tgUser = validateInitData(parsed.data.initData, botToken);
  if (!tgUser) {
    res.status(401).json({ error: "Invalid Telegram data" });
    return;
  }

  const telegramId = String(tgUser.id);
  let [user] = await db.select().from(usersTable).where(eq(usersTable.telegramId, telegramId));

  if (!user) {
    const language = parsed.data.language ?? (tgUser.language_code === "ar" ? "ar" : "en");
    [user] = await db
      .insert(usersTable)
      .values({
        telegramId,
        firstName: tgUser.first_name ?? null,
        lastName: tgUser.last_name ?? null,
        username: tgUser.username ?? null,
        language,
        subscriptionStatus: "trial",
        trialEndsAt: trialEnd(),
      })
      .returning();
  }

  const token = sign(user.id);
  res.json(TelegramAuthResponse.parse(serialize({ user, token })));
});

// GET /users/me
router.get("/users/me", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await checkSubscriptionStatus(userId);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetMeResponse.parse(serialize(user)));
});

// PATCH /users/me
router.patch("/users/me", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, userId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(UpdateMeResponse.parse(serialize(user)));
});

function getUserId(req: Parameters<typeof router.get>[1] extends (req: infer R, ...args: unknown[]) => unknown ? R : never): number | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  return verify(token);
}

export default router;
export { getUserId };
