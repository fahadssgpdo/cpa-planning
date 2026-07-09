import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, inquiriesTable, usersTable } from "@workspace/db";
import {
  ListInquiriesQueryParams,
  CreateInquiryBody,
  UpdateInquiryParams,
  UpdateInquiryBody,
  ListInquiriesResponse,
  CreateInquiryResponse,
  UpdateInquiryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const formatInquiry = async (row: typeof inquiriesTable.$inferSelect) => {
  const [user] = await db
    .select({ nameAr: usersTable.nameAr, designation: usersTable.designation })
    .from(usersTable)
    .where(eq(usersTable.id, row.userId));
  let responderName: string | null = null;
  if (row.responderId) {
    const [r] = await db.select({ nameAr: usersTable.nameAr }).from(usersTable).where(eq(usersTable.id, row.responderId));
    responderName = r?.nameAr ?? null;
  }
  return {
    id: row.id,
    userId: row.userId,
    userName: user?.nameAr ?? "",
    userDesignation: user?.designation ?? null,
    subject: row.subject,
    details: row.details,
    status: row.status,
    date: row.createdAt.toISOString().slice(0, 10),
    response: row.response ?? null,
    responderId: row.responderId ?? null,
    responderName,
  };
};

router.get("/inquiries", async (req, res): Promise<void> => {
  const qp = ListInquiriesQueryParams.safeParse(req.query);
  const userId = qp.success ? qp.data.userId : undefined;

  let query = db
    .select()
    .from(inquiriesTable)
    .orderBy(desc(inquiriesTable.createdAt))
    .$dynamic();

  if (userId !== undefined) {
    query = query.where(eq(inquiriesTable.userId, userId));
  }

  const rows = await query;
  const formatted = await Promise.all(rows.map(formatInquiry));
  res.json(ListInquiriesResponse.parse(formatted));
});

router.post("/inquiries", async (req, res): Promise<void> => {
  const parsed = CreateInquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(inquiriesTable)
    .values({
      userId: parsed.data.userId,
      subject: parsed.data.subject,
      details: parsed.data.details,
      status: "open",
    })
    .returning();

  const formatted = await formatInquiry(row);
  res.status(201).json(CreateInquiryResponse.parse(formatted));
});

router.patch("/inquiries/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateInquiryParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateInquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.response !== undefined) updateData.response = parsed.data.response;
  if (parsed.data.responderId !== undefined) updateData.responderId = parsed.data.responderId;

  const rows = await db
    .update(inquiriesTable)
    .set(updateData)
    .where(eq(inquiriesTable.id, params.data.id))
    .returning();

  if (!rows.length) {
    res.status(404).json({ error: "Inquiry not found" });
    return;
  }

  const formatted = await formatInquiry(rows[0]);
  res.json(UpdateInquiryResponse.parse(formatted));
});

export default router;
