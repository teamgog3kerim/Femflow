import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  username: text("username"),
  language: text("language").notNull().default("en"),
  timezone: text("timezone"),
  dateOfBirth: text("date_of_birth"),
  isAdmin: boolean("is_admin").notNull().default(false),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  subscriptionStatus: text("subscription_status").notNull().default("free"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
