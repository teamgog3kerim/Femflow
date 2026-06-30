import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const announcementsTable = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title"),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAnnouncementSchema = createInsertSchema(announcementsTable).omit({ id: true, sentAt: true });
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcementsTable.$inferSelect;
