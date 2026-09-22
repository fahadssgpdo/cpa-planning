import { pgTable, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en"),
  username: text("username").unique(),
  passwordHash: text("password_hash"),
  designation: text("designation"),
  directorate: text("directorate"),
  department: text("department"),
  section: text("section"),
  role: text("role").notNull().default("employee"),
  active: boolean("active").notNull().default(true),
  sessionVersion: integer("session_version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
