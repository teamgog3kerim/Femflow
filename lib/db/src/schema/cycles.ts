import { pgTable, text, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cyclesTable = pgTable("cycles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }),
  flowIntensity: text("flow_intensity"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCycleSchema = createInsertSchema(cyclesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCycle = z.infer<typeof insertCycleSchema>;
export type Cycle = typeof cyclesTable.$inferSelect;
