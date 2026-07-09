import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const { nameAr, nameEn, username, password, designation, directorate, department, section } =
    req.body as Record<string, unknown>;

  if (
    typeof nameAr !== "string" || !nameAr.trim() ||
    typeof username !== "string" || !username.trim() ||
    typeof password !== "string" || !password
  ) {
    res.status(400).json({ error: "nameAr, username, and password are required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "password_too_short" });
    return;
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, username.trim()))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "username_taken" });
    return;
  }

  // Enforce per-person account limits keyed on Arabic name.
  // Admins and planning-directorate staff may hold up to 2 accounts; everyone else max 1.
  const sameNameUsers = await db
    .select({ role: usersTable.role, directorate: usersTable.directorate })
    .from(usersTable)
    .where(eq(usersTable.nameAr, nameAr.trim()));

  if (sameNameUsers.length > 0) {
    const isPlanning = (d: string | null) =>
      !!d && (d.includes("تخطيط") || d.toLowerCase().includes("planning"));

    const existingHasAdminOrPlanning = sameNameUsers.some(
      (u) => u.role === "admin" || isPlanning(u.directorate)
    );
    const newIsPlanning = typeof directorate === "string" && isPlanning(directorate);
    const maxAccounts = existingHasAdminOrPlanning || newIsPlanning ? 2 : 1;

    if (sameNameUsers.length >= maxAccounts) {
      res.status(409).json({ error: "account_limit_reached" });
      return;
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(usersTable)
    .values({
      nameAr: nameAr.trim(),
      nameEn: typeof nameEn === "string" && nameEn.trim() ? nameEn.trim() : null,
      username: username.trim(),
      passwordHash,
      designation: typeof designation === "string" && designation ? designation : null,
      directorate: typeof directorate === "string" && directorate ? directorate : null,
      department: typeof department === "string" && department ? department : null,
      section: typeof section === "string" && section ? section : null,
      role: "employee",
      active: true,
    })
    .returning();

  res.status(201).json({
    id: user.id,
    nameAr: user.nameAr,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
