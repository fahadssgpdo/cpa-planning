import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, auditLogsTable } from "@workspace/db";
import { getSessionUser, requireRoles, requireSession } from "../middlewares/announcement-auth";

const router: IRouter = Router();

router.get("/audit-logs", requireSession, requireRoles("admin"), async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(String(req.query.limit || "200"), 10) || 200, 500);
  const rows = await db
    .select()
    .from(auditLogsTable)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(limit);
  res.json(
    rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.userName,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      details: r.details,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/audit-logs", requireSession, requireRoles("admin"), async (req, res): Promise<void> => {
  const { action, entityType, entityId, details } = req.body as Record<string, unknown>;
  const permittedActions = new Set(["create_user", "update_user", "reset_password"]);
  if (
    typeof action !== "string" ||
    !permittedActions.has(action) ||
    entityType !== "user" ||
    (entityId !== undefined && typeof entityId !== "number")
  ) {
    res.status(400).json({ error: "Invalid audit event." });
    return;
  }
  const user = getSessionUser(res);
  const [row] = await db
    .insert(auditLogsTable)
    .values({
      userId: user.id,
      userName: user.nameAr,
      action,
      entityType,
      entityId: typeof entityId === "number" ? entityId : null,
      details: typeof details === "string" ? details : null,
    })
    .returning();
  res.status(201).json({
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    details: row.details,
    createdAt: row.createdAt.toISOString(),
  });
});

export default router;
