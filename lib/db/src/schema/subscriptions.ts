import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planName: text("plan_name").notNull().default("Premium"),
  priceEtb: numeric("price_etb", { precision: 10, scale: 2 }).notNull().default("990"),
  status: text("status").notNull().default("pending"), // pending | active | rejected | expired
  receiptImageUrl: text("receipt_image_url"),
  transferDate: text("transfer_date"),
  senderName: text("sender_name"),
  bankAccount: text("bank_account"),
  adminNotes: text("admin_notes"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;
