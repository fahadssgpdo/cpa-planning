import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, glossaryTable } from "@workspace/db";
import {
  ListGlossaryResponse,
  CreateGlossaryEntryBody,
  CreateGlossaryEntryResponse,
  DeleteGlossaryEntryParams,
} from "@workspace/api-zod";
import { requirePlanningStaff, requireSession } from "../middlewares/announcement-auth";

const router: IRouter = Router();

const formatEntry = (row: typeof glossaryTable.$inferSelect) => ({
  id: row.id,
  termAr: row.termAr,
  termEn: row.termEn ?? null,
  definition: row.definition,
  examples: row.examples ?? null,
  date: row.createdAt.toISOString().slice(0, 10),
});

router.get("/glossary", async (_req, res): Promise<void> => {
  const rows = await db.select().from(glossaryTable).orderBy(desc(glossaryTable.createdAt));
  res.json(ListGlossaryResponse.parse(rows.map(formatEntry)));
});

router.post("/glossary", requireSession, requirePlanningStaff, async (req, res): Promise<void> => {
  const parsed = CreateGlossaryEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(glossaryTable)
    .values({
      termAr: parsed.data.termAr,
      termEn: parsed.data.termEn ?? null,
      definition: parsed.data.definition,
      examples: parsed.data.examples ?? null,
    })
    .returning();

  res.status(201).json(CreateGlossaryEntryResponse.parse(formatEntry(row)));
});

router.delete("/glossary/:id", requireSession, requirePlanningStaff, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteGlossaryEntryParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(glossaryTable).where(eq(glossaryTable.id, params.data.id));
  res.status(204).send();
});

export default router;
