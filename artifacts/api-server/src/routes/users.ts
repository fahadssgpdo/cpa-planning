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

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.id);
  res.json(
    ListUsersResponse.parse(
      users.map((u) => ({
        id: u.id,
        nameAr: u.nameAr,
        nameEn: u.nameEn ?? null,
        role: u.role,
        active: u.active,
        createdAt: u.createdAt.toISOString().slice(0, 10),
      }))
    )
  );
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
      role: parsed.data.role,
      active: true,
    })
    .returning();
  res.status(201).json(
    CreateUserResponse.parse({
      id: user.id,
      nameAr: user.nameAr,
      nameEn: user.nameEn ?? null,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt.toISOString().slice(0, 10),
    })
  );
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
  res.json(
    UpdateUserResponse.parse({
      id: user.id,
      nameAr: user.nameAr,
      nameEn: user.nameEn ?? null,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt.toISOString().slice(0, 10),
    })
  );
});

export default router;
