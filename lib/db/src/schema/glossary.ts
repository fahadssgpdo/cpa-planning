import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const glossaryTable = pgTable("glossary", {
  id: serial("id").primaryKey(),
  termAr: text("term_ar").notNull(),
  termEn: text("term_en"),
  definition: text("definition").notNull(),
  examples: text("examples"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGlossarySchema = createInsertSchema(glossaryTable).omit({ id: true, createdAt: true });
export type InsertGlossary = z.infer<typeof insertGlossarySchema>;
export type GlossaryEntry = typeof glossaryTable.$inferSelect;
