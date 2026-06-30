import { and, desc, eq, gte } from "drizzle-orm";
import { db, usersTable, subscriptionsTable, notificationsTable } from "@workspace/db";

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_WINDOW_MS = 3 * DAY_MS;

type Lang = "en" | "ar";

function daysLeft(expiresAt: Date, now: Date): number {
  return Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_MS));
}

const messages = {
  trialExpiring: (lang: Lang, days: number) =>
    lang === "ar"
      ? `تنتهي فترتك التجريبية المجانية خلال ${days} ${days === 1 ? "يوم" : "أيام"}. اشتركي مقابل 990 بر كل 3 أشهر لمواصلة الوصول الكامل.`
      : `Your free trial ends in ${days} day${days === 1 ? "" : "s"}. Subscribe for 990 birr every 3 months to keep full access.`,
  trialExpired: (lang: Lang) =>
    lang === "ar"
      ? "انتهت فترتك التجريبية المجانية. اشتركي مقابل 990 بر كل 3 أشهر لاستعادة الوصول الكامل."
      : "Your free trial has ended. Subscribe for 990 birr every 3 months to restore full access.",
  subExpiring: (lang: Lang, days: number) =>
    lang === "ar"
      ? `سينتهي اشتراكك المميز خلال ${days} ${days === 1 ? "يوم" : "أيام"}. جددي اشتراكك (990 بر / 3 أشهر) لتجنب انقطاع الخدمة.`
      : `Your premium subscription expires in ${days} day${days === 1 ? "" : "s"}. Renew (990 birr / 3 months) to avoid interruption.`,
  subExpired: (lang: Lang) =>
    lang === "ar"
      ? "انتهى اشتراكك المميز. جددي اشتراكك (990 بر / 3 أشهر) لاستعادة الوصول الكامل."
      : "Your premium subscription has expired. Renew (990 birr / 3 months) to restore full access.",
};

/** Create a notification only if one of `type` was not already created within the reminder window. */
async function ensureReminder(userId: number, type: string, message: string, now: Date): Promise<void> {
  const since = new Date(now.getTime() - REMINDER_WINDOW_MS);
  const [existing] = await db
    .select({ id: notificationsTable.id })
    .from(notificationsTable)
    .where(
      and(
        eq(notificationsTable.userId, userId),
        eq(notificationsTable.type, type),
        gte(notificationsTable.createdAt, since),
      ),
    )
    .limit(1);
  if (existing) return;
  await db.insert(notificationsTable).values({ userId, type, message });
}

/**
 * Lazily reconcile a user's subscription/trial state on read:
 * - downgrade expired trials/subscriptions to "expired"
 * - emit a reminder notification within 3 days of expiry (deduped)
 * Safe to call on any authenticated read endpoint.
 */
export async function checkSubscriptionStatus(userId: number): Promise<void> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return;

  const now = new Date();
  const lang: Lang = user.language === "ar" ? "ar" : "en";

  if (user.subscriptionStatus === "trial") {
    const trialEndsAt = user.trialEndsAt;
    if (!trialEndsAt) return;
    if (trialEndsAt.getTime() <= now.getTime()) {
      await db.update(usersTable).set({ subscriptionStatus: "expired" }).where(eq(usersTable.id, userId));
      await ensureReminder(userId, "trial_expired", messages.trialExpired(lang), now);
    } else if (trialEndsAt.getTime() - now.getTime() <= REMINDER_WINDOW_MS) {
      await ensureReminder(userId, "trial_expiring", messages.trialExpiring(lang, daysLeft(trialEndsAt, now)), now);
    }
    return;
  }

  if (user.subscriptionStatus === "premium") {
    const [sub] = await db
      .select()
      .from(subscriptionsTable)
      .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")))
      .orderBy(desc(subscriptionsTable.expiresAt))
      .limit(1);
    const expiresAt = sub?.expiresAt;
    // A premium user with no active, dated subscription has no valid entitlement: downgrade.
    if (!expiresAt) {
      await db.update(usersTable).set({ subscriptionStatus: "expired" }).where(eq(usersTable.id, userId));
      await ensureReminder(userId, "subscription_expired", messages.subExpired(lang), now);
      return;
    }
    if (expiresAt.getTime() <= now.getTime()) {
      await db.update(usersTable).set({ subscriptionStatus: "expired" }).where(eq(usersTable.id, userId));
      await db.update(subscriptionsTable).set({ status: "expired" }).where(eq(subscriptionsTable.id, sub.id));
      await ensureReminder(userId, "subscription_expired", messages.subExpired(lang), now);
    } else if (expiresAt.getTime() - now.getTime() <= REMINDER_WINDOW_MS) {
      await ensureReminder(userId, "subscription_expiring", messages.subExpiring(lang, daysLeft(expiresAt, now)), now);
    }
  }
}
