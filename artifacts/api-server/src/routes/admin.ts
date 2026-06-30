import { Router, type IRouter } from "express";
import { eq, desc, count, gte } from "drizzle-orm";
import { db, usersTable, subscriptionsTable, articlesTable, cyclesTable, healthLogsTable, aiMessagesTable, notificationsTable, announcementsTable } from "@workspace/db";
import {
  AdminCreateArticleBody,
  AdminCreateArticleResponse,
  AdminDeleteArticleParams,
  AdminGetAnalyticsResponse,
  AdminListArticlesResponse,
  AdminListSubscriptionsResponse,
  AdminListUsersResponse,
  AdminSendAnnouncementBody,
  AdminSendAnnouncementResponse,
  AdminUpdateArticleBody,
  AdminUpdateArticleParams,
  AdminUpdateArticleResponse,
  AdminUpdateSubscriptionBody,
  AdminUpdateSubscriptionParams,
  AdminUpdateSubscriptionResponse,
} from "@workspace/api-zod";
import { getUserId } from "../lib/getUserId.js";
import { serialize } from "../lib/serialize.js";

const router: IRouter = Router();

// Admin check helper
async function checkAdmin(req: Parameters<typeof router.get>[1] extends (req: infer R, ...args: unknown[]) => unknown ? R : never, res: Parameters<typeof router.get>[1] extends (...args: [unknown, infer R, ...unknown[]]) => unknown ? R : never): Promise<boolean> {
  const userId = getUserId(req as Parameters<typeof router.get>[1] extends (req: infer R, ...args: unknown[]) => unknown ? R : never);
  if (!userId) {
    (res as Parameters<typeof router.get>[1] extends (...args: [unknown, infer R, ...unknown[]]) => unknown ? R : never).status(401).json({ error: "Unauthorized" });
    return false;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user?.isAdmin) {
    (res as Parameters<typeof router.get>[1] extends (...args: [unknown, infer R, ...unknown[]]) => unknown ? R : never).status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

// GET /admin/users
router.get("/admin/users", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [admin] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!admin?.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

  const limit = parseInt(String(req.query.limit ?? "50"), 10);
  const offset = parseInt(String(req.query.offset ?? "0"), 10);

  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
  const [{ value: total }] = await db.select({ value: count() }).from(usersTable);

  res.json(AdminListUsersResponse.parse(serialize({ users, total: Number(total) })));
});

// GET /admin/subscriptions
router.get("/admin/subscriptions", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [admin] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!admin?.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

  const status = String(req.query.status ?? "");
  const subs = status
    ? await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.status, status)).orderBy(desc(subscriptionsTable.createdAt))
    : await db.select().from(subscriptionsTable).orderBy(desc(subscriptionsTable.createdAt));

  res.json(AdminListSubscriptionsResponse.parse(serialize(subs)));
});

// PATCH /admin/subscriptions/:id
router.patch("/admin/subscriptions/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [admin] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!admin?.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminUpdateSubscriptionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = AdminUpdateSubscriptionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updateData: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.adminNotes !== undefined) updateData.adminNotes = parsed.data.adminNotes;
  if (parsed.data.expiresAt !== undefined) updateData.expiresAt = new Date(parsed.data.expiresAt);

  const [sub] = await db
    .update(subscriptionsTable)
    .set(updateData)
    .where(eq(subscriptionsTable.id, params.data.id))
    .returning();

  if (!sub) { res.status(404).json({ error: "Subscription not found" }); return; }

  // Update user subscription status
  if (parsed.data.status === "active") {
    await db.update(usersTable).set({ subscriptionStatus: "premium" }).where(eq(usersTable.id, sub.userId));
    await db.insert(notificationsTable).values({
      userId: sub.userId,
      type: "subscription_approved",
      message: "Your Premium subscription has been approved! Enjoy full access to FemFlow.",
    });
  } else if (parsed.data.status === "rejected") {
    await db.update(usersTable).set({ subscriptionStatus: "free" }).where(eq(usersTable.id, sub.userId));
    await db.insert(notificationsTable).values({
      userId: sub.userId,
      type: "subscription_rejected",
      message: "Your subscription request was not approved. Please contact support for assistance.",
    });
  }

  res.json(AdminUpdateSubscriptionResponse.parse(serialize(sub)));
});

// GET /admin/analytics
router.get("/admin/analytics", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [admin] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!admin?.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

  const [{ value: totalUsers }] = await db.select({ value: count() }).from(usersTable);
  const [{ value: activeSubscriptions }] = await db.select({ value: count() }).from(subscriptionsTable).where(eq(subscriptionsTable.status, "active"));
  const [{ value: pendingSubscriptions }] = await db.select({ value: count() }).from(subscriptionsTable).where(eq(subscriptionsTable.status, "pending"));
  const [{ value: totalCyclesLogged }] = await db.select({ value: count() }).from(cyclesTable);
  const [{ value: totalHealthLogs }] = await db.select({ value: count() }).from(healthLogsTable);
  const [{ value: totalAiMessages }] = await db.select({ value: count() }).from(aiMessagesTable);

  const thisMonth = new Date();
  thisMonth.setDate(1);
  const [{ value: newUsersThisMonth }] = await db.select({ value: count() }).from(usersTable).where(gte(usersTable.createdAt, thisMonth));

  res.json(AdminGetAnalyticsResponse.parse({
    totalUsers: Number(totalUsers),
    activeSubscriptions: Number(activeSubscriptions),
    pendingSubscriptions: Number(pendingSubscriptions),
    totalCyclesLogged: Number(totalCyclesLogged),
    totalHealthLogs: Number(totalHealthLogs),
    totalAiMessages: Number(totalAiMessages),
    newUsersThisMonth: Number(newUsersThisMonth),
  }));
});

// GET /admin/articles
router.get("/admin/articles", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [admin] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!admin?.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

  const articles = await db.select().from(articlesTable).orderBy(desc(articlesTable.createdAt));
  res.json(AdminListArticlesResponse.parse(serialize(articles)));
});

// POST /admin/articles
router.post("/admin/articles", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [admin] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!admin?.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

  const parsed = AdminCreateArticleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [article] = await db.insert(articlesTable).values(parsed.data).returning();
  res.status(201).json(AdminCreateArticleResponse.parse(serialize(article)));
});

// PATCH /admin/articles/:id
router.patch("/admin/articles/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [admin] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!admin?.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminUpdateArticleParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = AdminUpdateArticleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [article] = await db.update(articlesTable).set(parsed.data).where(eq(articlesTable.id, params.data.id)).returning();
  if (!article) { res.status(404).json({ error: "Article not found" }); return; }
  res.json(AdminUpdateArticleResponse.parse(serialize(article)));
});

// DELETE /admin/articles/:id
router.delete("/admin/articles/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [admin] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!admin?.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminDeleteArticleParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  await db.delete(articlesTable).where(eq(articlesTable.id, params.data.id));
  res.sendStatus(204);
});

// POST /admin/announcements
router.post("/admin/announcements", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [admin] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!admin?.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

  const parsed = AdminSendAnnouncementBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [announcement] = await db.insert(announcementsTable).values(parsed.data).returning();

  // Send notification to all users
  const allUsers = await db.select({ id: usersTable.id }).from(usersTable);
  if (allUsers.length > 0) {
    await db.insert(notificationsTable).values(
      allUsers.map(u => ({
        userId: u.id,
        type: "announcement",
        message: parsed.data.message,
      }))
    );
  }

  res.status(201).json(AdminSendAnnouncementResponse.parse(serialize(announcement)));
});

export default router;
