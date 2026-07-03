import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, announcementsTable, usersTable } from "@workspace/db";
import {
  ListAnnouncementsQueryParams,
  CreateAnnouncementBody,
  UpdateAnnouncementParams,
  UpdateAnnouncementBody,
  DeleteAnnouncementParams,
  ListAnnouncementsResponse,
  CreateAnnouncementResponse,
  UpdateAnnouncementResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/announcements", async (req, res): Promise<void> => {
  const queryParsed = ListAnnouncementsQueryParams.safeParse(req.query);
  const archivedFilter = queryParsed.success && queryParsed.data.archived !== undefined
    ? queryParsed.data.archived
    : undefined;

  const rows = await db
    .select({
      id: announcementsTable.id,
      title: announcementsTable.title,
      body: announcementsTable.body,
      category: announcementsTable.category,
      authorId: announcementsTable.authorId,
      authorName: usersTable.nameAr,
      archived: announcementsTable.archived,
      createdAt: announcementsTable.createdAt,
    })
    .from(announcementsTable)
    .leftJoin(usersTable, eq(announcementsTable.authorId, usersTable.id))
    .orderBy(desc(announcementsTable.createdAt));

  const filtered = archivedFilter !== undefined
    ? rows.filter((r) => r.archived === archivedFilter)
    : rows;

  res.json(
    ListAnnouncementsResponse.parse(
      filtered.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        category: r.category,
        date: r.createdAt.toISOString().slice(0, 10),
        authorId: r.authorId,
        authorName: r.authorName ?? "",
        archived: r.archived,
      }))
    )
  );
});

router.post("/announcements", async (req, res): Promise<void> => {
  const parsed = CreateAnnouncementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(announcementsTable)
    .values({
      title: parsed.data.title,
      body: parsed.data.body,
      category: parsed.data.category,
      authorId: parsed.data.authorId,
      archived: false,
    })
    .returning();

  const [author] = await db.select({ nameAr: usersTable.nameAr }).from(usersTable).where(eq(usersTable.id, row.authorId));
  res.status(201).json(
    CreateAnnouncementResponse.parse({
      id: row.id,
      title: row.title,
      body: row.body,
      category: row.category,
      date: row.createdAt.toISOString().slice(0, 10),
      authorId: row.authorId,
      authorName: author?.nameAr ?? "",
      archived: row.archived,
    })
  );
});

router.patch("/announcements/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAnnouncementParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAnnouncementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.body !== undefined) updateData.body = parsed.data.body;
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
  if (parsed.data.archived !== undefined) updateData.archived = parsed.data.archived;

  const rows = await db
    .update(announcementsTable)
    .set(updateData)
    .where(eq(announcementsTable.id, params.data.id))
    .returning();

  if (!rows.length) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }
  const row = rows[0];
  const [author] = await db.select({ nameAr: usersTable.nameAr }).from(usersTable).where(eq(usersTable.id, row.authorId));
  res.json(
    UpdateAnnouncementResponse.parse({
      id: row.id,
      title: row.title,
      body: row.body,
      category: row.category,
      date: row.createdAt.toISOString().slice(0, 10),
      authorId: row.authorId,
      authorName: author?.nameAr ?? "",
      archived: row.archived,
    })
  );
});

router.delete("/announcements/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAnnouncementParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db.delete(announcementsTable).where(eq(announcementsTable.id, params.data.id)).returning();
  if (!rows.length) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
