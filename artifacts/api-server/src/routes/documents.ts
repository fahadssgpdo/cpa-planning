import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, documentsTable } from "@workspace/db";
import {
  ListDocumentsQueryParams,
  CreateDocumentBody,
  DeleteDocumentParams,
  ListDocumentsResponse,
  CreateDocumentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/documents", async (req, res): Promise<void> => {
  const qp = ListDocumentsQueryParams.safeParse(req.query);
  const category = qp.success ? qp.data.category : undefined;

  let query = db.select().from(documentsTable).orderBy(desc(documentsTable.createdAt)).$dynamic();
  if (category) {
    query = query.where(eq(documentsTable.category, category));
  }

  const rows = await query;
  res.json(
    ListDocumentsResponse.parse(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        description: r.description,
        date: r.createdAt.toISOString().slice(0, 10),
        fileUrl: r.fileUrl ?? null,
      }))
    )
  );
});

router.post("/documents", async (req, res): Promise<void> => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(documentsTable)
    .values({
      name: parsed.data.name,
      category: parsed.data.category,
      description: parsed.data.description,
      fileUrl: parsed.data.fileUrl ?? null,
    })
    .returning();

  res.status(201).json(
    CreateDocumentResponse.parse({
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description,
      date: row.createdAt.toISOString().slice(0, 10),
      fileUrl: row.fileUrl ?? null,
    })
  );
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteDocumentParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db.delete(documentsTable).where(eq(documentsTable.id, params.data.id)).returning();
  if (!rows.length) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
