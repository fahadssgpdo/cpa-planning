import { Router, type IRouter, type Response } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod/v4";
import { auditLogsTable, db, usersTable } from "@workspace/db";
import {
  UpdateUserParams,
  ListUsersResponse,
  CreateUserResponse,
  UpdateUserResponse,
} from "@workspace/api-zod";
import { getSessionUser, requireRoles, requireSession } from "../middlewares/announcement-auth";
import { userMutationRateLimit } from "../middlewares/rate-limit";

const router: IRouter = Router();
const userRole = z.enum(["employee", "officer", "manager", "admin"]);
const adminCreateUserBody = z.object({
  nameAr: z.string().trim().min(1),
  nameEn: z.string().nullish(),
  username: z.string().nullish(),
  designation: z.string().nullish(),
  directorate: z.string().nullish(),
  department: z.string().nullish(),
  section: z.string().nullish(),
  role: userRole,
}).strict();
const adminUpdateUserBody = z.object({
  nameAr: z.string().trim().min(1).optional(),
  nameEn: z.string().nullish().optional(),
  username: z.string().nullish().optional(),
  designation: z.string().nullish().optional(),
  directorate: z.string().nullish().optional(),
  department: z.string().nullish().optional(),
  section: z.string().nullish().optional(),
  role: userRole.optional(),
  active: z.boolean().optional(),
}).strict();
const resetPasswordBody = z.object({ newPassword: z.string().min(8) }).strict();

async function recordUserAudit(
  res: Response,
  action: "create_user" | "update_user" | "reset_password",
  entityId: number,
  details: Record<string, unknown>,
) {
  const actor = getSessionUser(res);
  await db.insert(auditLogsTable).values({
    userId: actor.id,
    userName: actor.nameAr,
    action,
    entityType: "user",
    entityId,
    details: JSON.stringify(details),
  });
}

const mapUser = (u: typeof usersTable.$inferSelect) => ({
  id: u.id,
  nameAr: u.nameAr,
  nameEn: u.nameEn ?? null,
  username: u.username ?? null,
  designation: u.designation ?? null,
  directorate: u.directorate ?? null,
  department: u.department ?? null,
  section: u.section ?? null,
  role: u.role,
  active: u.active,
  createdAt: u.createdAt.toISOString().slice(0, 10),
});

router.get("/users", requireSession, requireRoles("admin"), async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.id);
  res.json(ListUsersResponse.parse(users.map(mapUser)));
});

router.post("/users", requireSession, requireRoles("admin"), userMutationRateLimit, async (req, res): Promise<void> => {
  const parsed = adminCreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db
    .insert(usersTable)
    .values({
      nameAr: parsed.data.nameAr,
      nameEn: parsed.data.nameEn ?? null,
      username: parsed.data.username ?? null,
      designation: parsed.data.designation ?? null,
      directorate: parsed.data.directorate ?? null,
      department: parsed.data.department ?? null,
      section: parsed.data.section ?? null,
      role: parsed.data.role,
      active: true,
    })
    .returning();
  await recordUserAudit(res, "create_user", user.id, {
    role: user.role,
    active: user.active,
  });
  res.status(201).json(CreateUserResponse.parse(mapUser(user)));
});

router.patch("/users/:id", requireSession, requireRoles("admin"), userMutationRateLimit, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateUserParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = adminUpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.nameAr !== undefined) updateData.nameAr = parsed.data.nameAr;
  if (parsed.data.nameEn !== undefined) updateData.nameEn = parsed.data.nameEn;
  if (parsed.data.username !== undefined) updateData.username = parsed.data.username;
  if (parsed.data.designation !== undefined) updateData.designation = parsed.data.designation;
  if (parsed.data.directorate !== undefined) updateData.directorate = parsed.data.directorate;
  if (parsed.data.department !== undefined) updateData.department = parsed.data.department;
  if (parsed.data.section !== undefined) updateData.section = parsed.data.section;
  if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
  if (parsed.data.active !== undefined) updateData.active = parsed.data.active;

  const [existing] = await db
    .select({ role: usersTable.role, active: usersTable.active })
    .from(usersTable)
    .where(eq(usersTable.id, params.data.id))
    .limit(1);
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, params.data.id))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await recordUserAudit(res, "update_user", user.id, {
    changedFields: Object.keys(updateData),
    ...(parsed.data.role !== undefined ? { role: { from: existing.role, to: user.role } } : {}),
    ...(parsed.data.active !== undefined ? { active: { from: existing.active, to: user.active } } : {}),
  });
  res.json(UpdateUserResponse.parse(mapUser(user)));
});

router.post("/users/:id/reset-password", requireSession, requireRoles("admin"), userMutationRateLimit, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  const parsed = resetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "newPassword must be at least 8 characters" });
    return;
  }
  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  const [user] = await db
    .update(usersTable)
    .set({ passwordHash })
    .where(eq(usersTable.id, id))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await recordUserAudit(res, "reset_password", user.id, { passwordChanged: true });
  res.sendStatus(204);
});

export default router;
