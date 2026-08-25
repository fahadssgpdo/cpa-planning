import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, faqsTable } from "@workspace/db";
import {
  CreateFaqBody,
  UpdateFaqParams,
  UpdateFaqBody,
  DeleteFaqParams,
  ListFaqsResponse,
  CreateFaqResponse,
  UpdateFaqResponse,
} from "@workspace/api-zod";
import { requirePlanningStaff, requireSession } from "../middlewares/announcement-auth";

const router: IRouter = Router();

router.get("/faqs", async (_req, res): Promise<void> => {
  const rows = await db.select().from(faqsTable).orderBy(faqsTable.id);
  res.json(
    ListFaqsResponse.parse(
      rows.map((r) => ({ id: r.id, question: r.question, answer: r.answer }))
    )
  );
});

router.post("/faqs", requireSession, requirePlanningStaff, async (req, res): Promise<void> => {
  const parsed = CreateFaqBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(faqsTable).values({ question: parsed.data.question, answer: parsed.data.answer }).returning();
  res.status(201).json(CreateFaqResponse.parse({ id: row.id, question: row.question, answer: row.answer }));
});

router.patch("/faqs/:id", requireSession, requirePlanningStaff, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateFaqParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateFaqBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.question !== undefined) updateData.question = parsed.data.question;
  if (parsed.data.answer !== undefined) updateData.answer = parsed.data.answer;

  const rows = await db.update(faqsTable).set(updateData).where(eq(faqsTable.id, params.data.id)).returning();
  if (!rows.length) {
    res.status(404).json({ error: "FAQ not found" });
    return;
  }
  res.json(UpdateFaqResponse.parse({ id: rows[0].id, question: rows[0].question, answer: rows[0].answer }));
});

router.delete("/faqs/:id", requireSession, requirePlanningStaff, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteFaqParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db.delete(faqsTable).where(eq(faqsTable.id, params.data.id)).returning();
  if (!rows.length) {
    res.status(404).json({ error: "FAQ not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
