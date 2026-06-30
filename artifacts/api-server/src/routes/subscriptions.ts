import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, subscriptionsTable, usersTable, notificationsTable } from "@workspace/db";
import {
  GetMySubscriptionResponse,
  SubmitSubscriptionBody,
  SubmitSubscriptionResponse,
} from "@workspace/api-zod";
import { getUserId } from "../lib/getUserId.js";
import { serialize } from "../lib/serialize.js";
import { checkSubscriptionStatus } from "../lib/subscription-status.js";

const router: IRouter = Router();

// GET /subscriptions/me
router.get("/subscriptions/me", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  await checkSubscriptionStatus(userId);

  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(1);

  if (!sub) {
    res.json(GetMySubscriptionResponse.parse({
      id: 0,
      userId,
      planName: "Premium",
      priceEtb: 990,
      status: "none",
      receiptImageUrl: null,
      transferDate: null,
      senderName: null,
      bankAccount: null,
      adminNotes: null,
      expiresAt: null,
      createdAt: new Date().toISOString(),
    }));
    return;
  }

  res.json(GetMySubscriptionResponse.parse({ ...serialize(sub), priceEtb: Number(sub.priceEtb) }));
});

// POST /subscriptions
router.post("/subscriptions", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = SubmitSubscriptionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  if (!parsed.data.receiptImageUrl.startsWith("/objects/")) {
    res.status(400).json({ error: "Invalid receipt image path" });
    return;
  }

  const [sub] = await db.insert(subscriptionsTable).values({
    userId,
    planName: "Premium",
    priceEtb: "990",
    status: "pending",
    ...parsed.data,
  }).returning();

  // Notify all admins that a new payment receipt is awaiting review.
  try {
    const [payer] = await db
      .select({ firstName: usersTable.firstName, username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    const payerName = payer?.firstName || payer?.username || `User #${userId}`;

    const admins = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.isAdmin, true));

    if (admins.length > 0) {
      await db.insert(notificationsTable).values(
        admins.map((admin) => ({
          userId: admin.id,
          type: "payment_pending",
          message: `${payerName} submitted a payment receipt. Please review and approve it in the admin dashboard.`,
        })),
      );
    }
  } catch (err) {
    req.log.error({ err }, "Failed to notify admins of new payment submission");
  }

  res.status(201).json(SubmitSubscriptionResponse.parse({ ...serialize(sub), priceEtb: Number(sub.priceEtb) }));
});

export default router;
