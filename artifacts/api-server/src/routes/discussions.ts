import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, discussionsTable, commentsTable, usersTable } from "@workspace/db";
import {
  CreateDiscussionBody,
  GetDiscussionParams,
  UpdateDiscussionParams,
  UpdateDiscussionBody,
  CreateCommentParams,
  CreateCommentBody,
  ListDiscussionsResponse,
  CreateDiscussionResponse,
  GetDiscussionResponse,
  UpdateDiscussionResponse,
  CreateCommentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/discussions", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: discussionsTable.id,
      title: discussionsTable.title,
      description: discussionsTable.description,
      status: discussionsTable.status,
      authorId: discussionsTable.authorId,
      authorName: usersTable.nameAr,
      authorDesignation: usersTable.designation,
      authorDepartment: usersTable.department,
      createdAt: discussionsTable.createdAt,
    })
    .from(discussionsTable)
    .leftJoin(usersTable, eq(discussionsTable.authorId, usersTable.id))
    .orderBy(desc(discussionsTable.createdAt));

  const counts = await db
    .select({
      discussionId: commentsTable.discussionId,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(commentsTable)
    .groupBy(commentsTable.discussionId);

  const countMap = new Map(counts.map((c) => [c.discussionId, c.count]));

  res.json(
    ListDiscussionsResponse.parse(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        status: r.status,
        date: r.createdAt.toISOString().slice(0, 10),
        authorId: r.authorId,
        authorName: r.authorName ?? "",
        authorDesignation: r.authorDesignation ?? null,
        authorDepartment: r.authorDepartment ?? null,
        commentCount: countMap.get(r.id) ?? 0,
      }))
    )
  );
});

router.post("/discussions", async (req, res): Promise<void> => {
  const parsed = CreateDiscussionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(discussionsTable)
    .values({
      title: parsed.data.title,
      description: parsed.data.description,
      authorId: parsed.data.authorId,
      status: "open",
    })
    .returning();

  const [author] = await db.select({ nameAr: usersTable.nameAr }).from(usersTable).where(eq(usersTable.id, row.authorId));
  res.status(201).json(
    CreateDiscussionResponse.parse({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      date: row.createdAt.toISOString().slice(0, 10),
      authorId: row.authorId,
      authorName: author?.nameAr ?? "",
      commentCount: 0,
    })
  );
});

router.get("/discussions/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetDiscussionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [disc] = await db
    .select({
      id: discussionsTable.id,
      title: discussionsTable.title,
      description: discussionsTable.description,
      status: discussionsTable.status,
      authorId: discussionsTable.authorId,
      authorName: usersTable.nameAr,
      authorDesignation: usersTable.designation,
      authorDepartment: usersTable.department,
      createdAt: discussionsTable.createdAt,
    })
    .from(discussionsTable)
    .leftJoin(usersTable, eq(discussionsTable.authorId, usersTable.id))
    .where(eq(discussionsTable.id, params.data.id));

  if (!disc) {
    res.status(404).json({ error: "Discussion not found" });
    return;
  }

  const commentRows = await db
    .select({
      id: commentsTable.id,
      discussionId: commentsTable.discussionId,
      userId: commentsTable.userId,
      userName: usersTable.nameAr,
      userDesignation: usersTable.designation,
      userDepartment: usersTable.department,
      role: usersTable.role,
      text: commentsTable.text,
      createdAt: commentsTable.createdAt,
    })
    .from(commentsTable)
    .leftJoin(usersTable, eq(commentsTable.userId, usersTable.id))
    .where(eq(commentsTable.discussionId, params.data.id))
    .orderBy(commentsTable.createdAt);

  res.json(
    GetDiscussionResponse.parse({
      id: disc.id,
      title: disc.title,
      description: disc.description,
      status: disc.status,
      date: disc.createdAt.toISOString().slice(0, 10),
      authorId: disc.authorId,
      authorName: disc.authorName ?? "",
      authorDesignation: disc.authorDesignation ?? null,
      authorDepartment: disc.authorDepartment ?? null,
      comments: commentRows.map((c) => ({
        id: c.id,
        discussionId: c.discussionId,
        userId: c.userId,
        userName: c.userName ?? "",
        userDesignation: c.userDesignation ?? null,
        userDepartment: c.userDepartment ?? null,
        isStaff: c.role === "officer" || c.role === "manager",
        text: c.text,
        date: c.createdAt.toISOString().slice(0, 10),
      })),
    })
  );
});

router.patch("/discussions/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateDiscussionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDiscussionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;

  const rows = await db
    .update(discussionsTable)
    .set(updateData)
    .where(eq(discussionsTable.id, params.data.id))
    .returning();

  if (!rows.length) {
    res.status(404).json({ error: "Discussion not found" });
    return;
  }
  const row = rows[0];
  const [author] = await db.select({ nameAr: usersTable.nameAr, designation: usersTable.designation, department: usersTable.department }).from(usersTable).where(eq(usersTable.id, row.authorId));
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(commentsTable)
    .where(eq(commentsTable.discussionId, row.id));

  res.json(
    UpdateDiscussionResponse.parse({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      date: row.createdAt.toISOString().slice(0, 10),
      authorId: row.authorId,
      authorName: author?.nameAr ?? "",
      authorDesignation: author?.designation ?? null,
      authorDepartment: author?.department ?? null,
      commentCount: count ?? 0,
    })
  );
});

router.post("/discussions/:id/comments", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CreateCommentParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [disc] = await db.select().from(discussionsTable).where(eq(discussionsTable.id, params.data.id));
  if (!disc) {
    res.status(404).json({ error: "Discussion not found" });
    return;
  }

  const [comment] = await db
    .insert(commentsTable)
    .values({
      discussionId: params.data.id,
      userId: parsed.data.userId,
      text: parsed.data.text,
    })
    .returning();

  const [user] = await db.select({ nameAr: usersTable.nameAr, role: usersTable.role }).from(usersTable).where(eq(usersTable.id, parsed.data.userId));

  res.status(201).json(
    CreateCommentResponse.parse({
      id: comment.id,
      discussionId: comment.discussionId,
      userId: comment.userId,
      userName: user?.nameAr ?? "",
      isStaff: user?.role === "officer" || user?.role === "manager",
      text: comment.text,
      date: comment.createdAt.toISOString().slice(0, 10),
    })
  );
});

export default router;
