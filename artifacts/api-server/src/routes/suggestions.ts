import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, suggestionsTable, usersTable } from "@workspace/db";
import {
  ListSuggestionsQueryParams,
  CreateSuggestionBody,
  UpdateSuggestionParams,
  UpdateSuggestionBody,
  ListSuggestionsResponse,
  CreateSuggestionResponse,
  UpdateSuggestionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const formatSuggestion = async (row: typeof suggestionsTable.$inferSelect) => {
  const [user] = await db.select({ nameAr: usersTable.nameAr }).from(usersTable).where(eq(usersTable.id, row.userId));
  return {
    id: row.id,
    userId: row.userId,
    userName: user?.nameAr ?? "",
    category: row.category,
    text: row.text,
    status: row.status,
    date: row.createdAt.toISOString().slice(0, 10),
    feedback: row.feedback ?? null,
  };
};

router.get("/suggestions", async (req, res): Promise<void> => {
  const qp = ListSuggestionsQueryParams.safeParse(req.query);
  const userId = qp.success ? qp.data.userId : undefined;

  let query = db.select().from(suggestionsTable).orderBy(desc(suggestionsTable.createdAt)).$dynamic();
  if (userId !== undefined) {
    query = query.where(eq(suggestionsTable.userId, userId));
  }

  const rows = await query;
  const formatted = await Promise.all(rows.map(formatSuggestion));
  res.json(ListSuggestionsResponse.parse(formatted));
});

router.post("/suggestions", async (req, res): Promise<void> => {
  const parsed = CreateSuggestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(suggestionsTable)
    .values({
      userId: parsed.data.userId,
      category: parsed.data.category,
      text: parsed.data.text,
      status: "new",
    })
    .returning();

  const formatted = await formatSuggestion(row);
  res.status(201).json(CreateSuggestionResponse.parse(formatted));
});

router.patch("/suggestions/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateSuggestionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateSuggestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.feedback !== undefined) updateData.feedback = parsed.data.feedback;

  const rows = await db
    .update(suggestionsTable)
    .set(updateData)
    .where(eq(suggestionsTable.id, params.data.id))
    .returning();

  if (!rows.length) {
    res.status(404).json({ error: "Suggestion not found" });
    return;
  }

  const formatted = await formatSuggestion(rows[0]);
  res.json(UpdateSuggestionResponse.parse(formatted));
});

export default router;
