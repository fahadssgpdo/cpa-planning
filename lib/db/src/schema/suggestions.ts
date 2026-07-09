import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const suggestionsTable = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  category: text("category").notNull().default("feedback"),
  text: text("text").notNull(),
  status: text("status").notNull().default("new"),
  feedback: text("feedback"),
  attachment: text("attachment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSuggestionSchema = createInsertSchema(suggestionsTable).omit({ id: true, createdAt: true });
export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
export type Suggestion = typeof suggestionsTable.$inferSelect;
