import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import {
  ListNotificationsResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
} from "@workspace/api-zod";
import { getUserId } from "../lib/getUserId.js";
import { serialize } from "../lib/serialize.js";
import { checkSubscriptionStatus } from "../lib/subscription-status.js";

const router: IRouter = Router();

// GET /notifications
router.get("/notifications", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  await checkSubscriptionStatus(userId);

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(20);

  res.json(ListNotificationsResponse.parse(serialize(notifications)));
});

// PATCH /notifications/:id/read
router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = MarkNotificationReadParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [notif] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, params.data.id), eq(notificationsTable.userId, userId)))
    .returning();

  if (!notif) { res.status(404).json({ error: "Notification not found" }); return; }
  res.json(MarkNotificationReadResponse.parse(serialize(notif)));
});

export default router;
