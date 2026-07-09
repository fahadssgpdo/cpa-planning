import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  CreateUserBody,
  UpdateUserParams,
  UpdateUserBody,
  ListUsersResponse,
  CreateUserResponse,
  UpdateUserResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const mapUser = (u: typeof usersTable.$inferSelect) => ({
  id: u.id,
  nameAr: u.nameAr,
  nameEn: u.nameEn ?? null,
  username: u.username ?? null,
  designation: u.designation ?? null,
  directorate: u.directorate ?? null,
  section: u.section ?? null,
  role: u.role,
  active: u.active,
  createdAt: u.createdAt.toISOString().slice(0, 10),
});

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.id);
  res.json(ListUsersResponse.parse(users.map(mapUser)));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
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
      section: parsed.data.section ?? null,
      role: parsed.data.role,
      active: true,
    })
    .returning();
  res.status(201).json(CreateUserResponse.parse(mapUser(user)));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateUserParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
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
  if (parsed.data.section !== undefined) updateData.section = parsed.data.section;
  if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
  if (parsed.data.active !== undefined) updateData.active = parsed.data.active;

  const [user] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, params.data.id))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(UpdateUserResponse.parse(mapUser(user)));
});

export default router;
