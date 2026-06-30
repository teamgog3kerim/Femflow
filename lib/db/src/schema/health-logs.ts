import { pgTable, text, serial, integer, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const healthLogsTable = pgTable("health_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  logDate: date("log_date", { mode: "string" }).notNull(),
  symptoms: text("symptoms"),
  mood: text("mood"),
  painLevel: integer("pain_level"),
  energyLevel: integer("energy_level"),
  sleepHours: numeric("sleep_hours", { precision: 4, scale: 1 }),
  waterIntakeLiters: numeric("water_intake_liters", { precision: 4, scale: 1 }),
  exerciseMinutes: integer("exercise_minutes"),
  nutrition: text("nutrition"),
  weightKg: numeric("weight_kg", { precision: 5, scale: 1 }),
  bodyTemperature: numeric("body_temperature", { precision: 4, scale: 1 }),
  medication: text("medication"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertHealthLogSchema = createInsertSchema(healthLogsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHealthLog = z.infer<typeof insertHealthLogSchema>;
export type HealthLog = typeof healthLogsTable.$inferSelect;
